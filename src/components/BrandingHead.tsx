'use client';

import { useEffect } from 'react';
import {
  getBrandingConfig,
  getBrandingAssets,
  generateBrandingCSS,
} from '@/lib/branding';

export function BrandingHead() {
  useEffect(() => {
    const branding = getBrandingConfig();
    const assets = getBrandingAssets();

    // Update document title
    document.title = branding.appName;

    // Update favicon
    const favicon = document.querySelector(
      'link[rel="icon"]'
    ) as HTMLLinkElement;
    if (favicon) {
      favicon.href = assets.favicon;
    }

    // Update apple touch icon
    const appleTouchIcon = document.querySelector(
      'link[rel="apple-touch-icon"]'
    ) as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = assets.appleTouchIcon;
    }

    // Update theme color
    const themeColor = document.querySelector(
      'meta[name="theme-color"]'
    ) as HTMLMetaElement;
    if (themeColor) {
      themeColor.content = branding.primaryColor || '#1976d2';
    }

    // Update apple web app title
    const appleWebAppTitle = document.querySelector(
      'meta[name="apple-mobile-web-app-title"]'
    ) as HTMLMetaElement;
    if (appleWebAppTitle) {
      appleWebAppTitle.content = branding.appName;
    }

    // Update application name
    const applicationName = document.querySelector(
      'meta[name="application-name"]'
    ) as HTMLMetaElement;
    if (applicationName) {
      applicationName.content = branding.appName;
    }

    // Inject custom CSS
    const existingStyle = document.getElementById('branding-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'branding-css';
    style.textContent = generateBrandingCSS(branding);
    document.head.appendChild(style);
  }, []);

  return null;
}
