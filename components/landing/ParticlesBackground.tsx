'use client'

import { useCallback, useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

export function ParticlesBackground() {
  const [ready, setReady] = useState(false)

  // Nowe API @tsparticles/react v3 — initParticlesEngine zamiast init prop
  useEffect(() => {
    initParticlesEngine(async engine => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <Particles
      id="vtc-particles"
      className="absolute inset-0 z-0"
      options={{
        fullScreen:  { enable: false },
        background:  { color: { value: 'transparent' } },
        fpsLimit:    60,
        particles: {
          number:  { value: 40, density: { enable: true } },
          color:   { value: ['#f59e0b', '#fbbf24', '#d97706'] },
          shape:   { type: 'circle' },
          opacity: {
            value:     { min: 0.05, max: 0.2 },
            animation: { enable: true, speed: 0.5, minimumValue: 0.05 },
          },
          size: {
            value:     { min: 1, max: 2.5 },
            animation: { enable: true, speed: 1, minimumValue: 0.5 },
          },
          links: {
            enable:   true,
            distance: 150,
            color:    '#f59e0b',
            opacity:  0.07,
            width:    1,
          },
          move: {
            enable:    true,
            speed:     0.4,
            direction: 'none',
            random:    true,
            straight:  false,
            outModes:  { default: 'bounce' },
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true,  mode: 'grab' },
            onClick: { enable: true,  mode: 'push' },
          },
          modes: {
            grab: { distance: 140, links: { opacity: 0.25 } },
            push: { quantity: 2 },
          },
        },
        detectRetina: true,
      }}
    />
  )
}
