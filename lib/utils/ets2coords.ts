// ETS2 world bounds (przybliżone)
const WORLD_MIN_X = -16000
const WORLD_MAX_X = 16000
const WORLD_MIN_Z = -16000
const WORLD_MAX_Z = 16000

export function ets2ToPercent(x: number, z: number): { left: string; top: string } {
  const left = ((x - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * 100
  const top = ((z - WORLD_MIN_Z) / (WORLD_MAX_Z - WORLD_MIN_Z)) * 100
  return {
    left: `${Math.max(0, Math.min(100, left)).toFixed(2)}%`,
    top: `${Math.max(0, Math.min(100, top)).toFixed(2)}%`,
  }
}

export function formatSpeed(speed: number): string {
  return `${Math.round(Math.abs(speed))} km/h`
}
