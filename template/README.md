# Моя 3D-игра

Создана командой `npm create gamemonsterjs3d` — стек [GameMonsterJS3D](https://github.com/si0683/GameMonsterJS3D):
**Vite · Three.js · React Three Fiber · Drei · Rapier · Howler.js · zustand · TypeScript**.

## Команды

```bash
npm run dev      # игра на http://localhost:5173, правки видны сразу
npm run build    # готовая игра в папке dist/
npm run preview  # посмотреть собранную dist/
```

## Где что лежит

```
src/App.tsx            сцена: небо, свет, физика, уровень + меню и счёт поверх
src/config.ts          баланс и расстановка монет и деревьев
src/store.ts           состояние игры (zustand): меню / игра / победа, монеты, время
src/audio.ts           звуки и музыка (Howler.js)
src/game/
  Level.tsx            земля, рампа, ящики, деревья, монеты
  Player.tsx           шар на физике Rapier + камера за ним
  Coin.tsx             монета (сенсор: ловит касание шара)
  Tree.tsx             модель glTF из public/models/tree.glb
src/ui/                меню, счёт, кнопки для телефона
public/models/         3D-модели .glb
public/sounds/         звуки (CREDITS.md — авторы)
```

## Что за что отвечает

| | |
|---|---|
| Three.js | 3D-движок: сцена, свет, материалы, модели glTF |
| React Three Fiber | Three.js в виде React-компонентов: `<mesh>`, `useFrame` |
| Drei | готовые помощники: загрузка моделей, управление, небо, окружение |
| Rapier | физика: `<RigidBody>`, коллайдеры, сенсоры, импульсы |
| Howler.js | звук и музыка |
| zustand | общее состояние для 3D-сцены и интерфейса |

## Свои модели

Бесплатные модели (CC0): [Kenney](https://kenney.nl/assets?q=3d), [Quaternius](https://quaternius.com), [Poly Pizza](https://poly.pizza).
Положите `.glb` в `public/models` и загрузите как в `Tree.tsx`:

```tsx
const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/car.glb`)
return <Clone object={scene} />
```

Готовый React-компонент из модели: `npx gltfjsx public/models/car.glb --types`.

Посмотреть коллайдеры физики: `<Physics debug>` в `App.tsx`.

## Выкладка на GitHub Pages

1. Залейте проект в репозиторий GitHub (ветка `main`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Каждый push публикует игру на `https://<user>.github.io/<repo>/`.

## Документация

- React Three Fiber: https://r3f.docs.pmnd.rs
- Drei: https://drei.docs.pmnd.rs
- React Three Rapier: https://github.com/pmndrs/react-three-rapier
- Three.js: https://threejs.org/docs
- Howler.js: https://howlerjs.com
