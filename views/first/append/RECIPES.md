
## Хоррор от первого лица (`--view=first`)

### Свой уровень

Нарисуйте его прямо в `MAZE` (`src/config.ts`): `#` стена, `.` пол, `S` старт, `K` ключ, `E` выход, `M` существо. Размер клетки — `CELL`, высота стен — `WALL_HEIGHT`. Запустите `npm test`: тест проверит, что карта замкнута стенами, а ключи, выход и существо достижимы.

Для уровней не по сетке (свои 3D-комнаты из Blender) существу нужна навигационная сетка: `npm i recast-navigation @recast-navigation/three`, постройте её из мешей уровня и замените `findPath` на запрос пути к ней. `canSee` тогда делается лучом Rapier (`world.castRay`).

### Существо из 3D-модели

1. Возьмите модель со скелетом (например, персонаж и анимации ходьбы/бега с [Mixamo](https://www.mixamo.com), экспорт в `.glb`), положите в `models/` и выполните `npm run optimize`.
2. В `src/game/Creature.tsx` замените примитивы на модель:
   ```tsx
   const { scene, animations } = useGLTF(`${import.meta.env.BASE_URL}models/creature.glb`)
   const { actions } = useAnimations(animations, group)
   // в useFrame: hunting ? actions.Run?.play() : actions.Walk?.play()
   ```
   Логику (путь, взгляд, поимку) трогать не нужно.

### Звуки в пространстве

Шаги существа, скрип двери, дыхание — через `<PositionalAudio>` из Drei: звук слышно с той стороны, где источник.

```tsx
<PositionalAudio url={`${import.meta.env.BASE_URL}sounds/steps.mp3`} distance={2} loop autoplay />
```

Положите его внутрь группы существа — шаги будут приближаться вместе с ним. Громкость умножайте на `save.get().settings.sound`.

### Камера с ночным видением (как в Outlast)

В `src/game/Effects.tsx` добавьте зелёный тон и больше зерна, а фонарик ослабьте:

```tsx
import { HueSaturation, BrightnessContrast } from "@react-three/postprocessing"
<HueSaturation hue={1.9} saturation={-0.6} />
<BrightnessContrast brightness={0.15} contrast={0.3} />
```

Режим удобно включать клавишей (`F`) с ограниченным зарядом батареи — правило заряда положите в `src/rules.ts` с тестом.

### Производительность

- Тень отбрасывает только фонарик: не включайте `castShadow` у новых ламп без нужды.
- Туман (`<fog>` в `App.tsx`) прячет дальнее — уровень может быть большим.
- На слабых телефонах уберите `<Effects />` или уменьшите `dpr` у `<Canvas>`.
