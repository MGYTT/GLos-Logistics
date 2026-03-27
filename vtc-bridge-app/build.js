'use strict'

process.env.CSC_IDENTITY_AUTO_DISCOVERY     = 'false'
process.env.CSC_LINK                        = ''
process.env.WIN_CSC_LINK                    = ''
process.env.ELECTRON_BUILDER_SKIP_CODE_SIGN = '1'

const builder = require('electron-builder')
const path    = require('path')
const fs      = require('fs')

builder.build({
  targets: builder.Platform.WINDOWS.createTarget(['nsis', 'portable'], builder.Arch.x64),
  config: {
    appId:       'pl.gloslogistics.bridge',
    productName: 'GLos Logistics Bridge',
    copyright:   '© 2026 GLos Logistics',
    directories: { output: 'dist' },

    // ── Hook: kopiuj ffmpeg.dll do głównego folderu ──
    afterPack: async (context) => {
      const src  = path.join(__dirname, 'node_modules', 'electron', 'dist', 'ffmpeg.dll')
      const dest = path.join(context.appOutDir, 'ffmpeg.dll')
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
        console.log('✅  Skopiowano ffmpeg.dll →', dest)
      } else {
        console.warn('⚠️  Nie znaleziono ffmpeg.dll w node_modules/electron/dist/')
      }
    },

    win: {
      target: [
        { target: 'nsis',     arch: ['x64'] },
        { target: 'portable', arch: ['x64'] },
      ],
      signingHashAlgorithms:     null,
      sign:                      null,
      certificateFile:           null,
      certificatePassword:       null,
      verifyUpdateCodeSignature: false,
    },

    nsis: {
      oneClick:                        true,
      perMachine:                      false,
      allowToChangeInstallationDirectory: false,
      deleteAppDataOnUninstall:        false,
      artifactName:                    'GLos-Logistics-Bridge-Setup-v${version}.exe',
    },

    portable: {
      artifactName:          'GLos-Logistics-Bridge-v${version}-portable.exe',
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
  result.forEach(r => console.log('📦  Plik:', r))
})
.catch(err => {
  console.error('\n❌  Błąd build:', err.message)
  process.exit(1)
})