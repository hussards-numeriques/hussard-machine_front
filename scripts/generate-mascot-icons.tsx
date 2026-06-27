import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';
import { Mascot } from '../src/components/Mascot/Mascot';
import { MaskableIcon, OgBanner } from '../src/components/Mascot/SocialAssets';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p: string) => resolve(root, 'public', p);
const fontPath = resolve(root, 'scripts/assets/Nunito-ExtraBold.ttf');

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n';

const svgOf = (node: React.ReactElement): string => XML_HEADER + renderToStaticMarkup(node);

const fontOption = { fontFiles: [fontPath], defaultFontFamily: 'Nunito', loadSystemFonts: false };

const pngFrom = (svg: string, width: number, withFont = false): Buffer => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    ...(withFont ? { font: fontOption } : {}),
  });
  return resvg.render().asPng();
};

const writeFile = (relPath: string, data: string | Buffer) => {
  const full = pub(relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, data);
  console.log('wrote', relPath);
};

const main = async () => {
  const faviconSvg = svgOf(<Mascot pose="tete" title="Calc Rush" />);
  const joyeuxSvg = svgOf(<Mascot pose="joyeux" title="Rushy" />);
  const maskableSvg = svgOf(<MaskableIcon />);
  const ogSvg = svgOf(<OgBanner />);

  writeFile('favicon.svg', faviconSvg);
  writeFile('mascot/rushy-joyeux.svg', joyeuxSvg);

  writeFile('apple-touch-icon.png', pngFrom(joyeuxSvg, 180));
  writeFile('icon-192.png', pngFrom(joyeuxSvg, 192));
  writeFile('icon-512.png', pngFrom(joyeuxSvg, 512));
  writeFile('icon-maskable-512.png', pngFrom(maskableSvg, 512));
  writeFile('og-image.png', pngFrom(ogSvg, 1200, true));

  const ico = await pngToIco([
    pngFrom(faviconSvg, 16),
    pngFrom(faviconSvg, 32),
    pngFrom(faviconSvg, 48),
  ]);
  writeFile('favicon.ico', ico);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
