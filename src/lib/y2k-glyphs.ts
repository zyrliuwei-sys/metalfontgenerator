/** Vector 2000: an original chamfered display alphabet, drawn on an 80-unit grid. */
export const Y2K_GLYPHS: Record<string, { width: number; path: string }> = {
  A: {
    width: 76,
    path: 'M0 80 22 0H54L76 80H57L52 61H24L19 80ZM28 45H48L40 16H36Z',
  },
  B: {
    width: 72,
    path: 'M0 0H55L70 15V31L61 40 72 51V65L57 80H0ZM18 16V32H48L53 27V21L48 16ZM18 48V64H50L55 59V53L50 48Z',
  },
  C: { width: 72, path: 'M17 0H72V18H25L18 25V55L25 62H72V80H17L0 63V17Z' },
  D: {
    width: 74,
    path: 'M0 0H52L74 22V58L52 80H0ZM18 18V62H44L56 50V30L44 18Z',
  },
  E: { width: 68, path: 'M14 0H68V17H20V32H60V48H20V63H68V80H14L0 66V14Z' },
  F: { width: 68, path: 'M14 0H68V18H20V34H59V52H20V80H0V14Z' },
  G: {
    width: 76,
    path: 'M17 0H74V18H25L18 25V55L25 62H58V49H40V34H76V80H17L0 63V17Z',
  },
  H: { width: 74, path: 'M0 0H19V31H55V0H74V80H55V49H19V80H0Z' },
  I: { width: 30, path: 'M0 0H30V80H0Z' },
  J: { width: 66, path: 'M47 0H66V63L49 80H16L0 64V49H19V57L24 62H41L47 56Z' },
  K: { width: 76, path: 'M0 0H19V31H29L53 0H76L45 39 77 80H53L29 49H19V80H0Z' },
  L: { width: 66, path: 'M0 0H20V61H66V80H14L0 66Z' },
  M: {
    width: 96,
    path: 'M0 80V0H23L48 41 73 0H96V80H77V29L54 65H42L19 29V80Z',
  },
  N: { width: 78, path: 'M0 80V0H20L59 51V0H78V80H58L19 29V80Z' },
  O: {
    width: 78,
    path: 'M18 0H60L78 18V62L60 80H18L0 62V18ZM25 18 19 24V56L25 62H53L59 56V24L53 18Z',
  },
  P: {
    width: 72,
    path: 'M0 80V0H55L72 17V36L55 53H20V80ZM20 17V36H47L53 30V23L47 17Z',
  },
  Q: {
    width: 80,
    path: 'M18 0H60L78 18V60L66 72 80 80H53L47 76H18L0 58V18ZM25 18 19 24V51L25 58H38L30 48H51L59 56V24L53 18Z',
  },
  R: {
    width: 78,
    path: 'M0 80V0H55L72 17V35L58 49 78 80H55L36 51H20V80ZM20 17V34H47L53 28V23L47 17Z',
  },
  S: {
    width: 72,
    path: 'M16 0H72V17H24L18 23V29L24 33H56L72 49V64L56 80H0V63H48L54 57V53L48 49H16L0 33V16Z',
  },
  T: { width: 76, path: 'M0 0H76V19H48V80H28V19H0Z' },
  U: { width: 76, path: 'M0 0H19V55L26 62H50L57 55V0H76V63L59 80H17L0 63Z' },
  V: { width: 78, path: 'M0 0H21L36 59H42L57 0H78L56 80H22Z' },
  W: {
    width: 106,
    path: 'M0 0H20L29 55 44 17H62L77 55 86 0H106L91 80H72L53 38 34 80H15Z',
  },
  X: {
    width: 78,
    path: 'M0 0H23L39 25 55 0H78L51 40 78 80H55L39 55 23 80H0L27 40Z',
  },
  Y: { width: 78, path: 'M0 0H23L39 28 55 0H78L49 48V80H29V48Z' },
  Z: { width: 74, path: 'M0 0H74V17L25 62H74V80H0V63L49 18H0Z' },
  '0': {
    width: 76,
    path: 'M17 0H59L76 17V63L59 80H17L0 63V17ZM24 18 18 24V56L24 62H52L58 56V24L52 18Z',
  },
  '1': { width: 40, path: 'M0 14 18 0H40V80H20V23L0 36Z' },
  '2': { width: 72, path: 'M0 0H55L72 17V32L23 62H72V80H0V58L54 24V18H0Z' },
  '3': {
    width: 72,
    path: 'M0 0H55L72 17V31L61 40 72 51V64L56 80H0V62H49L54 57V53L49 48H20V32H49L54 27V23L49 18H0Z',
  },
  '4': { width: 76, path: 'M0 0H19V32H50V0H69V32H76V50H69V80H50V50H0Z' },
  '5': {
    width: 72,
    path: 'M0 0H72V18H19V31H55L72 48V63L55 80H0V62H47L53 56V55L47 49H0Z',
  },
  '6': {
    width: 74,
    path: 'M17 0H74V18H25L19 24V31H57L74 48V63L57 80H17L0 63V17ZM19 49V56L25 62H49L55 56V54L50 49Z',
  },
  '7': { width: 74, path: 'M0 0H74V17L39 80H16L52 18H0Z' },
  '8': {
    width: 74,
    path: 'M17 0H57L74 17V30L64 40 74 50V63L57 80H17L0 63V50L10 40 0 30V17ZM24 17 18 23V28L24 33H50L56 28V23L50 17ZM24 48 18 54V57L24 63H50L56 57V54L50 48Z',
  },
  '9': {
    width: 74,
    path: 'M17 0H57L74 17V63L57 80H0V62H49L55 56V49H17L0 32V17ZM24 18 19 23V26L24 31H55V24L49 18Z',
  },
  '-': { width: 44, path: 'M0 31H44V49H0Z' },
  _: { width: 64, path: 'M0 65H64V80H0Z' },
  '.': { width: 20, path: 'M0 60H20V80H0Z' },
  ',': { width: 20, path: 'M0 60H20V80L8 94H0L7 80H0Z' },
  ':': { width: 20, path: 'M0 10H20V30H0ZM0 60H20V80H0Z' },
  '!': { width: 22, path: 'M0 0H22L19 51H3ZM1 62H21V80H1Z' },
  '?': {
    width: 70,
    path: 'M0 0H53L70 17V33L44 51V55H25V41L51 23V18H0ZM25 63H44V80H25Z',
  },
  '/': { width: 50, path: 'M32 0H50L18 80H0Z' },
  '+': { width: 64, path: 'M23 8H41V31H64V49H41V72H23V49H0V31H23Z' },
  '=': { width: 64, path: 'M0 16H64V33H0ZM0 47H64V64H0Z' },
  "'": { width: 18, path: 'M0 0H18V21L7 34H0L5 20H0Z' },
  '"': { width: 42, path: 'M0 0H17V24H0ZM25 0H42V24H25Z' },
  '(': { width: 30, path: 'M16 0H30L17 20V60L30 80H16L0 60V20Z' },
  ')': { width: 30, path: 'M0 0H14L30 20V60L14 80H0L13 60V20Z' },
};

export function layoutY2kGlyphs(text: string, tracking: number) {
  let x = 0;
  const glyphs = [...text].map((letter) => {
    const glyph = Y2K_GLYPHS[letter];
    const width = letter === ' ' ? 36 : (glyph?.width ?? 62);
    const result = { letter, path: glyph?.path, width, x };
    x += width + 9 + tracking;
    return result;
  });
  return { glyphs, width: Math.max(1, x - 9 - tracking) };
}
