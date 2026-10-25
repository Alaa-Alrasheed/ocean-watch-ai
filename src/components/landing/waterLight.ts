/**
 * Underwater light as a WebGL fragment shader: animated caustics (the borders
 * of a drifting Voronoi field), god rays, the shimmering surface seen from
 * below, a torch at the cursor and an expanding sonar ring. It outputs light
 * only (black elsewhere) and is meant to sit on top of a 2D scene with
 * `mix-blend-mode: screen`, so the caustics play over the fish too.
 * Returns null when WebGL is unavailable; callers fall back to 2D rays.
 */

const VERT = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uDepth;   // 0 at the surface .. 1 deep
uniform vec2 uMouse;    // device px, x < 0 = none
uniform vec3 uPing;     // device px + age in s, z < 0 = none

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// distance to the nearest border of an animated Voronoi field (~0 on the lines)
float cells(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = 0.5 + 0.42 * sin(t + 6.2831 * hash2(i + g));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return d2 - d1;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float down = 1.0 - uv.y;
  vec2 p = frag / uRes.y;
  float t = uTime;
  float shallow = 1.0 - uDepth;

  // two warped layers of thin lines; they flare where they cross
  vec2 q = p * mix(7.5, 4.5, shallow) + vec2(0.0, t * 0.05);
  q += 0.45 * vec2(sin(q.y * 1.3 + t * 0.5), cos(q.x * 1.1 - t * 0.4));
  q += 0.22 * vec2(sin(q.y * 2.7 - t * 0.7), cos(q.x * 2.3 + t * 0.6));
  float l1 = 1.0 - smoothstep(0.0, 0.05, cells(q, t * 0.7));
  float l2 = 1.0 - smoothstep(0.0, 0.05, cells(q * 1.37 + 4.1, t * 0.9));
  float caust = 0.45 * l1 * l1 * l1 + 0.3 * l2 * l2 * l2 + 1.4 * l1 * l2;
  caust *= 0.6 + 0.4 * sin(q.x * 2.1 + q.y * 1.7 + t * 0.8);
  vec3 col = vec3(0.6, 0.97, 1.0) * caust * mix(0.04, 0.45, shallow * shallow) * pow(1.0 - down, 2.0);

  float a = (uv.x - 0.5) * 1.2 + down * 0.32;
  float rays = pow(0.5 + 0.5 * sin(a * 21.0 + t * 0.31), 7.0)
             + 0.7 * pow(0.5 + 0.5 * sin(a * 37.0 - t * 0.23 + 1.3), 9.0)
             + 0.5 * pow(0.5 + 0.5 * sin(a * 11.0 + t * 0.17 + 2.4), 5.0);
  col += vec3(0.42, 0.86, 0.96) * rays * (1.0 - down) * (1.0 - down * 0.6) * mix(0.05, 0.2, shallow);

  float surf = smoothstep(0.1, 0.0, down) * (0.55 + 0.45 * sin(uv.x * 38.0 + t * 1.8 + 2.0 * sin(uv.x * 11.0 - t * 0.9)));
  col += vec3(0.6, 0.95, 1.0) * surf * mix(0.04, 0.4, shallow);

  if (uMouse.x >= 0.0) {
    float d = length(frag - uMouse) / uRes.y;
    col += vec3(0.32, 0.95, 0.88) * 0.2 * exp(-d * d * 26.0);
  }
  if (uPing.z >= 0.0) {
    float d = length(frag - uPing.xy) / uRes.y;
    float r = uPing.z * 0.85;
    float e1 = (d - r) * 38.0, e2 = (d - r * 0.82) * 50.0;
    col += vec3(0.35, 1.0, 0.88) * (exp(-e1 * e1) + 0.35 * exp(-e2 * e2)) * exp(-uPing.z * 1.3) * 0.9;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export interface WaterLight {
  resize(): void;
  /** mouse / ping in CSS px relative to the canvas; ping[2] = age in seconds */
  render(t: number, depth: number, mouse: [number, number] | null, ping: [number, number, number] | null): void;
  dispose(): void;
}

/** `scale` = render pixels per CSS pixel (the light is soft, so under 1 is fine and cheap). */
export function createWaterLight(canvas: HTMLCanvasElement, scale = 0.6): WaterLight | null {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
  } catch (e) {
    console.warn("water light disabled:", e);
    return null;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u("uRes"), uTime = u("uTime"), uDepth = u("uDepth"), uMouse = u("uMouse"), uPing = u("uPing");

  const resize = () => {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  return {
    resize,
    render(t, depth, mouse, ping) {
      const H = canvas.height;
      gl.uniform2f(uRes, canvas.width, H);
      gl.uniform1f(uTime, (t / 1000) % 900);
      gl.uniform1f(uDepth, Math.min(1, Math.max(0, depth)));
      gl.uniform2f(uMouse, mouse ? mouse[0] * scale : -1, mouse ? H - mouse[1] * scale : -1);
      gl.uniform3f(uPing, ping ? ping[0] * scale : 0, ping ? H - ping[1] * scale : 0, ping ? ping[2] : -1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
