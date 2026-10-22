# Моя 3D-игра

Создана командой `npm create gamemonsterjs3d` — стек [GameMonsterJS3D](https://github.com/si0683/GameMonsterJS3D):
**Vite · Three.js · React Three Fiber · Drei · Rapier · Howler.js · zustand · TypeScript**.

## Команды

```bash
npm run dev      # игра на http://localhost:5173, правки видны сразу
npm run build    # готовая игра в папке dist/
npm run preview  # посмотреть собранную dist/
npm run zip      # game.zip (index.html в корне) для игровых порталов
npm run optimize # сжать модели из models/ в public/models/ (meshopt + WebP)
npm run check     # перед коммитом: линтер, типы, тесты, сборка
npm test          # модульные тесты (Vitest): правила, сохранения, платформа
npm run test:e2e  # игра в браузере (Playwright); первый раз: npx playwright install chromium
npm run lint      # ESLint; npm run format — Prettier
```

Как добавить объект, модель, звук, экран, язык — пошагово в [RECIPES.md](RECIPES.md).

## Где что лежит

```
src/App.tsx            сцена: небо, свет, физика, уровень + меню и счёт поверх
src/config.ts          баланс и расстановка монет и деревьев
src/store.ts           состояние игры (zustand): меню / игра / победа, монеты, время, громкость
src/rules.ts           правила игры (тесты — rules.test.ts)
src/save.ts            сохранение: рекорд и настройки громкости
src/audio.ts           звуки и музыка (Howler.js) + громкость из меню
src/i18n.ts            тексты на русском и английском
src/game/
  Level.tsx            земля, рампа, ящики, деревья, монеты
  Player.tsx           шар на физике Rapier + камера за ним
  Coin.tsx             монета (сенсор: ловит касание шара)
  Tree.tsx             модель glTF из public/models/tree.glb
src/ui/                меню, счёт, кнопки для телефона
models/                исходные 3D-модели .glb (npm run optimize сжимает их в public/models/)
public/models/         сжатые модели, которые грузит игра
public/sounds/         звуки (CREDITS.md — авторы)
e2e/game.spec.ts       проверка игры в браузере (Playwright)
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

## Платформа (SDK)

Код игры не обращается к SDK порталов напрямую — только к `platform` из `src/platform/`: `init`, `ready`, `gameplayStart`/`gameplayStop`, `showFullscreenAd`, `showRewardedAd`, `loadData`/`saveData`, `submitScore`, `lang`, `onPause`/`onResume`.

Проект создан **без SDK** (`src/platform/none.ts`): сохранения в localStorage, язык браузера, реклама не показывается. Версии под игровые порталы создают командой `npm create …@latest my-game -- --sdk=yandex` (или `vk`, `crazygames`, `poki`).

**Покупки** — через `shop` из `src/shop.ts`. В меню есть пример: «Убрать рекламу». Без SDK покупка работает только в `npm run dev` — бесплатно и сразу, чтобы проверить игру; в собранной игре кнопки нет. Как добавить свой товар — в `RECIPES.md`.

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

## Через ИИ

Заполните `PROMT.md` — техническое задание: жанр, механики, уровни, графика. Весь файл — готовый промт: его можно скопировать в любой ИИ-чат или написать ИИ-ассистенту в этой папке:

> Прочитай PROMT.md и сделай по нему игру.
