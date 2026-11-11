const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { buildAddon } = require('./exporter');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, backgroundColor: '#1e1f22',
    title: 'Addon Maker for MCPE',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

ipcMain.handle('export', async (_e, project) => {
  const r = await dialog.showSaveDialog({
    defaultPath: (project.namespace || 'addon') + '.mcaddon',
    filters: [{ name: 'Minecraft Add-on', extensions: ['mcaddon'] }]
  });
  if (r.canceled) return { ok: false, canceled: true };
  try { fs.writeFileSync(r.filePath, buildAddon(project)); return { ok: true, path: r.filePath }; }
  catch (err) { return { ok: false, error: String(err) }; }
});

ipcMain.handle('save-project', async (_e, project) => {
  const r = await dialog.showSaveDialog({ defaultPath: (project.namespace || 'project') + '.addonproj', filters: [{ name: 'Addon Project', extensions: ['addonproj'] }] });
  if (r.canceled) return false;
  fs.writeFileSync(r.filePath, JSON.stringify(project, null, 2)); return true;
});

ipcMain.handle('open-project', async () => {
  const r = await dialog.showOpenDialog({ filters: [{ name: 'Addon Project', extensions: ['addonproj'] }], properties: ['openFile'] });
  if (r.canceled) return null;
  return JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
