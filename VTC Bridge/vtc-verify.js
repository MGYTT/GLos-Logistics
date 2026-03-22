'use strict'
const https = require('https')
const http  = require('http')

const [,, serverUrl, apiKey] = process.argv

if (!serverUrl || !apiKey) {
  process.stdout.write('ERR:Brak argumentow\n')
  process.exit(1)
}

const fullUrl = serverUrl.replace(/\/$/, '') + '/api/bridge/verify'
const body    = JSON.stringify({ api_key: apiKey })

let parsed
try { parsed = new URL(fullUrl) }
catch {
  process.stdout.write('ERR:Nieprawidlowy adres serwera\n')
  process.exit(1)
}

const lib = parsed.protocol === 'https:' ? https : http

const req = lib.request(
  {
    hostname: parsed.hostname,
    port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path:     parsed.pathname,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: 8000,
  },
  res => {
    let d = ''
    res.on('data', c => (d += c))
    res.on('end', () => {
      try {
        const j = JSON.parse(d)
        if (res.statusCode === 200 && j.ok) {
          // Format: OK:username:rank
          process.stdout.write(`OK:${j.username}:${j.rank}\n`)
        } else {
          process.stdout.write(`ERR:${j.error || 'Nieznany blad serwera'}\n`)
        }
      } catch {
        process.stdout.write('ERR:Blad parsowania odpowiedzi serwera\n')
      }
      process.exit(0)
    })
  }
)

req.on('error',   e  => { process.stdout.write(`ERR:${e.message}\n`); process.exit(1) })
req.on('timeout', () => {
  req.destroy()
  process.stdout.write('ERR:Timeout - sprawdz adres serwera i polaczenie\n')
  process.exit(1)
})

req.write(body)
req.end()
