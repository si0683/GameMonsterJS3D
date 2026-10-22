// Living background of the landing page: a monster in a derelict hallway, made with Three.js.
// Two flat SVG drawings become a scene: the hallway is the backdrop, the monster is a plane whose
// body is bent by a vertex shader (breathing, sway, head that follows the cursor, swinging arms,
// steps). The light flickers, and every time it goes out the monster is closer.

import * as THREE from "three"

const canvas = document.getElementById("scene")
const panel = document.querySelector("main")
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches

// ---------- source drawings: crops (px of the SVG) around the subject ----------
const MONSTER = { src: "site/monster.svg", crop: [228, 34, 398, 1216], height: 2.45 } // 8 ft
const HALLWAY = { src: "site/hallway.svg", crop: [240, 0, 864, 768], vanishY: 345 / 768 }

const EYE = 1.55 // camera height, m
const DOOR_Z = -8.9 // where the monster stands at the far door
const NEAR_Z = -3.1 // the closest it comes before it is back at the door
const BACKDROP_Z = -12
const FOV = 50

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

// The monster's body, bent in the vertex shader. Regions are found by uv (top-down `vt`):
// head above the neck, arms outside the torso, legs below the pelvis.
const monsterVertex = /* glsl */ `
  uniform float uTime;
  uniform float uHead;   // head turn toward the cursor, rad
  uniform float uWalk;   // 0 standing … 1 walking
  uniform float uPhase;  // step phase
  uniform vec2 uSize;    // plane width, height (m)
  varying vec2 vUv;

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
    float step = sin(uPhase);

    // breathing: the rib cage widens and the shoulders rise a little
    float breath = sin(uTime * 1.3);
    float torso = smoothstep(0.15, 0.24, vt) * smoothstep(0.55, 0.40, vt) * smoothstep(0.26, 0.10, abs(u - 0.48));
    p.x += (p.x - at(0.48, 0.0).x) * 0.035 * breath * torso;
    p.y += 0.006 * uSize.y * breath * smoothstep(0.5, 0.2, vt);

    // arms hang from the shoulders and swing opposite to each other
    float upper = smoothstep(0.19, 0.26, vt);
    float leftArm = smoothstep(0.31, 0.25, u) * upper;
    float rightArm = smoothstep(0.67, 0.73, u) * upper;
    float swing = 0.025 * sin(uTime * 0.8) + 0.07 * uWalk * step;
    p.xy = mix(p.xy, rot(p.xy, at(0.24, 0.205), -swing), leftArm);
    p.xy = mix(p.xy, rot(p.xy, at(0.72, 0.205), -swing * 0.8), rightArm);
    // long fingers twitch
    float fingers = smoothstep(0.70, 0.78, vt) * (leftArm + rightArm);
    p.x += 0.012 * uSize.y * sin(uTime * 7.0 + u * 30.0) * fingers * (0.3 + 0.7 * step * step);

    // steps: one leg lifts while the other carries the body
    float legs = smoothstep(0.52, 0.80, vt);
    float leftLeg = smoothstep(0.50, 0.45, u) * legs;
    float rightLeg = smoothstep(0.46, 0.51, u) * legs;
    p.y += 0.035 * uSize.y * uWalk * (max(step, 0.0) * leftLeg + max(-step, 0.0) * rightLeg);

    // the head tilts on the thin neck
    float head = smoothstep(0.20, 0.14, vt);
    p.xy = mix(p.xy, rot(p.xy, at(0.477, 0.165), uHead + 0.06 * sin(uTime * 0.55)), head);

    // the whole body sways, the top more than the feet
    float sway = 0.018 * sin(uTime * 0.45) + 0.012 * uWalk * step;
    p.x += sway * uSize.y * pow(1.0 - vt, 2.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const monsterFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uLight;  // flickering light 0…1
  uniform float uNear;   // 0 far … 1 close: far away it sinks into the dark
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec4 c = texture2D(uMap, vUv);
    if (c.a < 0.03) discard;
    float vt = 1.0 - vUv.y;
    float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    // cold light of the hallway
    vec3 color = c.rgb * vec3(0.82, 0.92, 0.88) * uLight * mix(0.38, 1.0, uNear);
    // the crack in the head glows like the mould on the walls
    float crack = smoothstep(0.17, 0.10, vt) * smoothstep(0.05, 0.015, abs(vUv.x - 0.477))
      * smoothstep(0.12, 0.2, luma) * smoothstep(0.42, 0.32, luma);
    float pulse = 0.55 + 0.45 * sin(uTime * 2.2);
    color += crack * pulse * vec3(0.55, 0.95, 0.32) * (0.35 + 0.65 * (1.0 - uLight * 0.6));
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
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
  camera.position.set(0, EYE, 0)

  const [monsterMap, hallMap] = await Promise.all([rasterize(MONSTER, 1.26), rasterize(HALLWAY, 1.5)])
  const light = { value: 1 }
  const time = { value: 0 }

  // ---------- the hallway: a backdrop that fills the height of the view ----------
  const backHeight = 2 * Math.abs(BACKDROP_Z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * 1.3
  const backWidth = (backHeight * HALLWAY.crop[2]) / HALLWAY.crop[3]
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(backWidth, backHeight),
    new THREE.ShaderMaterial({
      uniforms: { uMap: { value: hallMap }, uLight: light },
      vertexShader: simpleVertex,
      fragmentShader: backdropFragment,
      depthWrite: false,
    }),
  )
  // the vanishing point of the drawing sits on the camera's horizon
  backdrop.position.set(0, EYE - (0.5 - HALLWAY.vanishY) * backHeight, BACKDROP_Z)
  scene.add(backdrop)

  // ---------- the monster ----------
  const height = MONSTER.height
  const width = (height * MONSTER.crop[2]) / MONSTER.crop[3]
  const geometry = new THREE.PlaneGeometry(width, height, 48, 120)
  geometry.translate(0, height / 2, 0) // feet at y = 0
  const body = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: monsterMap },
      uTime: time,
      uLight: light,
      uHead: { value: 0 },
      uWalk: { value: 0 },
      uPhase: { value: 0 },
      uNear: { value: 0 },
      uSize: { value: new THREE.Vector2(width, height) },
    },
    vertexShader: monsterVertex,
    fragmentShader: monsterFragment,
    transparent: true,
  })
  const monster = new THREE.Group()
  monster.add(new THREE.Mesh(geometry, body))

  // a soft shadow under the feet keeps it standing on the floor
  const glow = glowTexture()
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.42),
    new THREE.MeshBasicMaterial({ map: glow, color: 0x000000, transparent: true, opacity: 0.75, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.01
  monster.add(shadow)
  scene.add(monster)

  // ---------- a lamp glow under the ceiling and dust in its light ----------
  const lamp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glow, color: 0xcfe8c0, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  lamp.position.set(0, 2.55, -5.5)
  lamp.scale.set(5, 3, 1)
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
    // wide screen: the space right of the panel; otherwise behind the panel, in the middle
    const cx = free > 300 ? box.right + free / 2 : w / 2
    focusX = cx / w
    const shift = cx - w / 2
    const full = w + 2 * Math.abs(shift)
    camera.setViewOffset(full, h, shift > 0 ? 0 : 2 * Math.abs(shift), 0, w, h)
    camera.updateProjectionMatrix()
  }
  addEventListener("resize", resize)
  resize()

  // ---------- the cursor: the head follows it, the camera leans a little ----------
  const pointer = { x: 0, y: 0 }
  addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / innerWidth - focusX) * 2
    pointer.y = (e.clientY / innerHeight - 0.5) * 2
  })

  // ---------- story: creeps along the hallway, comes closer in the dark ----------
  let z = -6
  let walking = 0
  let phase = 0
  let nextBurst = 3 + Math.random() * 3
  let burst = null // [{ until, on }]
  const blackoutMove = () => {
    if (z > NEAR_Z) z = DOOR_Z // too close: next time it is back at the far door
    else z = Math.min(NEAR_Z + 0.3, z + 1.4 + Math.random() * 0.8)
    body.uniforms.uHead.value = (Math.random() - 0.5) * 0.5
  }
  function scheduleBurst(t) {
    let at = t
    const steps = []
    for (const [on, length] of [
      [0, 0.06],
      [1, 0.09],
      [0, 0.05],
      [1, 0.18],
      [0, 0.45], // the long one: it moves now
      [1, 0.07],
      [0, 0.05],
    ]) {
      at += length
      steps.push({ until: at, on, moves: length > 0.3 })
    }
    burst = steps
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

    // light: a dying lamp with bursts of flicker
    let lit = 0.9 + 0.06 * Math.sin(t * 13.0) * Math.sin(t * 3.7) + 0.04 * Math.random()
    if (!burst && t > nextBurst) scheduleBurst(t)
    if (burst) {
      const current = burst.find((s) => t < s.until)
      if (!current) {
        burst = null
        nextBurst = t + 5 + Math.random() * 5
      } else {
        if (current.moves && !current.done) {
          current.done = true
          blackoutMove()
        }
        lit = current.on ? 0.95 : 0.04
      }
    }
    light.value = lit

    // creeping walk between the bursts
    walking += ((z < NEAR_Z ? 1 : 0) - walking) * Math.min(1, dt * 2)
    z = Math.min(NEAR_Z + 0.3, z + 0.12 * dt * walking)
    phase += dt * 2.4 * walking
    monster.position.set(0, Math.abs(Math.sin(phase)) * 0.03 * walking, z)
    body.uniforms.uWalk.value = walking
    body.uniforms.uPhase.value = phase
    body.uniforms.uNear.value = 1 - THREE.MathUtils.smoothstep(-z, -NEAR_Z, -DOOR_Z) // 0 far … 1 near
    // the head turns to the cursor, slowly
    const headTarget = THREE.MathUtils.clamp(-pointer.x * 0.35, -0.45, 0.45)
    body.uniforms.uHead.value += (headTarget - body.uniforms.uHead.value) * Math.min(1, dt * 1.5)

    // camera breathes and leans toward the cursor
    camera.position.x += (pointer.x * 0.12 - camera.position.x) * Math.min(1, dt * 2)
    camera.position.y += (EYE - pointer.y * 0.06 + 0.01 * Math.sin(t * 0.7) - camera.position.y) * Math.min(1, dt * 2)
    camera.lookAt(0, EYE, -10)

    // dust drifts in the lamp light
    const positions = dustGeometry.attributes.position.array
    for (let i = 0; i < DUST; i++) {
      positions[i * 3] += Math.sin(t * 0.3 + dustSeeds[i]) * 0.0006
      positions[i * 3 + 1] -= 0.0009 + Math.sin(t * 0.5 + dustSeeds[i]) * 0.0005
      if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 2.7
    }
    dustGeometry.attributes.position.needsUpdate = true
    dustMaterial.opacity = 0.55 * lit
    lamp.material.opacity = 0.22 * lit

    renderer.render(scene, camera)
  }

  if (reduceMotion) {
    // one still frame: the monster halfway down the hallway
    z = (DOOR_Z + NEAR_Z) / 2
    nextBurst = Infinity
    frame()
    addEventListener("resize", () => frame())
  } else {
    renderer.setAnimationLoop(() => running && frame())
  }
  canvas.classList.add("ready")
}

start().catch((error) => console.warn("[hero]", error))
