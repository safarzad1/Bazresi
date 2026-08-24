import {
  pbkdf2 as pbkdf2Callback,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const pbkdf2 = promisify(pbkdf2Callback);

const IDENTITY_V2_MARKER = 0x00;
const IDENTITY_V3_MARKER = 0x01;
const IDENTITY_V3_PRF_HMAC_SHA512 = 2;

const prfAlgorithms: Record<number, "sha1" | "sha256" | "sha512"> = {
  0: "sha1",
  1: "sha256",
  2: "sha512",
};

async function verifyV2(password: string, decoded: Buffer) {
  if (decoded.length !== 49) return false;

  const salt = decoded.subarray(1, 17);
  const expectedSubkey = decoded.subarray(17);
  const actualSubkey = await pbkdf2(password, salt, 1_000, 32, "sha1");
  return timingSafeEqual(expectedSubkey, actualSubkey);
}

async function verifyV3(password: string, decoded: Buffer) {
  if (decoded.length < 14) return false;

  const prf = decoded.readUInt32BE(1);
  const iterations = decoded.readUInt32BE(5);
  const saltLength = decoded.readUInt32BE(9);
  const algorithm = prfAlgorithms[prf];

  if (
    !algorithm ||
    iterations < 1 ||
    iterations > 10_000_000 ||
    saltLength < 8 ||
    decoded.length <= 13 + saltLength
  ) {
    return false;
  }

  const salt = decoded.subarray(13, 13 + saltLength);
  const expectedSubkey = decoded.subarray(13 + saltLength);
  const actualSubkey = await pbkdf2(
    password,
    salt,
    iterations,
    expectedSubkey.length,
    algorithm,
  );

  return timingSafeEqual(expectedSubkey, actualSubkey);
}

export async function verifyAspNetIdentityPassword(
  password: string,
  passwordHash: string,
) {
  try {
    const decoded = Buffer.from(passwordHash, "base64");

    if (decoded[0] === IDENTITY_V2_MARKER) {
      return verifyV2(password, decoded);
    }

    if (decoded[0] === IDENTITY_V3_MARKER) {
      return verifyV3(password, decoded);
    }

    return false;
  } catch {
    return false;
  }
}

export async function hashAspNetIdentityPassword(
  password: string,
  iterations = 100_000,
) {
  const salt = randomBytes(16);
  const subkey = await pbkdf2(password, salt, iterations, 32, "sha512");
  const output = Buffer.alloc(13 + salt.length + subkey.length);

  output[0] = IDENTITY_V3_MARKER;
  output.writeUInt32BE(IDENTITY_V3_PRF_HMAC_SHA512, 1);
  output.writeUInt32BE(iterations, 5);
  output.writeUInt32BE(salt.length, 9);
  salt.copy(output, 13);
  subkey.copy(output, 13 + salt.length);

  return output.toString("base64");
}
