'use strict'

const {
  app, BrowserWindow, ipcMain,
  shell, Tray, Menu, nativeImage,
} = require('electron')
const path    = require('path')
const Bridge  = require('./src/bridge')
const Config  = require('./src/config')
const Verify  = require('./src/verify')
const { initUpdater, installUpdate, checkNow } = require('./src/updater')

let mainWindow = null
let tray       = null
let bridge     = null

// ─── Okno główne ─────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           480,
    height:          680,
    resizable:       false,
    frame:           false,
    transparent:     false,
    backgroundColor: '#0f0f0f',
    icon:            path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
}

// ─── Tray ─────────────────────────────────────
function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, 'assets', 'icon.ico')
  )
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  tray.setToolTip('GLos Logistics Bridge')
  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show()
  })

  updateTrayMenu(false)
}

function updateTrayMenu(isRunning) {
  const menu = Menu.buildFromTemplate([
    { label: 'GLos Logistics Bridge', enabled: false },
    { type: 'separator' },
    { label: isRunning ? '🟢 Bridge aktywny' : '🔴 Bridge zatrzymany', enabled: false },
    { type: 'separator' },
    { label: 'Pokaż okno',  click: () => mainWindow?.show() },
    {
      label: isRunning ? 'Zatrzymaj Bridge' : 'Uruchom Bridge',
      click: () => mainWindow?.webContents.send('tray:toggle'),
    },
    { type: 'separator' },
    {
      label: 'Sprawdź aktualizacje',
      click: () => checkNow().catch(() => {}),
    },
    { type: 'separator' },
    {
      label: 'Zamknij',
      click: () => {
        app.isQuiting = true
        bridge?.stop()
        app.quit()
      },
    },
  ])

  tray.setContextMenu(menu)
}

// ─── App ready ────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()

  // Auto-updater — startuje po załadowaniu okna
  initUpdater((event, data) => {
    mainWindow?.webContents.send('update:event', event, data)
  })
})

app.on('window-all-closed', (e) => {
  e.preventDefault()
})

// ─── IPC Handlers ─────────────────────────────

ipcMain.handle('config:load', () => Config.load())
ipcMain.handle('config:save', (_, data) => Config.save(data))
ipcMain.handle('config:delete', () => Config.remove())

ipcMain.handle('verify:key', async (_, serverUrl, apiKey) => {
  return Verify.verify(serverUrl, apiKey)
})

ipcMain.handle('bridge:start', async () => {
  const cfg = Config.load()
  if (!cfg) return { ok: false, error: 'Brak konfiguracji' }

  bridge = new Bridge(cfg, (event, data) => {
    mainWindow?.webContents.send('bridge:event', event, data)
  })

  await bridge.start()
  updateTrayMenu(true)
  return { ok: true }
})

ipcMain.handle('bridge:stop', async () => {
  bridge?.stop()
  bridge = null
  updateTrayMenu(false)
  return { ok: true }
})

// Updater IPC
ipcMain.handle('update:check', async () => {
  try   { await checkNow(); return { ok: true } }
  catch { return { ok: false } }
})

ipcMain.handle('update:install', () => {
  installUpdate()
})

ipcMain.on('open:url', (_, url) => shell.openExternal(url))

ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:hide',     () => mainWindow?.hide())
ipcMain.on('window:close',    () => {
  app.isQuiting = true
  bridge?.stop()
  app.quit()
})