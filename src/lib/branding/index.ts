export interface BrandingConfig {
  appName: string;
  logo?: string;
  favicon?: string;
  icon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customCSS?: string;
  customHTML?: string;
}

export interface BrandingAssets {
  logo: string;
  favicon: string;
  icon: string;
  appleTouchIcon: string;
  manifestIcon: string;
}

// Default KonBase branding
export const defaultBranding: BrandingConfig = {
  appName: 'KonBase',
  logo: '/logo.svg',
  favicon: '/favicon.ico',
  icon: '/icon.png',
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  accentColor: '#fce771',
};

// Default assets
export const defaultAssets: BrandingAssets = {
  logo: '/logo.svg',
  favicon: '/favicon.ico',
  icon: '/icon.png',
  appleTouchIcon: '/icon.png',
  manifestIcon: '/icon.png',
};

// Get branding configuration
export function getBrandingConfig(): BrandingConfig {
  // In a real implementation, this would fetch from the database
  // For now, return default branding
  return defaultBranding;
}

// Get branding assets
export function getBrandingAssets(): BrandingAssets {
  const config = getBrandingConfig();
  return {
    logo: config.logo || defaultAssets.logo,
    favicon: config.favicon || defaultAssets.favicon,
    icon: config.icon || defaultAssets.icon,
    appleTouchIcon: config.icon || defaultAssets.appleTouchIcon,
    manifestIcon: config.icon || defaultAssets.manifestIcon,
  };
}

// Generate CSS variables for branding
export function generateBrandingCSS(config: BrandingConfig): string {
  return `
    :root {
      --brand-primary: ${config.primaryColor || defaultBranding.primaryColor};
      --brand-secondary: ${config.secondaryColor || defaultBranding.secondaryColor};
      --brand-accent: ${config.accentColor || defaultBranding.accentColor};
    }
    
    .brand-primary { color: var(--brand-primary); }
    .brand-secondary { color: var(--brand-secondary); }
    .brand-accent { color: var(--brand-accent); }
    
    .bg-brand-primary { background-color: var(--brand-primary); }
    .bg-brand-secondary { background-color: var(--brand-secondary); }
    .bg-brand-accent { background-color: var(--brand-accent); }
    
    ${config.customCSS || ''}
  `;
}

// Generate HTML head elements for branding
export function generateBrandingHTML(config: BrandingConfig): string {
  const assets = getBrandingAssets();

  return `
    <link rel="icon" href="${assets.favicon}" />
    <link rel="apple-touch-icon" href="${assets.appleTouchIcon}" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="${config.primaryColor || defaultBranding.primaryColor}" />
    <meta name="apple-mobile-web-app-title" content="${config.appName}" />
    <meta name="application-name" content="${config.appName}" />
    ${config.customHTML || ''}
  `;
}
