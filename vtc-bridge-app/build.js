'use strict'

process.env.CSC_IDENTITY_AUTO_DISCOVERY     = 'false'
process.env.CSC_LINK                        = ''
process.env.WIN_CSC_LINK                    = ''
process.env.ELECTRON_BUILDER_SKIP_CODE_SIGN = '1'

const builder = require('electron-builder')

builder.build({
  targets: builder.Platform.WINDOWS.createTarget('portable', builder.Arch.x64),
  config: {
    appId:       'pl.gloslogistics.bridge',
    productName: 'GLos Logistics Bridge',
    copyright:   '© 2026 GLos Logistics',
    directories: { output: 'dist' },
    win: {
      target:                    [{ target: 'portable', arch: ['x64'] }],
      signingHashAlgorithms:     null,
      sign:                      null,
      certificateFile:           null,
      certificatePassword:       null,
      verifyUpdateCodeSignature: false,
    },
    portable: {
      artifactName:          'GLos-Logistics-Bridge-v6.0-portable.exe',
      requestExecutionLevel: 'user',
    },
    files: [
      'main.js', 'preload.js',
      'renderer/**/*', 'src/**/*', 'assets/**/*',
      '!**/*.map',
    ],
    asar:        true,
    compression: 'maximum',
  },
})
.then(result => {
  console.log('\n✅  Build gotowy!')
  console.log('📦  Plik:', result[0])
})
.catch(err => {
  console.error('\n❌  Błąd build:', err.message)
  process.exit(1)
})
