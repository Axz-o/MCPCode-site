import type { CSSProperties } from 'react'

export function swatchStyle(color: string, ink: string): CSSProperties & { '--swatch-color': string; '--swatch-ink': string } {
  return { '--swatch-color': color, '--swatch-ink': ink }
}

export function glyphStyle(fill: string, ink: string): CSSProperties & { '--project-fill': string; '--project-ink': string } {
  return { '--project-fill': fill, '--project-ink': ink }
}
