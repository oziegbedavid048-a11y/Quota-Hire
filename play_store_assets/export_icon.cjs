const puppeteer = require('puppeteer');
const path = require('path');

async function exportIcon() {
  console.log('📸 Exporting real app icon at 512x512...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });

  const filePath = path.resolve(__dirname, 'app_icon_512.html');
  const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;

  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));

  const outputPath = path.resolve(__dirname, 'app_icon_512x512.png');

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 512, height: 512 }
  });

  await browser.close();

  const fs = require('fs');
  const stats = fs.statSync(outputPath);
  console.log(`✅ Saved: app_icon_512x512.png (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log(`📂 Location: ${outputPath}`);
}

exportIcon().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
