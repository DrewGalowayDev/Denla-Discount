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

You can use the Denla logo (img/denlalogo.png) to generate these icons:

### Option 1: Online Tool
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo: `d:\Drew Files\Awesome\public\img\denlalogo.png`
3. Download the generated icons
4. Place them in this folder

### Option 2: Using ImageMagick (command line)
```bash
# Install ImageMagick first
# Then run these commands from the img directory:

magick denlalogo.png -resize 72x72 icons/icon-72x72.png
magick denlalogo.png -resize 96x96 icons/icon-96x96.png
magick denlalogo.png -resize 128x128 icons/icon-128x128.png
magick denlalogo.png -resize 144x144 icons/icon-144x144.png
magick denlalogo.png -resize 152x152 icons/icon-152x152.png
magick denlalogo.png -resize 192x192 icons/icon-192x192.png
magick denlalogo.png -resize 384x384 icons/icon-384x384.png
magick denlalogo.png -resize 512x512 icons/icon-512x512.png
```

### Option 3: Photoshop/GIMP
1. Open denlalogo.png
2. Resize to each dimension (maintaining quality)
3. Export as PNG
4. Save with the correct filename

## Temporary Solution

For now, you can copy denlalogo.png and rename it to each size.
The PWA will still work, but icons may not be optimal quality.

### Quick PowerShell Command (Windows):
```powershell
cd "d:\Drew Files\Awesome\public\img"
Copy-Item denlalogo.png icons\icon-72x72.png
Copy-Item denlalogo.png icons\icon-96x96.png
Copy-Item denlalogo.png icons\icon-128x128.png
Copy-Item denlalogo.png icons\icon-144x144.png
Copy-Item denlalogo.png icons\icon-152x152.png
Copy-Item denlalogo.png icons\icon-192x192.png
Copy-Item denlalogo.png icons\icon-384x384.png
Copy-Item denlalogo.png icons\icon-512x512.png
```

