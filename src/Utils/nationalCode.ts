const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toLatinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

export function numericInput(value: string, maxLength?: number) {
  const digits = toLatinDigits(value).replace(/\D/g, "");
  return maxLength === undefined ? digits : digits.slice(0, maxLength);
}

export function isValidIranianNationalCode(value: string) {
  const nationalCode = toLatinDigits(value).trim();

  if (
    !/^\d{10}$/.test(nationalCode) ||
    nationalCode.startsWith("000") ||
    /^(\d)\1{9}$/.test(nationalCode)
  ) {
    return false;
  }

  const checkDigit = Number(nationalCode[9]);
  const sum = nationalCode
    .slice(0, 9)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  const expectedCheckDigit = remainder < 2 ? remainder : 11 - remainder;

  return checkDigit === expectedCheckDigit;
}
