import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { generateManifest } from './manifestGenerator';

const browsers: Array<'chrome' | 'firefox' | 'safari'> = ['chrome', 'firefox', 'safari'];
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const publicDir = path.resolve(rootDir, 'public');

async function buildBrowser(browser: 'chrome' | 'firefox' | 'safari') {
  const outDir = path.resolve(distDir, browser);
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Bundle scripts with esbuild
  // Content Script
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'src/content/index.ts')],
    outfile: path.resolve(outDir, 'content.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    minify: false,
    sourcemap: true
  });

  // Background Script
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'src/background/index.ts')],
    outfile: path.resolve(outDir, 'background.js'),
    bundle: true,
    format: browser === 'firefox' ? 'iife' : 'esm',
    platform: 'browser',
    target: ['es2020'],
    minify: false,
    sourcemap: true
  });

  // Popup Script
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'src/popup/popup.ts')],
    outfile: path.resolve(outDir, 'popup.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    minify: false,
    sourcemap: true
  });

  // 2. Copy static files
  fs.copyFileSync(
    path.resolve(rootDir, 'src/content/styles.css'),
    path.resolve(outDir, 'styles.css')
  );
  fs.copyFileSync(
    path.resolve(rootDir, 'src/popup/popup.html'),
    path.resolve(outDir, 'popup.html')
  );

  // Copy icons
  const iconFiles = fs.readdirSync(publicDir);
  for (const file of iconFiles) {
    fs.copyFileSync(path.resolve(publicDir, file), path.resolve(outDir, file));
  }

  // 3. Write manifest.json with v0.1 version
  const manifest = generateManifest({ browser, version: '0.1.0' });
  fs.writeFileSync(
    path.resolve(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`[Build] Successfully compiled extension for ${browser.toUpperCase()} -> ${outDir}`);
}

async function main() {
  for (const browser of browsers) {
    await buildBrowser(browser);
  }
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
