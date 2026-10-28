import { useEffect, type RefObject } from "react"
import { prefersReducedMotion } from "@/hooks/useReducedMotion"

const VERT = /* glsl */ `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

type Options = {
  /** Render resolution relative to CSS pixels (1 = device-independent, 0.5 = half). */
  scale?: number
  /** Multiply by devicePixelRatio (capped at 2) for crisp detail like dots. */
  hiDpi?: boolean
  /** Per-frame hook for extra uniforms. */
  onFrame?: (gl: WebGLRenderingContext, program: WebGLProgram) => void
}

/**
 * Runs a full-screen fragment shader on a canvas.
 * Built-in uniforms: uRes (px), uTime (s), uMouse (px, origin bottom-left, eased), uPx (px per CSS px).
 * Capped at 60fps, and fully paused when off screen or in a background tab.
 */
export function useShader(ref: RefObject<HTMLCanvasElement | null>, frag: string, { scale = 1, hiDpi = false, onFrame }: Options = {}) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power" })
    if (!gl) return

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "p")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, "uRes")
    const uTime = gl.getUniformLocation(prog, "uTime")
    const uMouse = gl.getUniformLocation(prog, "uMouse")
    const uPx = gl.getUniformLocation(prog, "uPx")

    const px = scale * (hiDpi ? Math.min(window.devicePixelRatio || 1, 2) : 1)
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * px))
      const h = Math.max(1, Math.round(canvas.clientHeight * px))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(uRes, w, h)
      gl.uniform1f(uPx, px)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Pointer starts far away so nothing ripples until the cursor arrives.
    const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.tx = (e.clientX - r.left) * px
      mouse.ty = (r.height - (e.clientY - r.top)) * px
      if (mouse.x < -1e3) {
        mouse.x = mouse.tx
        mouse.y = mouse.ty
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    const reduced = prefersReducedMotion()
    const start = performance.now()
    let raf = 0
    let last = 0
    let visible = false

    const draw = (now: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.08
      mouse.y += (mouse.ty - mouse.y) * 0.08
      gl.uniform1f(uTime, reduced ? 12 : (now - start) / 1000)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      onFrame?.(gl, prog)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 15) return
      last = now
      draw(now)
    }
    const run = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden) return
      if (reduced) draw(performance.now())
      else raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      // Paint immediately so the canvas is never blank while the loop spins up.
      if (visible) draw(performance.now())
      run()
    })
    io.observe(canvas)
    document.addEventListener("visibilitychange", run)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("visibilitychange", run)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frag, scale, hiDpi])
}
