import { useRef } from "react"
import { useShader } from "@/motion/useShader"
import { cn } from "@/lib/utils"

/*
 * Halftone dot field. A fixed grid of dots whose radius is driven by a slow diagonal
 * swell plus a second rolling wave; crests warm toward ember. The cursor sends rings
 * outward through the grid. The footer shows it through the letters of the wordmark, so
 * the field is even (no fade) and the grid tightens on small canvases to keep ~14 rows.
 */
const FRAG = /* glsl */ `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uPx;

void main() {
  float cell = clamp(uRes.y / uPx / 14.0, 5.0, 13.0) * uPx;
  vec2 p = gl_FragCoord.xy;
  vec2 id = floor(p / cell);
  vec2 c = (id + 0.5) * cell;
  float t = uTime;

  // Two slow swells crossing the grid.
  float w1 = 0.5 + 0.5 * sin(id.x * 0.16 + id.y * 0.10 - t * 0.9);
  float w2 = 0.5 + 0.5 * sin(length(id - vec2(uRes.x / cell * 0.7, -6.0)) * 0.22 - t * 1.3);
  float swell = pow(w1 * 0.6 + w2 * 0.4, 2.2);

  // Cursor ripple, measured in cells.
  float md = distance(c, uMouse) / cell;
  float ripple = exp(-md * 0.09) * (0.5 + 0.5 * sin(md * 0.7 - t * 5.5));

  float s = clamp(0.22 + swell * 0.85 + ripple * 0.7, 0.0, 1.0);
  float radius = cell * 0.5 * mix(0.3, 0.82, s);
  float d = length(p - c);
  float disc = 1.0 - smoothstep(radius - uPx, radius + uPx * 0.5, d);

  // A touch lighter than the footer, so the letters read even between dots.
  vec3 bg = vec3(0.055);
  vec3 cool = vec3(0.42, 0.42, 0.46);
  vec3 warm = vec3(1.0, 0.45, 0.2);
  vec3 col = mix(cool, warm, smoothstep(0.45, 0.95, s));
  float alpha = disc * mix(0.45, 1.0, s);

  gl_FragColor = vec4(mix(bg, col, alpha), 1.0);
}
`

export function HalftoneField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useShader(ref, FRAG, { hiDpi: true })
  return <canvas ref={ref} aria-hidden className={cn("absolute inset-0 size-full", className)} />
}
