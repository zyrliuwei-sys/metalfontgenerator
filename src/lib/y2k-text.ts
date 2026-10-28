export type Y2kFinish = 'silver' | 'ice' | 'pink';

export type Y2kTextSettings = {
  text: string;
  finish: Y2kFinish;
  depth: number;
  tracking: number;
  slant: number;
  typeface: 'vector' | 'classic';
  light: number;
};

export const Y2K_DEFAULTS: Y2kTextSettings = {
  text: 'FUTURE',
  finish: 'silver',
  depth: 16,
  tracking: 2,
  slant: 12,
  typeface: 'vector',
  light: 50,
};

export const Y2K_PALETTES = {
  silver: {
    face: [
      '#ffffff',
      '#c6d4e1',
      '#66788f',
      '#f4fcff',
      '#ffffff',
      '#16283f',
      '#728ba7',
      '#e9f7ff',
      '#ffffff',
    ],
    edge: '#e9f5ff',
    side: '#24364e',
    sideLight: '#8ca4bb',
  },
  ice: {
    face: [
      '#ffffff',
      '#c8f8ff',
      '#4395d2',
      '#e2fcff',
      '#ffffff',
      '#103b8b',
      '#3f9cde',
      '#b7f5ff',
      '#ffffff',
    ],
    edge: '#c7fbff',
    side: '#16356a',
    sideLight: '#62bcde',
  },
  pink: {
    face: [
      '#fff8fe',
      '#ffc8ef',
      '#c965a4',
      '#ffe5f7',
      '#ffffff',
      '#6b1d60',
      '#cf67af',
      '#ffcaf0',
      '#ffffff',
    ],
    edge: '#ffe0f5',
    side: '#5c214e',
    sideLight: '#c87aaf',
  },
} satisfies Record<
  Y2kFinish,
  {
    face: string[];
    edge: string;
    side: string;
    sideLight: string;
  }
>;

export const Y2K_EXAMPLES: Y2kTextSettings[] = [
  {
    text: 'AFTERHOURS',
    finish: 'silver',
    depth: 18,
    tracking: 0,
    slant: 14,
    typeface: 'vector',
    light: 48,
  },
  {
    text: 'CYBER CLUB',
    finish: 'ice',
    depth: 12,
    tracking: 5,
    slant: 10,
    typeface: 'vector',
    light: 62,
  },
  {
    text: 'SUPERSTAR',
    finish: 'pink',
    depth: 10,
    tracking: 1,
    slant: 8,
    typeface: 'classic',
    light: 40,
  },
];
