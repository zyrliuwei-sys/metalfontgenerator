type MetalFontExportOptions = {
  word: string;
  finish: 'steel' | 'copper' | 'black-chrome' | 'brushed';
  angle: number;
  extrusion: number;
  light: number;
  tracking: number;
  fontFamily: string;
};

/** Render a transparent PNG without including workbench controls or rulers. */
export async function exportMetalFont(options: MetalFontExportOptions) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = 1200;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');

  const { word, finish, angle, extrusion, light, tracking, fontFamily } =
    options;
  const scale = 3;
  let fontSize = 300;
  const spacing = tracking * scale;
  const measure = () => {
    context.font = `700 ${fontSize}px ${fontFamily}`;
    return (
      [...word].reduce(
        (width, letter) => width + context.measureText(letter).width,
        0
      ) +
      Math.max(0, [...word].length - 1) * spacing
    );
  };
  let width = measure();
  if (width > 1900) {
    fontSize *= 1900 / width;
    width = measure();
  }
  const palette = {
    steel: ['#f0f2f5', '#9199a5', '#e1e4e8', '#465365', '#f5f3ef'],
    copper: ['#f4c99b', '#cd8542', '#704a2b', '#eeb885', '#f4c99b'],
    'black-chrome': ['#939aa7', '#30343e', '#c5ccd6', '#0b0e16', '#526073'],
    brushed: ['#c7ccd5', '#9199a5', '#eeeef0', '#9098a5', '#dadde2'],
  }[finish];
  const sides = {
    steel: '#394352',
    copper: '#80532f',
    'black-chrome': '#10131b',
    brushed: '#404956',
  };
  const highlight = (light - 50) * 2;
  const gradient = context.createLinearGradient(
    -width / 2 + highlight,
    -fontSize / 2,
    width / 2 + highlight,
    fontSize / 2
  );
  palette.forEach((color, index) =>
    gradient.addColorStop(index / (palette.length - 1), color)
  );

  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(Math.cos((angle * Math.PI) / 180), 0.996);
  context.transform(1, 0.025, 0, 1, 0, 0);
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = 2;
  const drawWord = (xOffset: number, yOffset: number) => {
    let x = -width / 2 + xOffset;
    for (const letter of word) {
      context.strokeText(letter, x, yOffset);
      context.fillText(letter, x, yOffset);
      x += context.measureText(letter).width + spacing;
    }
  };
  context.fillStyle = sides[finish];
  context.strokeStyle = sides[finish];
  const depth = extrusion * scale;
  for (let step = depth; step > 0; step--) drawWord(-step * 0.55, step * 0.6);
  context.fillStyle = gradient;
  context.strokeStyle = palette[0];
  drawWord(0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error('PNG export failed')),
      'image/png'
    );
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `metalfontgenerator-${word.replace(/[^a-z0-9_-]/gi, '-').slice(0, 40) || 'text'}-${finish}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
