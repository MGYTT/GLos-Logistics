'use strict'

const https = require('https')
const http  = require('http')

function verify(serverUrl, apiKey) {
  return new Promise((resolve) => {
    const url    = serverUrl.replace(/\/$/, '') + '/api/bridge/verify'
    const body   = JSON.stringify({ api_key: apiKey })
    let   parsed

    try { parsed = new URL(url) }
    catch { return resolve({ ok: false, error: 'Nieprawidłowy adres serwera' }) }

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
              resolve({ ok: true, username: j.username, rank: j.rank })
            } else {
              resolve({ ok: false, error: j.error ?? 'Błąd serwera' })
            }
          } catch {
            resolve({ ok: false, error: 'Błąd parsowania odpowiedzi' })
          }
        })
      }
    )

    req.on('error',   e  => resolve({ ok: false, error: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'Timeout — sprawdź adres serwera' }) })
    req.write(body)
    req.end()
  })
}

module.exports = { verify }
