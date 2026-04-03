'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('vtc', {
  // Config
  loadConfig:   ()       => ipcRenderer.invoke('config:load'),
  saveConfig:   (data)   => ipcRenderer.invoke('config:save', data),
  deleteConfig: ()       => ipcRenderer.invoke('config:delete'),

  // Verify
  verifyKey: (url, key)  => ipcRenderer.invoke('verify:key', url, key),

  // Bridge
  startBridge: ()        => ipcRenderer.invoke('bridge:start'),
  stopBridge:  ()        => ipcRenderer.invoke('bridge:stop'),

  // Events z bridge → renderer
  onBridgeEvent: (cb)    => ipcRenderer.on('bridge:event', (_, event, data) => cb(event, data)),
  onTrayToggle:  (cb)    => ipcRenderer.on('tray:toggle', cb),

  // Updater
  onUpdateEvent:  (cb)   => ipcRenderer.on('update:event', (_, event, data) => cb(event, data)),
  checkUpdate:    ()     => ipcRenderer.invoke('update:check'),
  installUpdate:  ()     => ipcRenderer.invoke('update:install'),

  // Okno
  minimize: () => ipcRenderer.send('window:minimize'),
  hide:     () => ipcRenderer.send('window:hide'),
  close:    () => ipcRenderer.send('window:close'),
  openUrl:  (url) => ipcRenderer.send('open:url', url),
})