const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, 'play_store_assets');

// Ensure image paths use file:// URLs for Puppeteer
const getFileUrl = (filename) => {
  const p = path.join(ASSETS_DIR, filename);
  return 'file:///' + p.replace(/\\/g, '/');
};

const iconUrl = 'file:///' + path.join(__dirname, 'mobile/assets/images/icon.png').replace(/\\/g, '/');
const profileShot = getFileUrl('Screenshot_2026-08-11-19-26-37-07_e66e5bc39d7a66a7069feea54c79b99c.jpg');
const communityShot = getFileUrl('Screenshot_2026-08-11-19-27-05-89_e66e5bc39d7a66a7069feea54c79b99c.jpg');
const cvShot = getFileUrl('Screenshot_2026-08-11-19-27-24-36_e66e5bc39d7a66a7069feea54c79b99c.jpg');
const dashShot = getFileUrl('IMG_20260811_190541.png');

function buildHtml({
  width,
  height,
  headline,
  subtext,
  screenshotUrl,
  isLandscape = false,
  isIcon = false
}) {
  if (isIcon) {
    return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 512px;
    height: 512px;
    background: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  img {
    width: 512px;
    height: 512px;
    object-fit: contain;
  }
</style>
</head>
<body>
  <img src="${iconUrl}" />
</body>
</html>`;
  }

  // Common CSS for screenshots and feature graphic matching IMG_20260811_190541.png
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Inter:wght@800;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${width}px;
    height: ${height}px;
    background: linear-gradient(135deg, #eaf2e5 0%, #dce8d7 100%);
    position: relative;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
  }

  /* 3D Geometric Blocks in Background (Matching Reference Image) */
  .bg-grid {
    position: absolute;
    width: 250%;
    height: 250%;
    top: -50%;
    left: -50%;
    transform: rotateX(50deg) rotateZ(-35deg) skewX(-10deg);
    transform-style: preserve-3d;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-gap: 24px;
    opacity: 0.85;
  }

  .tile {
    height: 180px;
    border-radius: 12px;
    background: #c2e2b8;
    box-shadow: -10px 10px 0px #a4cf99, -20px 20px 25px rgba(45, 85, 35, 0.15);
  }

  .tile.light {
    background: #d8edd1;
    box-shadow: -10px 10px 0px #bee0b3, -20px 20px 25px rgba(45, 85, 35, 0.1);
  }

  .tile.dark {
    background: #89be7c;
    box-shadow: -10px 10px 0px #70a663, -20px 20px 30px rgba(35, 75, 25, 0.2);
  }

  .tile.hero {
    background: #60a552;
    box-shadow: -12px 12px 0px #498a3c, -25px 25px 35px rgba(25, 65, 15, 0.25);
  }

  /* Typography matching reference image */
  .headline {
    position: absolute;
    top: ${isLandscape ? '40px' : '90px'};
    left: ${isLandscape ? '50px' : '80px'};
    width: ${isLandscape ? '480px' : '700px'};
    font-size: ${isLandscape ? '46px' : '72px'};
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.03em;
    color: #0f172a;
    text-transform: uppercase;
    z-index: 10;
  }

  .subtext {
    position: absolute;
    bottom: ${isLandscape ? '35px' : '80px'};
    right: ${isLandscape ? '50px' : '80px'};
    width: ${isLandscape ? '400px' : '550px'};
    font-size: ${isLandscape ? '22px' : '36px'};
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: #0f172a;
    text-align: right;
    text-transform: uppercase;
    z-index: 10;
  }

  /* Phone Mockup Frame */
  .mockup-container {
    position: absolute;
    ${isLandscape ? `
      top: 50%;
      right: 60px;
      transform: translateY(-50%) perspective(1200px) rotateX(15deg) rotateY(-18deg) rotateZ(6deg);
      width: 400px;
      height: 780px;
    ` : `
      top: 52%;
      left: 52%;
      transform: translate(-50%, -46%) perspective(1400px) rotateX(20deg) rotateY(-18deg) rotateZ(10deg);
      width: 620px;
      height: 1240px;
    `}
    transform-style: preserve-3d;
    z-index: 5;
  }

  .phone-body {
    width: 100%;
    height: 100%;
    background: #1e293b;
    border-radius: ${isLandscape ? '44px' : '54px'};
    padding: ${isLandscape ? '12px' : '16px'};
    box-shadow: 
      -30px 40px 70px rgba(15, 23, 42, 0.35),
      -10px 15px 25px rgba(15, 23, 42, 0.25),
      inset 0 0 4px rgba(255, 255, 255, 0.3);
    position: relative;
  }

  /* Inner Screen Area */
  .phone-screen {
    width: 100%;
    height: 100%;
    border-radius: ${isLandscape ? '34px' : '40px'};
    overflow: hidden;
    background: #ffffff;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  /* Dynamic Island / Notch */
  .phone-notch {
    position: absolute;
    top: ${isLandscape ? '10px' : '14px'};
    left: 50%;
    transform: translateX(-50%);
    width: ${isLandscape ? '90px' : '120px'};
    height: ${isLandscape ? '22px' : '28px'};
    background: #000000;
    border-radius: 20px;
    z-index: 20;
  }

  /* Screenshot inside Phone Screen - NO STRETCHING! */
  .screenshot-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
</style>
</head>
<body>

  <!-- Background 3D Tiles -->
  <div class="bg-grid">
    <div class="tile light"></div><div class="tile"></div><div class="tile dark"></div><div class="tile hero"></div>
    <div class="tile"></div><div class="tile hero"></div><div class="tile light"></div><div class="tile"></div>
    <div class="tile dark"></div><div class="tile light"></div><div class="tile hero"></div><div class="tile dark"></div>
    <div class="tile hero"></div><div class="tile"></div><div class="tile dark"></div><div class="tile light"></div>
    <div class="tile light"></div><div class="tile dark"></div><div class="tile hero"></div><div class="tile"></div>
    <div class="tile dark"></div><div class="tile hero"></div><div class="tile"></div><div class="tile light"></div>
    <div class="tile"></div><div class="tile light"></div><div class="tile dark"></div><div class="tile hero"></div>
    <div class="tile hero"></div><div class="tile dark"></div><div class="tile light"></div><div class="tile"></div>
  </div>

  <!-- Headline -->
  <div class="headline">${headline.replace(/\n/g, '<br/>')}</div>

  <!-- Phone Mockup with Screenshot -->
  <div class="mockup-container">
    <div class="phone-body">
      <div class="phone-screen">
        <div class="phone-notch"></div>
        <img class="screenshot-img" src="${screenshotUrl}" />
      </div>
    </div>
  </div>

  <!-- Subtext -->
  <div class="subtext">${subtext.replace(/\n/g, '<br/>')}</div>

</body>
</html>`;
}

async function renderAssets() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const jobs = [
    // 1. App Icon (512x512)
    {
      width: 512,
      height: 512,
      isIcon: true,
      filename: 'icon_512x512.png'
    },
    // 2. Feature Graphic (1024x500)
    {
      width: 1024,
      height: 500,
      isLandscape: true,
      headline: 'UNLOCK\nYOUR CAREER\nSUCCESS',
      subtext: 'FROM CV GENERATION TO INTERVIEW WINS.',
      screenshotUrl: profileShot,
      filename: 'feature_graphic_1024x500.png'
    },
    // 3. Phone Screenshot 1: Profile (1080x1920)
    {
      width: 1080,
      height: 1920,
      headline: 'MANAGE YOUR\nPROFILE\nEFFORTLESSLY',
      subtext: 'YOUR CAREER. YOUR DATA. ALWAYS READY.',
      screenshotUrl: profileShot,
      filename: 'phone_screenshot_1_profile_1080x1920.png'
    },
    // 4. Phone Screenshot 2: Community (1080x1920)
    {
      width: 1080,
      height: 1920,
      headline: 'JOIN THE\nSALES\nCOMMUNITY',
      subtext: 'CONNECT. SHARE. GROW WITH TOP PROS.',
      screenshotUrl: communityShot,
      filename: 'phone_screenshot_2_community_1080x1920.png'
    },
    // 5. Phone Screenshot 3: CV Generator (1080x1920)
    {
      width: 1080,
      height: 1920,
      headline: 'BUILD YOUR\nPERFECT\nRESUME & CV',
      subtext: 'AI-POWERED. TAILORED. READY TO IMPRESS.',
      screenshotUrl: cvShot,
      filename: 'phone_screenshot_3_cv_1080x1920.png'
    },
    // 6. Phone Screenshot 4: Dashboard (1080x1920)
    {
      width: 1080,
      height: 1920,
      headline: 'UNLOCK YOUR\nCAREER\nSUCCESS',
      subtext: 'FROM CV GENERATION TO INTERVIEW WINS.',
      screenshotUrl: dashShot,
      filename: 'phone_screenshot_4_dashboard_1080x1920.png'
    },
    // 7. 7-inch Tablet Screenshot 1 (1200x1920)
    {
      width: 1200,
      height: 1920,
      headline: 'BUILD YOUR\nPERFECT\nRESUME & CV',
      subtext: 'AI-POWERED. TAILORED. READY TO IMPRESS.',
      screenshotUrl: cvShot,
      filename: 'tablet_7in_screenshot_1_cv_1200x1920.png'
    },
    // 8. 7-inch Tablet Screenshot 2 (1200x1920)
    {
      width: 1200,
      height: 1920,
      headline: 'JOIN THE\nSALES\nCOMMUNITY',
      subtext: 'CONNECT. SHARE. GROW WITH TOP PROS.',
      screenshotUrl: communityShot,
      filename: 'tablet_7in_screenshot_2_community_1200x1920.png'
    },
    // 9. 10-inch Tablet Screenshot 1 (1600x2560)
    {
      width: 1600,
      height: 2560,
      headline: 'MANAGE YOUR\nPROFILE\nEFFORTLESSLY',
      subtext: 'YOUR CAREER. YOUR DATA. ALWAYS READY.',
      screenshotUrl: profileShot,
      filename: 'tablet_10in_screenshot_1_profile_1600x2560.png'
    },
    // 10. 10-inch Tablet Screenshot 2 (1600x2560)
    {
      width: 1600,
      height: 2560,
      headline: 'BUILD YOUR\nPERFECT\nRESUME & CV',
      subtext: 'AI-POWERED. TAILORED. READY TO IMPRESS.',
      screenshotUrl: cvShot,
      filename: 'tablet_10in_screenshot_2_cv_1600x2560.png'
    }
  ];

  for (const job of jobs) {
    const page = await browser.newPage();
    await page.setViewport({ width: job.width, height: job.height, deviceScaleFactor: 1 });

    const htmlContent = buildHtml(job);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Ensure fonts and images are fully loaded
    await page.evaluate(async () => {
      document.fonts && await document.fonts.ready;
    });

    const outputPath = path.join(ASSETS_DIR, job.filename);
    await page.screenshot({ path: outputPath, type: 'png', omitBackground: false });
    console.log(`Rendered: ${job.filename} (${job.width}x${job.height})`);
    await page.close();
  }

  await browser.close();
  console.log('All Play Store assets successfully generated without stretching!');
}

renderAssets().catch(err => {
  console.error('Error rendering assets:', err);
  process.exit(1);
});
