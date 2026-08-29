export const cancellationFontOptions = [
  { value: "IranNastaliq", label: "IranNastaliq" },
  { value: "titr", label: "Titr" },
  { value: "MitraBold", label: "MitraBold" },
  { value: "bnaznin", label: "Bnaznin" },
  { value: "PeydaFaNum_Regular", label: "Peyda" },
  { value: "IRANSansXMedium", label: "IRANSans" },
  { value: "Shabnam", label: "شبنم" },
] as const;

export type CancellationFontName = (typeof cancellationFontOptions)[number]["value"];

export type CancellationFormSettings = {
  TitleFont: CancellationFontName;
  TitleFontSize: number;
  TitleFontWeight: 400 | 700;
  RecipientFont: CancellationFontName;
  RecipientFontSize: number;
  RecipientFontWeight: 400 | 700;
  SignerFont: CancellationFontName;
  SignerFontSize: number;
  SignerFontWeight: 400 | 700;
  BodyFont: CancellationFontName;
  BodyFontSize: number;
  BodyFontWeight: 400 | 700;
  BodyLineHeight: number;
  DataFont: CancellationFontName;
  DataFontSize: number;
  DataFontWeight: 400 | 700;
  TitleBottomSpacing: number;
  RecipientBottomSpacing: number;
  BodyFirstLineIndent: number;
  ReasonsTitleTopSpacing: number;
  ReasonsTitleFont: CancellationFontName;
  ReasonsTitleFontSize: number;
  ReasonsTitleFontWeight: 400 | 700;
  ReasonsFont: CancellationFontName;
  ReasonsFontSize: number;
  ReasonsFontWeight: 400 | 700;
  ReasonsLineHeight: number;
  ReasonsRowHeight: number;
  CopyFont: CancellationFontName;
  CopyFontSize: number;
  CopyFontWeight: 400 | 700;
};

export const defaultCancellationFormSettings: CancellationFormSettings = {
  TitleFont: "IranNastaliq",
  TitleFontSize: 20,
  TitleFontWeight: 400,
  RecipientFont: "titr",
  RecipientFontSize: 20,
  RecipientFontWeight: 700,
  SignerFont: "titr",
  SignerFontSize: 14,
  SignerFontWeight: 400,
  BodyFont: "MitraBold",
  BodyFontSize: 14,
  BodyFontWeight: 400,
  BodyLineHeight: 2.4,
  DataFont: "bnaznin",
  DataFontSize: 15.5,
  DataFontWeight: 400,
  TitleBottomSpacing: 18,
  RecipientBottomSpacing: 24,
  BodyFirstLineIndent: 24,
  ReasonsTitleTopSpacing: 20,
  ReasonsTitleFont: "titr",
  ReasonsTitleFontSize: 18,
  ReasonsTitleFontWeight: 400,
  ReasonsFont: "MitraBold",
  ReasonsFontSize: 14,
  ReasonsFontWeight: 400,
  ReasonsLineHeight: 1.65,
  ReasonsRowHeight: 38,
  CopyFont: "MitraBold",
  CopyFontSize: 16,
  CopyFontWeight: 700,
};

const allowedFonts = new Set<CancellationFontName>(cancellationFontOptions.map((item) => item.value));

function font(value: unknown, fallback: CancellationFontName) {
  return typeof value === "string" && allowedFonts.has(value as CancellationFontName)
    ? value as CancellationFontName
    : fallback;
}

function number(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed * 100) / 100));
}

function weight(value: unknown, fallback: 400 | 700): 400 | 700 {
  return Number(value) === 700 ? 700 : Number(value) === 400 ? 400 : fallback;
}

export function normalizeCancellationFormSettings(value: unknown): CancellationFormSettings {
  const item = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const defaults = defaultCancellationFormSettings;

  return {
    TitleFont: font(item.TitleFont, defaults.TitleFont),
    TitleFontSize: number(item.TitleFontSize, defaults.TitleFontSize, 18, 60),
    TitleFontWeight: weight(item.TitleFontWeight, defaults.TitleFontWeight),
    RecipientFont: font(item.RecipientFont, defaults.RecipientFont),
    RecipientFontSize: number(item.RecipientFontSize, defaults.RecipientFontSize, 12, 40),
    RecipientFontWeight: weight(item.RecipientFontWeight, defaults.RecipientFontWeight),
    SignerFont: font(item.SignerFont, defaults.SignerFont),
    SignerFontSize: number(item.SignerFontSize, defaults.SignerFontSize, 11, 36),
    SignerFontWeight: weight(item.SignerFontWeight, defaults.SignerFontWeight),
    BodyFont: font(item.BodyFont, defaults.BodyFont),
    BodyFontSize: number(item.BodyFontSize, defaults.BodyFontSize, 11, 30),
    BodyFontWeight: weight(item.BodyFontWeight, defaults.BodyFontWeight),
    BodyLineHeight: number(item.BodyLineHeight, defaults.BodyLineHeight, 1.2, 3),
    DataFont: font(item.DataFont, defaults.DataFont),
    DataFontSize: number(item.DataFontSize, defaults.DataFontSize, 10, 30),
    DataFontWeight: weight(item.DataFontWeight, defaults.DataFontWeight),
    TitleBottomSpacing: number(item.TitleBottomSpacing, defaults.TitleBottomSpacing, 0, 100),
    RecipientBottomSpacing: number(item.RecipientBottomSpacing, defaults.RecipientBottomSpacing, 0, 100),
    BodyFirstLineIndent: number(item.BodyFirstLineIndent, defaults.BodyFirstLineIndent, 0, 100),
    ReasonsTitleTopSpacing: number(item.ReasonsTitleTopSpacing, defaults.ReasonsTitleTopSpacing, 0, 100),
    ReasonsTitleFont: font(item.ReasonsTitleFont, defaults.ReasonsTitleFont),
    ReasonsTitleFontSize: number(item.ReasonsTitleFontSize, defaults.ReasonsTitleFontSize, 10, 28),
    ReasonsTitleFontWeight: weight(item.ReasonsTitleFontWeight, defaults.ReasonsTitleFontWeight),
    ReasonsFont: font(item.ReasonsFont, defaults.ReasonsFont),
    ReasonsFontSize: number(item.ReasonsFontSize, defaults.ReasonsFontSize, 10, 28),
    ReasonsFontWeight: weight(item.ReasonsFontWeight, defaults.ReasonsFontWeight),
    ReasonsLineHeight: number(item.ReasonsLineHeight, defaults.ReasonsLineHeight, 1.1, 3),
    ReasonsRowHeight: number(item.ReasonsRowHeight, defaults.ReasonsRowHeight, 24, 100),
    CopyFont: font(item.CopyFont, defaults.CopyFont),
    CopyFontSize: number(item.CopyFontSize, defaults.CopyFontSize, 10, 28),
    CopyFontWeight: weight(item.CopyFontWeight, defaults.CopyFontWeight),
  };
}

export function cancellationFontFamily(fontName: CancellationFontName) {
  return `${fontName}, Tahoma, Arial, sans-serif`;
}
