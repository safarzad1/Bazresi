type FormatThousandsOptions = {
  decimalScale?: number;
};

export function formatThousands(
  input: string | number | null | undefined,
  options: FormatThousandsOptions = {},
) {
  const decimalScale = Math.max(0, options.decimalScale ?? 2);
  const normalized = String(input ?? "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/,/g, "")
    .replace(/[^0-9.\-]/g, "");

  if (!normalized) return "";

  const negative = normalized.startsWith("-") ? "-" : "";
  const unsigned = normalized.replace(/-/g, "");
  const [integerPart = "", ...decimalParts] = unsigned.split(".");
  const integer = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (decimalScale === 0 || decimalParts.length === 0) {
    return `${negative}${grouped}`;
  }

  const decimal = decimalParts.join("").slice(0, decimalScale);
  return decimal ? `${negative}${grouped}.${decimal}` : `${negative}${grouped}`;
}
