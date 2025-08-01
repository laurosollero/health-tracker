# PWA Icons Required

This directory should contain the following PNG icons for the Progressive Web App:

## Required Icon Sizes

Based on the manifest.json configuration, these PNG files are needed:

- `icon-16x16.png` - Browser favicon
- `icon-32x32.png` - Browser favicon
- `icon-72x72.png` - Android Chrome
- `icon-96x96.png` - Android Chrome, shortcuts
- `icon-128x128.png` - Android Chrome
- `icon-144x144.png` - Android Chrome, Windows tiles
- `icon-152x152.png` - iOS Safari
- `icon-180x180.png` - iOS Safari
- `icon-192x192.png` - Android Chrome (maskable)
- `icon-384x384.png` - Android Chrome
- `icon-512x512.png` - Android Chrome (maskable)

## Design Guidelines

- **Colors**: Primary #10b981 (emerald-500), background #f8fafc (slate-50)
- **Theme**: Medical/health tracking with pill/medication symbols
- **Style**: Clean, modern, accessible
- **Maskable icons**: 192x192 and 512x512 should include safe area padding

## Source File

Use `icon.svg` as the base design and convert to PNG at various sizes.

## Generation Tools

You can use online tools or command-line utilities to generate these icons:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- ImageMagick: `convert icon.svg -resize 192x192 icon-192x192.png`

## Current Status

- ✅ SVG source created
- ❌ PNG icons need to be generated from SVG

The app will work without these icons, but they're recommended for a complete PWA experience.