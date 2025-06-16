const path = require('path');
const { app, Menu, BrowserWindow, ipcMain, session } = require('electron');
const Store = require('electron-store');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

if (require('electron-squirrel-startup')) {
  app.quit();
}

if (app.isPackaged) {
  const modulePath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');
  require('module').Module.globalPaths.push(modulePath);
}

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'build', 'icon.ico'),
    show: false,
    title: 'Assetor',
    backgroundColor: '#f8fafc'
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https://api.shapes.inc; " +
          "img-src 'self' data: https:; " +
          "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
          "font-src 'self' https://cdnjs.cloudflare.com; " +
          "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
          "connect-src 'self' https://api.shapes.inc"
        ]
      }
    });
  });

session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
  const { url } = details;
  const headers = details.requestHeaders;
  
  if (url.includes('api.shapes.inc')) {
    headers['Origin'] = 'https://app.shapes.inc';
    headers['Referer'] = 'https://shapes.inc/';
  }
  
  callback({ requestHeaders: headers });
});

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setMenuBarVisibility(false);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });


  mainWindow.on('unresponsive', () => {
    console.error('Window became unresponsive');
  });
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
  return { success: true };
});

ipcMain.handle('get-settings', () => {
  return store.get('settings') || {};
});

if (process.platform === 'win32') {
  app.setAppUserModelId("inc.shapes.assetor");
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

app.on('gpu-process-crashed', (event, killed) => {
  console.error('GPU Process Crashed:', killed);
});
ipcMain.handle('node-fetch', async (event, url, options) => {
  const response = await fetch(url, options);
  return {
    status: response.status,
    json: await response.json()
  };
});