// Standard GOV.UK-style UK postcode pattern (area + district, optional
// space, unit). Deliberately permissive about internal whitespace since
// transcribed/typed addresses are inconsistent.
const UK_POSTCODE_RE =
  /\b([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})\b/;

const ADDRESS_FILLER_PHRASES = [
  "not sure",
  "i think",
  "somewhere near",
  "can't remember",
  "cant remember",
  "don't know the postcode",
  "dont know the postcode",
  "no fixed address",
];

export function containsValidUkPostcode(address: string): boolean {
  return UK_POSTCODE_RE.test(address);
}

export function containsAddressFillerPhrase(address: string): boolean {
  const lower = address.toLowerCase();
  return ADDRESS_FILLER_PHRASES.some((phrase) => lower.includes(phrase));
}
