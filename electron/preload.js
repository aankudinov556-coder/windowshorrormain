// Exposes a tiny, safe bridge to the game page.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('meridian', {
  isElectron: true,
  username: ipcRenderer.sendSync('get-user'),
  setLevel: (l) => ipcRenderer.send('level', l),
  quit: () => ipcRenderer.send('quit'),
  setFullscreen: (on) => ipcRenderer.send('fullscreen', on),
  onCloseAttempt: (cb) => ipcRenderer.on('close-attempt', () => cb())
});
