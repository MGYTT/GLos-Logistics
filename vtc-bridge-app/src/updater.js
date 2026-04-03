'use strict'

const { autoUpdater } = require('electron-updater')

autoUpdater.autoDownload         = true
autoUpdater.autoInstallOnAppQuit = true

function initUpdater(emit) {
  autoUpdater.on('checking-for-update', () => {
    emit('update:status', { type: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    emit('update:status', {
      type:    'available',
      version: info.version,
      notes:   info.releaseNotes ?? null,
    })
  })

  autoUpdater.on('update-not-available', () => {
    // Cicho — nie informuj użytkownika że nie ma aktualizacji
  })

  autoUpdater.on('download-progress', (p) => {
    emit('update:progress', {
      percent:  Math.round(p.percent),
      speedKBs: Math.round(p.bytesPerSecond / 1024),
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    emit('update:status', {
      type:    'downloaded',
      version: info.version,
    })
  })

  autoUpdater.on('error', (err) => {
    // Ignoruj błąd podpisu (portable bez certyfikatu)
    if (err.message?.includes('Could not get code signature')) return
    if (err.message?.includes('net::ERR')) return  // brak internetu — cicho
    emit('update:status', { type: 'error', message: err.message })
  })

  // Sprawdź po 5s od startu
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 5_000)
}

function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}

function checkNow() {
  return autoUpdater.checkForUpdates()
}

module.exports = { initUpdater, installUpdate, checkNow }