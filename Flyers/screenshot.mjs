import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const flyers = [
  'flyer_1.html',
  'flyer_2.html',
  'flyer_3.html',
  'flyer_4.html',
  'flyer_5.html',
];

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
});

for (const flyer of flyers) {
  const flyerPath = path.join(__dirname, flyer);
  const flyerUrl = `file:///${flyerPath.replace(/\\/g, '/')}`;
  const name = path.basename(flyer, '.html');
  const outputPath = path.join(outputDir, `${name}.png`);

  console.log(`📸 Screenshotting ${flyer}...`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
  
  await page.goto(flyerUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait for images to load
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      });
    }));
  });

  // Extra wait for fonts & animations
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: outputPath,
    fullPage: false,
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1080 },
  });

  console.log(`✅ Saved: output/${name}.png`);
  await page.close();
}

await browser.close();
console.log('\n🎉 All 5 flyers saved to Flyers/output/');
