// Living background of the landing page: a monster in a derelict hallway, made with Three.js.
// The hallway drawing is the backdrop; the monster is a plane bent by a vertex shader (breathing,
// a lean, a head that slowly follows the cursor) and cut by a fragment shader so it can stand
// behind a door jamb or inside a doorway. It never walks: it is just somewhere else every time
// the dying lamp goes out — peeking from a side door, standing in the far doorway, or right in
// front of you.
//
// It is dark: the only light is a dying flashlight that follows the cursor (or wanders by itself),
// a lamp that sputters for a moment now and then, and the green crack in the monster's head.

import * as THREE from "three"

import { sound } from "./sound.js"

const canvas = document.getElementById("scene")
const panel = document.querySelector("main")
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches

// ---------- source drawings: crops (px of the SVG) around the subject ----------
// the soles are trimmed a little: the generator's badge sits right next to the feet
const MONSTER = { src: "site/ghost.svg", crop: [150, 40, 562, 1186], height: 2.2, face: 0.33 }
const HALLWAY = { src: "site/hallway.svg", crop: [240, 0, 864, 768], vanishY: 345 / 768 }

// Doors of the hallway drawing, px of the SVG: the jamb the monster hides behind, the floor line,
// and the far doorway rectangle
const DOORS = {
  left: { edge: 552, floor: 547 },
  right: { edge: 796, floor: 546 },
  far: { x0: 626, x1: 719, y0: 262, y1: 479 },
}

const EYE = 1.55 // camera height, m
const BACKDROP_Z = -12
const FOV = 50
const NO_CLIP = new THREE.Vector4(-1e5, 1e5, -1e5, 1e5)

/** SVG → canvas texture, only the crop, at `scale` */
async function rasterize({ src, crop: [x, y, w, h] }, scale) {
  const image = new Image()
  image.src = src
  await image.decode()
  const c = document.createElement("canvas")
  c.width = Math.round(w * scale)
  c.height = Math.round(h * scale)
  c.getContext("2d").drawImage(image, x, y, w, h, 0, 0, c.width, c.height)
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Soft round sprite for dust and the lamp glow */
function glowTexture() {
  const c = document.createElement("canvas")
  c.width = c.height = 64
  const g = c.getContext("2d")
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, "rgba(255,255,255,1)")
  r.addColorStop(0.35, "rgba(255,255,255,0.45)")
  r.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

// Light shared by every shader: a flashlight beam around the cursor + a near-black ambient.
// uFlash: beam centre in canvas pixels (x, y from the bottom) and radius in pixels.
const LIGHT = /* glsl */ `
  uniform vec3 uFlash;
  uniform float uPower;   // flashlight 0 (dead) … 1
  uniform float uAmbient; // the rest of the hallway: almost nothing, more when the lamp sputters
  uniform float uTime;
  float lighting() {
    float d = distance(gl_FragCoord.xy, uFlash.xy);
    float beam = smoothstep(uFlash.z, uFlash.z * 0.2, d);
    float hotspot = smoothstep(uFlash.z * 0.32, 0.0, d);
    return uAmbient + uPower * (beam * 1.15 + hotspot * 0.45);
  }
  float grain() {
    return fract(sin(dot(gl_FragCoord.xy + fract(uTime * 7.13) * 91.7, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  }
`

// The body barely moves: shallow breathing, the upper body leaning out of a doorway,
// the head on the thin neck, long fingers that twitch now and then.
// Body zones of the drawing, in uv of the crop (u across, vt from the top):
// the tilted head and its neck, the hips, the hands, the two black eyes.
const monsterVertex = /* glsl */ `
  uniform float uTime;
  uniform float uHead;   // head tilt, rad
  uniform float uLean;   // upper body lean from the hips, rad
  uniform float uTwitch; // 0…1 finger twitch
  uniform float uFlip;   // 1: mirrored (the head on the other side)
  uniform vec2 uSize;    // plane width, height (m)
  varying vec2 vUv;
  varying vec3 vWorld;

  // a point of the figure → plane coordinates (mirrored when flipped)
  vec2 at(float u, float vt) { return vec2((mix(u, 1.0 - u, uFlip) - 0.5) * uSize.x, (1.0 - vt) * uSize.y); }
  vec2 rot(vec2 p, vec2 pivot, float a) {
    p -= pivot;
    float c = cos(a), s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y) + pivot;
  }

  void main() {
    vUv = vec2(mix(uv.x, 1.0 - uv.x, uFlip), uv.y);
    float u = vUv.x, vt = 1.0 - uv.y;
    vec3 p = position;
    float side = mix(1.0, -1.0, uFlip);

    float breath = sin(uTime * 0.9);
    float torso = smoothstep(0.18, 0.26, vt) * smoothstep(0.55, 0.42, vt) * smoothstep(0.22, 0.08, abs(u - 0.525));
    p.x += (p.x - at(0.525, 0.0).x) * 0.015 * breath * torso;

    // long fingers twitch now and then
    float fingers = smoothstep(0.57, 0.64, vt) * (smoothstep(0.26, 0.2, u) + smoothstep(0.76, 0.82, u));
    p.x += 0.01 * uSize.y * sin(uTime * 23.0 + u * 40.0) * fingers * uTwitch;

    // the tilted head on its neck, then the whole upper body from the hips
    float head = smoothstep(0.23, 0.16, vt);
    p.xy = mix(p.xy, rot(p.xy, at(0.498, 0.181), uHead * side), head);
    float above = smoothstep(0.62, 0.40, vt);
    p.xy = mix(p.xy, rot(p.xy, at(0.525, 0.5), uLean), above);

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const monsterFragment = /* glsl */ `
  ${LIGHT}
  uniform sampler2D uMap;
  uniform float uNear;   // 0 deep in the dark … 1 close
  uniform vec4 uClip;    // visible area in px of the hallway drawing: x0, x1, y0, y1
  uniform vec4 uBack;    // backdrop: width, height, centre y, z
  uniform vec2 uCrop;    // backdrop crop: x offset, width (px)
  uniform vec2 uPx;      // size of the monster crop in px (for round eyes)
  varying vec2 vUv;
  varying vec3 vWorld;

  float eye(vec2 centre, vec2 uv) {
    float d = length((uv - centre) * uPx);
    return smoothstep(9.0, 0.0, d) + 0.35 * smoothstep(22.0, 4.0, d);
  }

  void main() {
    // where this point lands on the hallway drawing, seen from the camera:
    // hidden behind the door jamb or outside the doorway → not drawn
    vec3 ray = vWorld - cameraPosition;
    vec3 onBack = cameraPosition + ray * ((uBack.w - cameraPosition.z) / ray.z);
    float px = uCrop.x + (onBack.x / uBack.x + 0.5) * uCrop.y;
    float py = (0.5 - (onBack.y - uBack.z) / uBack.y) * 768.0;
    if (px < uClip.x || px > uClip.y || py < uClip.z || py > uClip.w) discard;

    vec4 c = texture2D(uMap, vUv);
    if (c.a < 0.03) discard;
    float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    float light = lighting();
    // dead skin: desaturated and cold
    vec3 skin = mix(vec3(luma), c.rgb, 0.35) * vec3(0.8, 0.86, 0.88);
    vec3 color = skin * light * mix(0.6, 1.0, uNear);
    // two dim pinpoints in the black eye sockets: in the dark you see the eyes first
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float eyes = (eye(vec2(0.359, 0.084), uv) + eye(vec2(0.290, 0.128), uv)) * smoothstep(0.25, 0.08, luma);
    float pulse = 0.55 + 0.45 * sin(uTime * 1.3) * sin(uTime * 0.41 + 2.0);
    color += eyes * pulse * vec3(0.78, 0.84, 0.86) * 0.75;
    color += grain() * 0.05;
    gl_FragColor = vec4(color, c.a);
  }
`

const backdropFragment = /* glsl */ `
  ${LIGHT}
  uniform sampler2D uMap;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(uMap, vUv).rgb;
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 wall = mix(vec3(luma), c, 0.55) * vec3(0.85, 0.95, 0.9);
    // the drawing melts into the dark at its edges, so no border is ever visible
    float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * smoothstep(0.0, 0.06, vUv.y);
    vec3 color = mix(vec3(0.0), wall * lighting(), edge);
    color += grain() * 0.045;
    gl_FragColor = vec4(color, 1.0);
  }
`

const simpleVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

const ease = (x) => x * x * (3 - 2 * x)
const pick = (list) => list[Math.floor(Math.random() * list.length)]
const between = (a, b) => a + Math.random() * (b - a)

async function start() {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" })
  } catch {
    return // no WebGL: the page stays as it is
  }
  renderer.setClearColor(0x000000)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60)
  camera.position.set(0, EYE, 0)

  const [monsterMap, hallMap] = await Promise.all([rasterize(MONSTER, 1.26), rasterize(HALLWAY, 1.5)])
  const time = { value: 0 }
  const flash = { value: new THREE.Vector3(0, 0, 200) }
  const power = { value: 1 }
  const ambient = { value: 0.03 }
  const lightUniforms = { uFlash: flash, uPower: power, uAmbient: ambient, uTime: time }

  // ---------- the hallway: a backdrop that fills the height of the view ----------
  const backHeight = 2 * Math.abs(BACKDROP_Z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * 1.3
  const backWidth = (backHeight * HALLWAY.crop[2]) / HALLWAY.crop[3]
  const backY = EYE - (0.5 - HALLWAY.vanishY) * backHeight // its vanishing point on the horizon
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(backWidth, backHeight),
    new THREE.ShaderMaterial({
      uniforms: { uMap: { value: hallMap }, ...lightUniforms },
      vertexShader: simpleVertex,
      fragmentShader: backdropFragment,
      depthWrite: false,
    }),
  )
  backdrop.position.set(0, backY, BACKDROP_Z)
  scene.add(backdrop)

  /** A spot on the drawing's floor → where to stand in 3D: depth from the floor line, x from the column */
  function spot(px, floorPy) {
    const drop = (floorPy / 768 - HALLWAY.vanishY) * backHeight
    const z = (BACKDROP_Z * EYE) / drop
    const backX = ((px - HALLWAY.crop[0]) / HALLWAY.crop[2] - 0.5) * backWidth
    return { x: (backX * z) / BACKDROP_Z, z }
  }

  // ---------- the monster ----------
  const height = MONSTER.height
  const width = (height * MONSTER.crop[2]) / MONSTER.crop[3]
  const geometry = new THREE.PlaneGeometry(width, height, 40, 100)
  geometry.translate(0, height / 2, 0) // feet at y = 0
  const body = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: monsterMap },
      ...lightUniforms,
      uHead: { value: 0 },
      uLean: { value: 0 },
      uTwitch: { value: 0 },
      uFlip: { value: 0 },
      uPx: { value: new THREE.Vector2(MONSTER.crop[2], MONSTER.crop[3]) },
      uNear: { value: 1 },
      uSize: { value: new THREE.Vector2(width, height) },
      uClip: { value: NO_CLIP.clone() },
      uBack: { value: new THREE.Vector4(backWidth, backHeight, backY, BACKDROP_Z) },
      uCrop: { value: new THREE.Vector2(HALLWAY.crop[0], HALLWAY.crop[2]) },
    },
    vertexShader: monsterVertex,
    fragmentShader: monsterFragment,
    transparent: true,
    depthTest: false,
  })
  const monster = new THREE.Mesh(geometry, body)
  monster.renderOrder = 1
  monster.visible = false
  scene.add(monster)

  // ---------- a lamp glow under the ceiling and dust in its light ----------
  const glow = glowTexture()
  const lamp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xcfe8c0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  lamp.position.set(0, 2.55, -5.5)
  lamp.scale.set(5, 3, 1)
  lamp.renderOrder = 2
  scene.add(lamp)

  const DUST = 420
  const dustPositions = new Float32Array(DUST * 3)
  const dustSeeds = new Float32Array(DUST)
  for (let i = 0; i < DUST; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 3
    dustPositions[i * 3 + 1] = Math.random() * 2.7
    dustPositions[i * 3 + 2] = -1.5 - Math.random() * 9
    dustSeeds[i] = Math.random() * 100
  }
  const dustGeometry = new THREE.BufferGeometry()
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3))
  // dust shows only where the beam falls
  const dustMaterial = new THREE.ShaderMaterial({
    uniforms: { ...lightUniforms, uMap: { value: glow }, uScale: { value: 400 } },
    vertexShader: /* glsl */ `
      uniform float uScale;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 0.035 * uScale / -view.z;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      ${LIGHT}
      uniform sampler2D uMap;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        gl_FragColor = vec4(vec3(0.85, 0.9, 0.8), a * 0.6 * max(0.0, lighting() - uAmbient));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const dust = new THREE.Points(dustGeometry, dustMaterial)
  dust.renderOrder = 2
  scene.add(dust)

  // ---------- layout: the hallway is centred in the free space next to the text panel ----------
  let focusX = 0.5
  function resize() {
    const w = innerWidth
    const h = innerHeight
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const box = panel.getBoundingClientRect()
    const free = w - box.right
    const cx = free > 300 ? box.right + free / 2 : w / 2
    focusX = cx / w
    const shift = cx - w / 2
    camera.setViewOffset(w + 2 * Math.abs(shift), h, shift > 0 ? 0 : 2 * Math.abs(shift), 0, w, h)
    camera.updateProjectionMatrix()
    dustMaterial.uniforms.uScale.value = h * renderer.getPixelRatio()
  }
  addEventListener("resize", resize)
  resize()

  // the flashlight follows the cursor; without one (phones) or when it rests, it wanders by itself
  const pointer = { x: 0, y: 0, px: innerWidth / 2, py: innerHeight / 2, movedAt: -1e9 }
  const beam = { x: innerWidth * 0.7, y: innerHeight * 0.45 }
  const search = { x: beam.x, y: beam.y, until: 0 }
  const probe = new THREE.Vector3()
  /** The monster's head and body on screen (CSS px) — where the searching beam must not go */
  function monsterPoints() {
    if (!monster.visible || current === "empty" || current === "scare") return []
    return [0.85, 0.55, 0.2].map((k) => {
      probe.set(monster.position.x, monster.position.y + MONSTER.height * k, monster.position.z).project(camera)
      return { x: ((probe.x + 1) / 2) * innerWidth, y: ((1 - probe.y) / 2) * innerHeight }
    })
  }
  addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / innerWidth - focusX) * 2
    pointer.y = (e.clientY / innerHeight - 0.5) * 2
    pointer.px = e.clientX
    pointer.py = e.clientY
    pointer.movedAt = performance.now()
  })

  // ---------- appearances: the monster is only ever moved in the dark ----------
  const S = body.uniforms
  const appearances = {
    empty: { length: () => between(3, 6) },
    // leans out from behind the jamb of a side door: the body stays in the room, the head comes out
    left: {
      length: () => between(5, 8),
      enter() {
        const p = spot(DOORS.left.edge - 34, DOORS.left.floor)
        place(p.x, 0, p.z, 0.75)
        S.uFlip.value = 1
        S.uClip.value.set(DOORS.left.edge, 1e5, -1e5, 1e5)
      },
      update: (k) => (S.uLean.value = -0.36 * ease(k)),
    },
    right: {
      length: () => between(5, 8),
      enter() {
        const p = spot(DOORS.right.edge + 34, DOORS.right.floor)
        place(p.x, 0, p.z, 0.75)
        S.uClip.value.set(-1e5, DOORS.right.edge, -1e5, 1e5)
      },
      update: (k) => (S.uLean.value = 0.36 * ease(k)),
    },
    // stands in the far doorway, in the dark, and watches
    far: {
      length: () => between(5, 8),
      enter() {
        const d = DOORS.far
        const p = spot((d.x0 + d.x1) / 2, d.y1)
        place(p.x, 0, p.z, 0.35)
        S.uClip.value.set(d.x0, d.x1, d.y0, d.y1)
      },
    },
    // right in front of you for half a second, under a harsh light
    scare: {
      length: () => 1.7,
      enter() {
        // the face at eye level, filling the view
        place(camera.position.x + (0.5 - MONSTER.face) * width, -0.32, -1.25, 1)
        S.uHead.value = 0.12
      },
    },
  }

  /** Puts the monster at a spot; it does not move from there */
  function place(x, y, z, near) {
    monster.position.set(x, y, z)
    monster.visible = true
    S.uNear.value = near
    S.uLean.value = 0
    S.uFlip.value = 0
    S.uClip.value.copy(NO_CLIP)
  }

  let current = "empty"
  let since = 0
  let until = between(2, 4)
  let shown = 0 // appearances since the last scare
  function next() {
    if (current !== "empty") return Math.random() < 0.55 ? "empty" : pick(["left", "right", "far"].filter((n) => n !== current))
    if (shown >= 3 && Math.random() < 0.4) return "scare"
    return pick(["left", "right", "far"])
  }
  function enter(name, t) {
    current = name
    since = t
    until = t + appearances[name].length()
    monster.visible = false
    S.uLean.value = 0
    if (name === "scare") shown = 0
    else if (name !== "empty") shown++
    appearances[name].enter?.()
    // it has moved in the dark: you hear it breathe — or it is right in front of you
    if (name === "scare") sound.scare()
    else if (name !== "empty") sound.breath()
  }

  // a blackout: short flickers, then darkness long enough to move it
  let burst = null
  let lampAt = between(6, 10)
  let lampFlash = null
  let lastOn = 1
  function blackout(t) {
    let at = t
    burst = []
    for (const [on, length] of [
      [0, 0.06],
      [1, 0.08],
      [0, 0.05],
      [1, 0.14],
      [0, 0.55], // here it moves
      [1, 0.06],
      [0, 0.07],
    ]) {
      at += length
      burst.push({ until: at, on, move: length > 0.3 })
    }
  }

  const clock = new THREE.Clock()
  let running = !document.hidden
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden
    if (running) clock.getDelta()
  })

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = (time.value += dt)

    // the dying flashlight: it trembles, and its battery gives out in bursts
    let lit = 0.92 + 0.05 * Math.sin(t * 13.0) * Math.sin(t * 3.7) + 0.03 * Math.random()
    if (current === "scare") {
      // harsh light for half a second, then black — and the hallway is empty again
      const k = t - since
      lit = k < 0.5 ? 1 : 0
      if (k >= 0.5) monster.visible = false
      if (t > until) enter("empty", t)
    } else {
      if (!burst && t > until) blackout(t)
      if (burst) {
        const step = burst.find((s) => t < s.until)
        if (!step) {
          burst = null
          lastOn = 1
        }
        else {
          if (step.move && !step.done) {
            step.done = true
            enter(next(), t)
            if (current === "scare") burst = null // it is already in front of you
          }
          if (burst) lit = step.on ? 0.9 : 0
          // the flashlight's switch clicks with every flicker
          if (step.on !== lastOn) {
            lastOn = step.on
            sound.click()
          }
        }
      }
    }
    power.value = lit
    // the ceiling lamp sputters on for a moment now and then and shows the whole hallway
    if (t > lampAt) {
      lampAt = t + between(9, 18)
      lampFlash = [t + 0.0, t + 0.07, t + 0.16, t + 0.22]
      sound.lamp()
    }
    const lampOn = lampFlash && ((t > lampFlash[0] && t < lampFlash[1]) || (t > lampFlash[2] && t < lampFlash[3]))
    ambient.value = current === "scare" ? (lit > 0 ? 0.9 : 0) : lampOn ? 0.55 : 0.025
    sound.level(power.value + ambient.value)

    // where the beam points: the cursor, with a lag and a shaking hand. Left alone, the beam
    // searches the hallway in jerks — always somewhere the monster is not, so it stays in the dark
    const idle = performance.now() - pointer.movedAt > 4000
    if (idle) {
      const radius = Math.min(innerWidth, innerHeight) * 0.3
      const points = monsterPoints()
      const gap = (x, y) => Math.min(Infinity, ...points.map((m) => Math.hypot(x - m.x, y - m.y)))
      if (t > search.until || gap(search.x, search.y) < radius * 1.3) {
        // a few random spots; the one farthest from the monster wins
        let best = null
        for (let i = 0; i < 16; i++) {
          const x = innerWidth * (focusX + between(-0.3, 0.3))
          const y = innerHeight * between(0.2, 0.85)
          if (!best || gap(x, y) > best.gap) best = { x, y, gap: gap(x, y) }
        }
        search.x = best.x
        search.y = best.y
        search.until = t + between(1.2, 3.2)
      }
    }
    const goalX = idle ? search.x : pointer.px
    const goalY = idle ? search.y : pointer.py
    beam.x += (goalX - beam.x) * Math.min(1, dt * (idle ? 3 : 6))
    beam.y += (goalY - beam.y) * Math.min(1, dt * (idle ? 3 : 6))
    const ratio = renderer.getPixelRatio()
    const shake = 3 * Math.sin(t * 17.0) + 2 * Math.sin(t * 29.0)
    flash.value.set(
      (beam.x + shake) * ratio,
      (innerHeight - beam.y + shake * 0.6) * ratio,
      Math.min(innerWidth, innerHeight) * 0.3 * ratio,
    )

    // the head slowly follows the cursor; the fingers twitch now and then
    const appearance = appearances[current]
    appearance.update?.(Math.min(1, (t - since) / 2.5))
    if (current !== "scare") {
      const target = THREE.MathUtils.clamp(-pointer.x * 0.3, -0.35, 0.35) + 0.04 * Math.sin(t * 0.4)
      S.uHead.value += (target - S.uHead.value) * Math.min(1, dt * 0.6)
    }
    S.uTwitch.value = Math.max(0, Math.sin(t * 0.7) * Math.sin(t * 1.9) - 0.6) * 2.5

    // the camera breathes, leans toward the cursor, and jolts when it is right in front of you
    const jolt = current === "scare" && t - since < 0.5 ? 0.025 : 0
    camera.position.x += (pointer.x * 0.12 - camera.position.x) * Math.min(1, dt * 2) + (Math.random() - 0.5) * jolt
    camera.position.y +=
      (EYE - pointer.y * 0.06 + 0.01 * Math.sin(t * 0.7) - camera.position.y) * Math.min(1, dt * 2) +
      (Math.random() - 0.5) * jolt
    camera.lookAt(camera.position.x * 0.5, EYE, -10)

    const positions = dustGeometry.attributes.position.array
    for (let i = 0; i < DUST; i++) {
      positions[i * 3] += Math.sin(t * 0.3 + dustSeeds[i]) * 0.0006
      positions[i * 3 + 1] -= 0.0009 + Math.sin(t * 0.5 + dustSeeds[i]) * 0.0005
      if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 2.7
    }
    dustGeometry.attributes.position.needsUpdate = true
    lamp.material.opacity = lampOn ? 0.35 : 0

    renderer.render(scene, camera)
  }

  // for checks from the console and the browser tests: window.hero.show("left"), window.hero.where()
  window.hero = { show: (name) => enter(name, time.value), where: () => monsterPoints()[0] }

  if (reduceMotion) {
    // one still frame: it stands in the far doorway
    enter("far", 0)
    until = Infinity
    frame()
    addEventListener("resize", () => frame())
  } else {
    renderer.setAnimationLoop(() => running && frame())
  }
  canvas.classList.add("ready")
}

start().catch((error) => console.warn("[hero]", error))
