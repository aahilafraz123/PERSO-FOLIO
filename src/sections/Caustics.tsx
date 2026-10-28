import { useRef } from "react"
import { useShader } from "@/motion/useShader"
import { cn } from "@/lib/utils"

/*
 * Water caustics on a pale floor. Light gathers along the edges of drifting Voronoi
 * cells (F2 - F1 ~ 0). The surface is warped hard by layered sine waves so the edges
 * become curving filaments; two rotated layers cross and flare into bright knots.
 */
const FRAG = /* glsl */ `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uFade;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float edge(vec2 x, float t) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash2(n + g);
    o = 0.5 + 0.42 * sin(t + 6.2831 * o);
    float d = length(g + o - f);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return f2 - f1;
}

void main() {
  // Scale by the shorter side so the web has the same density on phones and desktops.
  float unit = min(uRes.x, uRes.y);
  vec2 uv = gl_FragCoord.xy / unit;
  float t = uTime;

  // Cursor: a soft swell in the water.
  vec2 m = uMouse / unit;
  vec2 dm = uv - m;
  float md = length(dm);
  vec2 swell = dm / (md + 1e-3) * 0.06 * exp(-md * 4.0) * sin(md * 16.0 - t * 2.2);

  // Surface waves: strong, smooth warping turns cells into curving light paths.
  vec2 w = uv + swell;
  w += 0.32 * vec2(sin(w.y * 2.3 + t * 0.40) + sin(w.x * 1.7 - t * 0.31),
                   cos(w.x * 2.1 - t * 0.36) + cos(w.y * 1.3 + t * 0.27));
  w += 0.12 * vec2(sin(w.y * 5.1 - t * 0.6), cos(w.x * 4.7 + t * 0.55));

  // Two layers, the second rotated so the webs never line up.
  mat2 R = mat2(0.866, -0.5, 0.5, 0.866);
  float e1 = edge(w * 2.9, t * 0.5);
  float e2 = edge(R * w * 4.6 + 7.1, t * 0.7 + 2.0);

  // Thin gaussian filaments + wider glow; crossings flare into bright knots.
  float l1 = exp(-e1 * e1 / 0.0035);
  float l2 = exp(-e2 * e2 / 0.003);
  float g1 = exp(-e1 * e1 / 0.05);
  float light = l1 * 0.7 + l2 * 0.45 + l1 * l2 * 1.6 + g1 * 0.12;

  vec2 q = gl_FragCoord.xy / uRes;
  float vig = smoothstep(1.2, 0.2, length((q - vec2(0.5, 0.55)) * vec2(1.05, 1.35)));
  vec3 floorCol = mix(vec3(0.845, 0.885, 0.915), vec3(0.93, 0.945, 0.96), vig);

  // Faint dispersion: warm core, cool fringe.
  vec3 caustic = vec3(1.0, 0.99, 0.965) * light + vec3(0.45, 0.7, 1.0) * g1 * 0.05;
  vec3 col = floorCol + caustic * 0.5 * uFade;

  // Keep the reading zone calm behind the headline.
  float calm = smoothstep(0.55, 0.0, length((q - vec2(0.5, 0.5)) * vec2(1.0, 1.8)));
  col = mix(col, vec3(0.965, 0.972, 0.98), calm * 0.55);

  gl_FragColor = vec4(min(col, 1.0), 1.0);
}
`

type Props = {
  className?: string
  /** 0..1 scroll progress through the hero; dims the light as you leave. */
  progress?: React.RefObject<number>
}

/** Full-bleed caustics. Half resolution (the light is soft anyway), 60fps cap, pauses off screen. */
export function Caustics({ className, progress }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useShader(ref, FRAG, {
    scale: 0.5,
    onFrame: (gl, prog) => gl.uniform1f(gl.getUniformLocation(prog, "uFade"), 1 - (progress?.current ?? 0) * 0.6),
  })
  return <canvas ref={ref} aria-hidden className={cn("absolute inset-0 size-full", className)} />
}
