import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver = require('archiver');

const distDir = path.resolve(__dirname, '../dist');
const browsers = ['chrome', 'firefox', 'safari'];

async function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', (err: any) => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

async function main() {
  for (const browser of browsers) {
    const browserDir = path.resolve(distDir, browser);
    if (!fs.existsSync(browserDir)) {
      console.warn(`Directory not found for ${browser}, skipping.`);
      continue;
    }

    const zipPath = path.resolve(distDir, `uex-trader-circles-v0.1-${browser}.zip`);
    await zipDirectory(browserDir, zipPath);
    console.log(`[Package] Created archive: ${zipPath}`);
  }

  // Create instructions and converter script for Safari Web Extension
  const safariConverterScript = `#!/usr/bin/env bash
# Safari Web Extension Packaging Script
# Converts the compiled web extension bundle into a native Xcode project without manual Swift code.
set -e

DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
EXT_DIR="$DIR/safari"
OUTPUT_DIR="$DIR/safari-xcode-app"

if command -v xcrun &> /dev/null; then
    echo "Converting Safari Extension via xcrun safari-web-extension-converter..."
    xcrun safari-web-extension-converter "$EXT_DIR" \\
        --project-location "$OUTPUT_DIR" \\
        --app-name "UEX Trader Circles" \\
        --bundle-identifier "space.uexcorp.circles" \\
        --no-open
    echo "Safari App generated at $OUTPUT_DIR"
else
    echo "xcrun is not available on non-macOS systems. Web extension bundle is ready in $EXT_DIR for Safari 15+."
fi
`;

  fs.writeFileSync(path.resolve(distDir, 'convert-safari.sh'), safariConverterScript, {
    mode: 0o755
  });
  console.log(`[Package] Generated Safari conversion script at ${path.resolve(distDir, 'convert-safari.sh')}`);
}

main().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
