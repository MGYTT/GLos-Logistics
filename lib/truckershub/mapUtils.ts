const WORLD_MIN_X = -16000
const WORLD_MAX_X =  16000
const WORLD_MIN_Z = -16000
const WORLD_MAX_Z =  16000

export function ets2ToPercent(x: number, z: number) {
  const left = ((x - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * 100
  const top  = ((z - WORLD_MIN_Z) / (WORLD_MAX_Z - WORLD_MIN_Z)) * 100
  return {
    left: `${Math.max(0, Math.min(100, left)).toFixed(2)}%`,
    top:  `${Math.max(0, Math.min(100, top)).toFixed(2)}%`,
  }
}

export function formatSpeed(speed: number) {
  return `${Math.round(Math.abs(speed))} km/h`
}

export function formatPosition(x: number, z: number) {
  return `X: ${x.toFixed(0)}, Z: ${z.toFixed(0)}`
}
