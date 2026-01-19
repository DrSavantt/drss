const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Colors
const bgColor = '#0A0A0A';
const textColor = '#FFFFFF';

// Generate SVG with "S" letter
function createSvg(size, padding = 0) {
  const fontSize = Math.floor((size - padding * 2) * 0.6);
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${fontSize}px" 
        font-weight="700"
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="central"
      >S</text>
    </svg>
  `;
}

// Generate maskable icon (with safe zone padding - 10% on each side)
function createMaskableSvg(size) {
  const padding = Math.floor(size * 0.1);
  const innerSize = size - padding * 2;
  const fontSize = Math.floor(innerSize * 0.6);
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${fontSize}px" 
        font-weight="700"
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="central"
      >S</text>
    </svg>
  `;
}

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Standard icons
  const sizes = [192, 512];
  for (const size of sizes) {
    const svg = createSvg(size);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
    console.log(`✓ Created icon-${size}.png`);
  }

  // Maskable icon (512 with padding for safe zone)
  const maskableSvg = createMaskableSvg(512);
  await sharp(Buffer.from(maskableSvg))
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  console.log('✓ Created icon-maskable-512.png');

  // Apple touch icon (180x180, no transparency)
  const appleSvg = createSvg(180);
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // Favicon (32x32)
  const faviconSvg = createSvg(32);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(path.join(iconsDir, 'favicon-32.png'));
  console.log('✓ Created favicon-32.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
