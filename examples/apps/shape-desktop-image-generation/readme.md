## Assetor

Image generation and editing tool powered by Shapes, Inc.

## download [here](https://github.com/kiyosh11/assetor/releases/tag/shapes)
### Features
- AI-powered image generation with customizable prompts
- Image editing (crop, adjust, enhance)
- Gallery management
- Template-based cropping
- File upload support
- AI tools (description, variations, background removal, upscaling, enhancement, grayscale)
- Shapes API integration

### Installation

- Option 1: Install via Executable (Recommended for Faster Usage)
- Download Assetor_Setup_*.exe from the releases
- Run the installer or portable executable


### Option 2: Build from Source
- Clone repository: git clone [repo url]
- Navigate to project: cd assetor
- Install dependencies: npm install
- Build project: npm run build

### Usage
- Run: npm start (if built from source) or launch via installed executable
- Generate images via Dashboard > Image Generation
- Edit images using crop/adjust/enhance tools
- Manage images in Gallery
- Configure Shapes API in Settings
- Access AI tools for advanced features

### Build
- Windows installer: npm run dist
- Portable version: npx electron-builder --win portable
- Output: dist/Assetor_Setup_*.exe, dist/Assetor_Portable_*.exe

### Requirements
- Node.js v16+ (for source build)
- Electron v25+ (for source build)
- Shapes API key (configure in Settings)

### License
MIT License. See LICENSE for details.
### Support
- Email: hi@shapes.inc
- Documentation: https://wiki.shapes.inc
- Issues: [https://github.com/shapesinc/shapes-api/issues](https://github.com/shapesinc/shapes-api/issues)
