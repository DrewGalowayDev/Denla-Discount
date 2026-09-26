# PWA Icons

Place your app icons in this directory with the following sizes:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons

You can use your logo (img/logo.jpg) to generate these icons:

### Option 1: Online Tool
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo
3. Download the generated icons
4. Place them in this folder

### Option 2: Using ImageMagick (command line)
```bash
# Install ImageMagick first
# Then run these commands:

convert logo.jpg -resize 72x72 icon-72x72.png
convert logo.jpg -resize 96x96 icon-96x96.png
convert logo.jpg -resize 128x128 icon-128x128.png
convert logo.jpg -resize 144x144 icon-144x144.png
convert logo.jpg -resize 152x152.png
convert logo.jpg -resize 192x192 icon-192x192.png
convert logo.jpg -resize 384x384 icon-384x384.png
convert logo.jpg -resize 512x512 icon-512x512.png
```

### Option 3: Photoshop/GIMP
1. Open your logo
2. Resize to each dimension (maintaining quality)
3. Export as PNG
4. Save with the correct filename

## Temporary Solution

For now, you can copy your logo.jpg and rename it to each size.
The PWA will still work, but icons may not be optimal quality.
