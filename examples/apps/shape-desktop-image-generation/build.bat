@echo off
echo [INFO] Cleaning previous builds
rmdir /s /q dist 2>nul
del /q /f package-lock.json 2>nul

echo [INFO] Installing production dependencies
npm run prebuild

echo [INFO] Installing build tools
npm run postbuild

echo [INFO] Rebuilding native modules
npx electron-builder install-app-deps

echo [INFO] Building Windows installer
npm run dist

echo [INFO] Building portable version
npx electron-builder --win portable

echo [SUCCESS] Production build completed!
echo Installer: dist\Assetor_Setup_*.exe
echo Portable: dist\Assetor_Portable_*.exe