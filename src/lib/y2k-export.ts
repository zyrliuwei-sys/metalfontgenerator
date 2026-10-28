import fontUrl from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2?url';

let embeddedFont: Promise<string> | undefined;

function getEmbeddedFont() {
  embeddedFont ??= fetch(fontUrl)
    .then((response) => {
      if (!response.ok) throw new Error('Font could not be loaded');
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Font could not be read'));
          reader.readAsDataURL(blob);
        })
    )
    .catch((error: unknown) => {
      embeddedFont = undefined;
      throw error;
    });
  return embeddedFont;
}

/** Embed the same local font so SVG image decoding never substitutes a font. */
export async function exportY2kPng(source: SVGSVGElement, text: string) {
  const svg = source.cloneNode(true) as SVGSVGElement;
  await document.fonts.ready;
  const font = await getEmbeddedFont();
  svg.setAttribute('width', '2400');
  svg.setAttribute('height', '1200');
  svg.setAttribute('viewBox', '0 0 1200 600');
  svg.removeAttribute('class');
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `@font-face{font-family:"IBM Plex Sans Variable";font-style:normal;font-weight:100 700;src:url("${font}") format("woff2")}`;
  svg.insertBefore(style, svg.firstChild);
  const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error('Lettering could not be rendered'));
      image.src = svgUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1200;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('PNG could not be created')),
        'image/png'
      )
    );
    const pngUrl = URL.createObjectURL(png);
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `y2k-${
      text
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .slice(0, 30) || 'lettering'
    }.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(pngUrl), 30_000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
