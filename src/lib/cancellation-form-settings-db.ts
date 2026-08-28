import {
  defaultCancellationFormSettings,
  normalizeCancellationFormSettings,
  type CancellationFormSettings,
} from "@/lib/cancellation-form-settings";
import { getDbPool } from "@/lib/db";

export async function getCancellationFormSettings() {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .execute("bz.SP_Appointments_CancellationFormSettings_Get");
  return normalizeCancellationFormSettings(result.recordset?.[0] ?? defaultCancellationFormSettings);
}

export async function saveCancellationFormSettings(actorUserId: string, settings: CancellationFormSettings) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ActorUserId", actorUserId)
    .input("TitleFont", settings.TitleFont)
    .input("TitleFontSize", settings.TitleFontSize)
    .input("TitleFontWeight", settings.TitleFontWeight)
    .input("RecipientFont", settings.RecipientFont)
    .input("RecipientFontSize", settings.RecipientFontSize)
    .input("RecipientFontWeight", settings.RecipientFontWeight)
    .input("SignerFont", settings.SignerFont)
    .input("SignerFontSize", settings.SignerFontSize)
    .input("SignerFontWeight", settings.SignerFontWeight)
    .input("BodyFont", settings.BodyFont)
    .input("BodyFontSize", settings.BodyFontSize)
    .input("BodyFontWeight", settings.BodyFontWeight)
    .input("BodyLineHeight", settings.BodyLineHeight)
    .input("DataFont", settings.DataFont)
    .input("DataFontSize", settings.DataFontSize)
    .input("DataFontWeight", settings.DataFontWeight)
    .input("TitleBottomSpacing", settings.TitleBottomSpacing)
    .input("RecipientBottomSpacing", settings.RecipientBottomSpacing)
    .input("BodyFirstLineIndent", settings.BodyFirstLineIndent)
    .input("ReasonsTitleTopSpacing", settings.ReasonsTitleTopSpacing)
    .input("ReasonsTitleFont", settings.ReasonsTitleFont)
    .input("ReasonsTitleFontSize", settings.ReasonsTitleFontSize)
    .input("ReasonsTitleFontWeight", settings.ReasonsTitleFontWeight)
    .input("ReasonsFont", settings.ReasonsFont)
    .input("ReasonsFontSize", settings.ReasonsFontSize)
    .input("ReasonsFontWeight", settings.ReasonsFontWeight)
    .input("ReasonsLineHeight", settings.ReasonsLineHeight)
    .input("ReasonsRowHeight", settings.ReasonsRowHeight)
    .input("CopyFont", settings.CopyFont)
    .input("CopyFontSize", settings.CopyFontSize)
    .input("CopyFontWeight", settings.CopyFontWeight)
    .execute("bz.SP_Appointments_CancellationFormSettings_Save");
  return normalizeCancellationFormSettings(result.recordset?.[0] ?? settings);
}
