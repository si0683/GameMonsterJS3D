// Living background of the landing page: a monster in a derelict hallway, made with Three.js.
// The hallway drawing is the backdrop; the monster is a plane bent by a vertex shader (breathing,
// a lean, a head that slowly follows the cursor) and cut by a fragment shader so it can stand
// behind a door jamb or inside a doorway. It never walks: it is just somewhere else every time
// the dying lamp goes out — peeking from a side door, standing in the far doorway, or right in
// front of you.

import * as THREE from "three"

const canvas = document.getElementById("scene")
const panel = document.querySelector("main")
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches

// ---------- source drawings: crops (px of the SVG) around the subject ----------
const MONSTER = { src: "site/monster.svg", crop: [228, 34, 398, 1216], height: 2.45 } // 8 ft
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

// The body barely moves: shallow breathing, the upper body leaning out of a doorway,
// the head on the thin neck, long fingers that twitch now and then.
const monsterVertex = /* glsl */ `
  uniform float uTime;
  uniform float uHead;   // head tilt, rad
  uniform float uLean;   // upper body lean from the hips, rad
  uniform float uTwitch; // 0…1 finger twitch
  uniform vec2 uSize;    // plane width, height (m)
  varying vec2 vUv;
  varying vec3 vWorld;

  vec2 at(float u, float vt) { return vec2((u - 0.5) * uSize.x, (1.0 - vt) * uSize.y); }
  vec2 rot(vec2 p, vec2 pivot, float a) {
    p -= pivot;
    float c = cos(a), s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y) + pivot;
  }

  void main() {
    vUv = uv;
    float u = uv.x, vt = 1.0 - uv.y;
    vec3 p = position;

    float breath = sin(uTime * 0.9);
    float torso = smoothstep(0.15, 0.24, vt) * smoothstep(0.55, 0.40, vt) * smoothstep(0.26, 0.10, abs(u - 0.48));
    p.x += (p.x - at(0.48, 0.0).x) * 0.015 * breath * torso;

    float upper = smoothstep(0.19, 0.26, vt);
    float fingers = smoothstep(0.70, 0.78, vt) * (smoothstep(0.31, 0.25, u) + smoothstep(0.67, 0.73, u)) * upper;
    p.x += 0.01 * uSize.y * sin(uTime * 23.0 + u * 40.0) * fingers * uTwitch;

    // the head first, then the whole upper body leans from the hips
    float head = smoothstep(0.20, 0.14, vt);
    p.xy = mix(p.xy, rot(p.xy, at(0.477, 0.165), uHead), head);
    float above = smoothstep(0.62, 0.40, vt);
    p.xy = mix(p.xy, rot(p.xy, at(0.48, 0.5), uLean), above);

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const monsterFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uLight;
  uniform float uNear;   // 0 deep in the dark … 1 lit
  uniform float uTime;
  uniform vec4 uClip;    // visible area in px of the hallway drawing: x0, x1, y0, y1
  uniform vec4 uBack;    // backdrop: width, height, centre y, z
  uniform vec2 uCrop;    // backdrop crop: x offset, width (px)
  varying vec2 vUv;
  varying vec3 vWorld;

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
    float vt = 1.0 - vUv.y;
    float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    vec3 color = c.rgb * vec3(0.82, 0.92, 0.88) * uLight * mix(0.3, 1.0, uNear);
    // the crack in the head glows like the mould on the walls, brighter in the dark
    float crack = smoothstep(0.17, 0.10, vt) * smoothstep(0.05, 0.015, abs(vUv.x - 0.477))
      * smoothstep(0.12, 0.2, luma) * smoothstep(0.42, 0.32, luma);
    float pulse = 0.55 + 0.45 * sin(uTime * 2.2);
    color += crack * pulse * vec3(0.55, 0.95, 0.32) * (0.45 + 0.55 * (1.0 - uLight * 0.6));
    gl_FragColor = vec4(color, c.a);
  }
`

const backdropFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uLight;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(uMap, vUv).rgb;
    // the drawing melts into the dark at its edges, so no border is ever visible
    float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * smoothstep(0.0, 0.06, vUv.y);
    gl_FragColor = vec4(mix(vec3(0.059), c * uLight, edge), 1.0);
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
  renderer.setClearColor(0x0f0f0f)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60)
  camera.position.set(0, EYE, 0)

  const [monsterMap, hallMap] = await Promise.all([rasterize(MONSTER, 1.26), rasterize(HALLWAY, 1.5)])
  const light = { value: 1 }
  const time = { value: 0 }

  // ---------- the hallway: a backdrop that fills the height of the view ----------
  const backHeight = 2 * Math.abs(BACKDROP_Z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * 1.3
  const backWidth = (backHeight * HALLWAY.crop[2]) / HALLWAY.crop[3]
  const backY = EYE - (0.5 - HALLWAY.vanishY) * backHeight // its vanishing point on the horizon
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(backWidth, backHeight),
    new THREE.ShaderMaterial({
      uniforms: { uMap: { value: hallMap }, uLight: light },
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
      uTime: time,
      uLight: light,
      uHead: { value: 0 },
      uLean: { value: 0 },
      uTwitch: { value: 0 },
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
  const dustMaterial = new THREE.PointsMaterial({
    map: glow,
    color: 0xd8e6cf,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
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
  }
  addEventListener("resize", resize)
  resize()

  const pointer = { x: 0, y: 0 }
  addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / innerWidth - focusX) * 2
    pointer.y = (e.clientY / innerHeight - 0.5) * 2
  })

  // ---------- appearances: the monster is only ever moved in the dark ----------
  const S = body.uniforms
  const appearances = {
    empty: { length: () => between(3, 6) },
    // leans out from behind the jamb of a side door: the body stays in the room, the head comes out
    left: {
      length: () => between(5, 8),
      enter() {
        const p = spot(DOORS.left.edge - 30, DOORS.left.floor)
        place(p.x, 0, p.z, 0.75)
        S.uClip.value.set(DOORS.left.edge, 1e5, -1e5, 1e5)
      },
      update: (k) => (S.uLean.value = -0.36 * ease(k)),
    },
    right: {
      length: () => between(5, 8),
      enter() {
        const p = spot(DOORS.right.edge + 30, DOORS.right.floor)
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
        place(camera.position.x, -0.72, -1.35, 1)
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
  }

  // a blackout: short flickers, then darkness long enough to move it
  let burst = null
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

    // the dying lamp
    let lit = 0.9 + 0.06 * Math.sin(t * 13.0) * Math.sin(t * 3.7) + 0.04 * Math.random()
    if (current === "scare") {
      // harsh light for half a second, then black — and the hallway is empty again
      const k = t - since
      lit = k < 0.5 ? 1.2 + 0.15 * Math.random() : 0
      if (k >= 0.5) monster.visible = false
      if (t > until) enter("empty", t)
    } else {
      if (!burst && t > until) blackout(t)
      if (burst) {
        const step = burst.find((s) => t < s.until)
        if (!step) burst = null
        else {
          if (step.move && !step.done) {
            step.done = true
            enter(next(), t)
            if (current === "scare") burst = null // it is already in front of you
          }
          if (burst) lit = step.on ? 0.95 : 0.03
        }
      }
    }
    light.value = lit

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
    dustMaterial.opacity = 0.55 * Math.min(1, lit)
    lamp.material.opacity = 0.22 * Math.min(1, lit)

    renderer.render(scene, camera)
  }

  // for checks from the console and the browser tests: window.hero.show("left")
  window.hero = { show: (name) => enter(name, time.value) }

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
