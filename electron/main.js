// Electron shell for AFTER SIGN-OFF.
// Runs the game fullscreen so it feels like the machine itself.
// The game never touches the real system: it only reads the
// current OS user name (to address the player) and can quit itself.

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const DEV = process.argv.includes('--dev');

let win = null;
let level = 0;
let closeWarned = false;
let allowClose = false;

function realUserName() {
  try {
    const n = os.userInfo().username || '';
    return n.replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 24);
  } catch (e) {
    return '';
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 960,
    minWidth: 800,
    minHeight: 600,
    fullscreen: !DEV,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    title: 'Meridian',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: DEV
    }
  });
  win.setMenu(null);
  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  // F11 toggles fullscreen, F12 opens devtools in --dev mode.
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    }
    if (DEV && input.key === 'F12') win.webContents.toggleDevTools();
  });

  // Late in the game the first close attempt is answered by the game
  // itself ("Leaving so soon?"). The second attempt always closes.
  win.on('close', (e) => {
    if (allowClose) return;
    if (level >= 3 && !closeWarned) {
      closeWarned = true;
      e.preventDefault();
      win.webContents.send('close-attempt');
      setTimeout(() => { closeWarned = false; }, 15000);
    }
  });
}

ipcMain.on('get-user', (e) => { e.returnValue = realUserName(); });
ipcMain.on('level', (e, l) => { level = Number(l) || 0; });
ipcMain.on('quit', () => { allowClose = true; app.quit(); });
ipcMain.on('fullscreen', (e, on) => { if (win) win.setFullScreen(!!on); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
