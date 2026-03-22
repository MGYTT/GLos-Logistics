'use strict'
const fs   = require('fs')
const path = require('path')

const [,, apiKey, serverUrl, username, rank] = process.argv

if (!apiKey || !serverUrl || !username) {
  process.stderr.write('Brak argumentow\n')
  process.exit(1)
}

const cfg = {
  api_key:     apiKey,
  server_url:  serverUrl,
  username:    username,
  rank:        rank || '',
  verified_at: new Date().toISOString(),
}

const cfgPath = path.join(__dirname, 'vtc-config.json')

try {
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8')
  process.stdout.write('SAVED\n')
  process.exit(0)
} catch (e) {
  process.stderr.write(`Blad zapisu: ${e.message}\n`)
  process.exit(1)
}
