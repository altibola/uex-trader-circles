export interface ManifestOptions {
  browser: 'chrome' | 'firefox' | 'safari';
  version?: string;
}

export function generateManifest(options: ManifestOptions) {
  const isFirefox = options.browser === 'firefox';
  const version = options.version || '0.1.0';

  const manifest: any = {
    manifest_version: 3,
    name: 'UEX Trader Circles',
    version,
    description: 'Facilitates trader identification and community circle discovery across UEX Corp marketplace.',
    icons: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png'
    },
    action: {
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icon-16.png',
        '32': 'icon-32.png',
        '48': 'icon-48.png',
        '128': 'icon-128.png'
      }
    },
    permissions: ['storage'],
    host_permissions: [
      '*://uexcorp.space/*',
      '*://robertsspaceindustries.com/en/citizens/*/organizations',
      '*://robertsspaceindustries.com/en/account/organization'
    ],
    content_scripts: [
      {
        matches: [
          '*://uexcorp.space/*',
          '*://uexcorp.space/marketplace/*',
          '*://uexcorp.space/marketplace/item/info/*',
          '*://uexcorp.space/@*'
        ],
        js: ['content.js'],
        css: ['styles.css'],
        run_at: 'document_idle'
      }
    ]
  };

  if (isFirefox) {
    manifest.background = {
      scripts: ['background.js']
    };
    manifest.browser_specific_settings = {
      gecko: {
        id: 'uex-trader-circles@uexcorp.space',
        strict_min_version: '109.0'
      }
    };
  } else {
    manifest.background = {
      service_worker: 'background.js',
      type: 'module'
    };
  }

  return manifest;
}
