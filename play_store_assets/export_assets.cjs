const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.resolve(__dirname);

const assets = [
  {
    name: 'app_icon_512',
    file: 'app_icon_512.html',
    width: 512,
    height: 512,
    output: 'app_icon_512x512.png',
    description: 'App Icon (512x512)'
  },
  {
    name: 'feature_graphic',
    file: 'feature_graphic.html',
    width: 1024,
    height: 500,
    output: 'feature_graphic_1024x500.png',
    description: 'Feature Graphic (1024x500)'
  },
  {
    name: 'phone_screenshot_1',
    file: 'phone_screenshot_1.html',
    width: 1080,
    height: 1920,
    output: 'phone_screenshot_1_1080x1920.png',
    description: 'Phone Screenshot 1 - Profile (1080x1920)'
  },
  {
    name: 'phone_screenshot_2',
    file: 'phone_screenshot_2.html',
    width: 1080,
    height: 1920,
    output: 'phone_screenshot_2_1080x1920.png',
    description: 'Phone Screenshot 2 - CV Generator (1080x1920)'
  },
  {
    name: 'phone_screenshot_3',
    file: 'phone_screenshot_3.html',
    width: 1080,
    height: 1920,
    output: 'phone_screenshot_3_1080x1920.png',
    description: 'Phone Screenshot 3 - Community (1080x1920)'
  },
  {
    name: 'phone_screenshot_4',
    file: 'phone_screenshot_4.html',
    width: 1080,
    height: 1920,
    output: 'phone_screenshot_4_1080x1920.png',
    description: 'Phone Screenshot 4 - Unlock Career (1080x1920)'
  },
  {
    name: 'tablet_7inch',
    file: 'tablet_7inch_screenshot.html',
    width: 1200,
    height: 1920,
    output: 'tablet_7inch_1200x1920.png',
    description: '7-inch Tablet Screenshot (1200x1920)'
  },
  {
    name: 'tablet_10inch',
    file: 'tablet_10inch_screenshot.html',
    width: 2560,
    height: 1600,
    output: 'tablet_10inch_2560x1600.png',
    description: '10-inch Tablet Screenshot (2560x1600)'
  }
];

async function exportAssets() {
  console.log('\n🚀 Starting Quota Hire Play Store Asset Export...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
      '--disable-lcd-text'
    ]
  });

  let success = 0;
  let failed = 0;

  for (const asset of assets) {
    const filePath = path.join(ASSETS_DIR, asset.file);
    const outputPath = path.join(ASSETS_DIR, asset.output);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ SKIPPED (file not found): ${asset.file}`);
      failed++;
      continue;
    }

    try {
      console.log(`📸 Exporting: ${asset.description}...`);

      const page = await browser.newPage();

      await page.setViewport({
        width: asset.width,
        height: asset.height,
        deviceScaleFactor: 1
      });

      const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
      await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for web fonts to load
      await page.evaluateHandle('document.fonts.ready');
      await new Promise(r => setTimeout(r, 800));

      await page.screenshot({
        path: outputPath,
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width: asset.width,
          height: asset.height
        }
      });

      await page.close();

      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`   ✅ Saved: ${asset.output} (${sizeKB} KB)`);
      success++;

    } catch (err) {
      console.log(`   ❌ Failed: ${asset.file}`);
      console.log(`      Error: ${err.message}`);
      failed++;
    }
  }

  await browser.close();

  console.log('\n────────────────────────────────────────');
  console.log(`✅ Successfully exported: ${success} assets`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} assets`);
  }
  console.log('\n📂 All assets saved to:');
  console.log(`   ${ASSETS_DIR}`);
  console.log('\n📋 Play Store Asset Summary:');
  console.log('   • app_icon_512x512.png             → App Icon');
  console.log('   • feature_graphic_1024x500.png     → Feature Graphic');
  console.log('   • phone_screenshot_1_1080x1920.png → Phone Screenshot 1');
  console.log('   • phone_screenshot_2_1080x1920.png → Phone Screenshot 2');
  console.log('   • phone_screenshot_3_1080x1920.png → Phone Screenshot 3');
  console.log('   • phone_screenshot_4_1080x1920.png → Phone Screenshot 4');
  console.log('   • tablet_7inch_1200x1920.png       → 7-inch Tablet Screenshot');
  console.log('   • tablet_10inch_2560x1600.png      → 10-inch Tablet Screenshot');
  console.log('\n🎉 Done! Upload these PNG files to your Google Play Console.\n');
}

exportAssets().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
