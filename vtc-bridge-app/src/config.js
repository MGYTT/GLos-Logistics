'use strict'

const path = require('path')
const fs   = require('fs')
const { app } = require('electron')

function getPath() {
  return path.join(app.getPath('userData'), 'vtc-config.json')
}

function load() {
  try {
    const p = getPath()
    if (!fs.existsSync(p)) return null
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'))
    if (!cfg.api_key || !cfg.server_url) return null
    return cfg
  } catch {
    return null
  }
}

function save(data) {
  try {
    fs.writeFileSync(getPath(), JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

function remove() {
  try {
    const p = getPath()
    if (fs.existsSync(p)) fs.unlinkSync(p)
    return true
  } catch {
    return false
  }
}

module.exports = { load, save, remove }
