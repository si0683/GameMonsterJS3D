# Рецепты: как развивать игру

Пошаговые инструкции для частых задач. Каждый рецепт заканчивается проверкой: `npm run check` (линтер, типы, тесты, сборка) и `npm run test:e2e` (игра в браузере).

## Новый объект уровня (препятствие, бонус, враг)

Пример — вращающийся молот, который сбивает шар.

1. **Компонент** `src/game/Hammer.tsx`:
   ```tsx
   export function Hammer({ position }: { position: [number, number, number] }) {
     const body = useRef<RapierRigidBody>(null)
     useFrame((_, delta) => {
       const angle = (body.current?.rotation().y ?? 0) + delta * HAMMER_SPEED
       body.current?.setNextKinematicRotation(new Quaternion().setFromEuler(new Euler(0, angle, 0)))
     })
     return (
       <RigidBody ref={body} type="kinematicPosition" position={position}>
         <mesh castShadow>
           <boxGeometry args={[6, 0.5, 0.5]} />
           <meshStandardMaterial color="#ec4899" />
         </mesh>
       </RigidBody>
     )
   }
   ```
2. **Числа и расстановка** — в `src/config.ts`: `HAMMER_SPEED`, `HAMMERS: [number, number, number][]`.
3. **На уровень** — в `src/game/Level.tsx`: `{HAMMERS.map((p, i) => <Hammer key={i} position={p} />)}`.
4. **Правило** (урон, очки, условие победы) — функцией в `src/rules.ts` и тестом в `src/rules.test.ts`. Состояние — в `src/store.ts` (zustand).
5. **Проверка в браузере** — шаг в `e2e/game.spec.ts`, если объект меняет основной цикл игры.

Подсказки по физике: `type="fixed"` — неподвижное, `kinematicPosition` — движется по вашему коду, `dynamic` — по физике. Датчик без столкновения (монета, зона финиша) — `sensor` и `onIntersectionEnter`, как в `Coin.tsx`.

## Новая 3D-модель

1. Исходный `.glb` — в `models/` (сжатая копия для игры появится в `public/models/`, шаг 4) (бесплатные модели: [Kenney](https://kenney.nl/assets), [Poly Pizza](https://poly.pizza)). Автора и лицензию — в `public/CREDITS.md`.
2. Загрузка — как в `Tree.tsx`: `const { scene } = useGLTF(url)` и `<Clone object={scene} castShadow />` (одна загруженная модель, сколько угодно копий). Типизированный компонент из модели: `npx gltfjsx public/models/rock.glb --types`.
3. Предзагрузка, чтобы модель не появлялась с задержкой: `useGLTF.preload(url)` рядом с компонентом. `<Suspense>` в `App.tsx` дождётся её до `platform.ready()`.
4. **Сжатие.** Исходник кладите в `models/rock.glb`, затем:
   ```bash
   npm run optimize   # models/*.glb → public/models/*.glb: meshopt-геометрия, текстуры WebP до 1024 px
   ```
   Повторный запуск пропускает неизменённые модели (`npm run optimize -- --force` — пересжать все). Декодер meshopt уже встроен в `useGLTF` из drei.

## Новый звук

1. Файл — в `public/sounds/` (эффекты — `.wav`/`.ogg`, музыка — `.mp3`). Автора — в `CREDITS.md`.
2. В `src/audio.ts`: собственная громкость в `BASE`, звук в `sounds`, строка в `applyVolumes()` — так на него действуют настройки громкости.
3. Воспроизведение: `sounds.shoot.play()`.

## Новое поле в сохранении

Сохранение одно на игрока — `src/save.ts`. Пример: открытые уровни.

1. Добавьте поле в `Save` и в `DEFAULT_SAVE`: `levels: 1`.
2. В `parseSave()` — проверку: `levels: toNumber(data.levels, 1, 1, 99)`. Старые сохранения без поля получат значение по умолчанию.
3. Сохраняйте через `save.update({ levels: 3 })` — остальные поля сохранятся сами. Значение для интерфейса держите и в `useGame`.
4. Тест в `src/save.test.ts`: старое сохранение без поля читается.

Порталы ограничивают частоту сохранений (Яндекс: 100 раз за 5 минут). Сохраняйте в конце забега, а не в каждом кадре; для частых изменений — `save.update(patch, 1000)`.

## Новый экран (пауза, магазин, выбор уровня)

1. Компонент в `src/ui/` (обычный React и CSS из `styles.css`), фаза или флаг — в `src/store.ts`.
2. Физика замирает через `paused` в `<Physics paused={…}>` (`App.tsx`), таймер — как в `pause()`/`resume()` стора.
3. Во время паузы — `platform.gameplayStop()`, при возврате — `platform.gameplayStart()` (требование порталов).
4. Только настоящие `<button>`: работают Tab, Enter и экранные дикторы. Esc — пауза.

## Новый язык

1. В `src/i18n.ts` добавьте набор `tr: { … }` с теми же ключами, что у `ru`. Тест `i18n.test.ts` проверит, что ничего не пропущено.
2. В `pickLanguage()` верните `"tr"` для `lang === "tr"`.
3. Тексты в интерфейсе — только через `t()`, без строк в компонентах.

## Новая покупка

Покупки идут через `shop` из `src/shop.ts` — он знает, что куплено, и не выдаст товар дважды. Пример в шаблоне — «Убрать рекламу» (`no_ads`).

1. **Товар на портале.** Создайте его в консоли площадки (Яндекс Игры: вкладка «Покупки») с id, например `skin_gold`. Название и цена в игре придут оттуда.
2. **Постоянный товар** (скин, уровни, без рекламы): добавьте id в `PRODUCTS` в `src/shop.ts` и проверяйте `shop.has(PRODUCTS.skinGold)`.
3. **Расходуемый товар** (монеты, жизни): передайте выдачу вторым аргументом — `createShop(platform, { coins_100: () => addCoins(100) })`. Магазин выдаст товар и вызовет `consumePurchase`; оплаченный, но не выданный (закрыли вкладку) — выдаст при следующем запуске.
4. **Кнопка:** только если `shop.available` (на площадке есть покупки), подпись — `shop.product(id).price`. Покупка — `await shop.buy(id)`: `true` — оплачено и выдано, `false` — игрок закрыл окно или оплата не прошла.
5. **Проверка:** в `npm run dev` без SDK покупки бесплатные и мгновенные (хранятся в localStorage, сброс — очистить данные сайта). Тест — в `src/shop.test.ts`, шаг покупки — в `e2e/game.spec.ts`.

## Реклама за награду

```ts
const rewarded = await platform.showRewardedAd()
if (rewarded) useGame.setState({ startedAt: performance.now() }) // только если досмотрел
```

Показывайте только по кнопке игрока, никогда во время игры. Если реклама не загрузилась, `showRewardedAd()` вернёт `false` — игра продолжится без награды.

## Доступность и удобство

- Всё управление дублируется: клавиатура + экранные кнопки (`TouchControls.tsx`).
- Громкость звука и музыки — в меню; новые звуки — только через `src/audio.ts`.
- Фокус клавиатуры всегда виден (`:focus-visible` в `styles.css`), кнопки — настоящие `<button>`.
- Без резких вспышек на весь экран и сильной тряски камеры.
- Важное не передавайте только цветом: бонус отличается формой, не только оттенком.

## Производительность

- Цель — **60 FPS на среднем телефоне**. Проверка: Chrome → DevTools → Performance, режим «4× slowdown»; в разработке — `<Perf />` из пакета `r3f-perf`.
- Ориентиры на телефон: до ~100 вызовов отрисовки (draw calls) и ~200–300 тыс. треугольников в кадре, текстуры до 1024×1024.
- Много одинаковых объектов (монеты, деревья, трава) — `<Instances>` из drei: один вызов отрисовки вместо сотен.
- В `useFrame` не создавайте объекты (`new Vector3()` каждый кадр) — заводите их один раз снаружи, как `cameraPosition` в `Player.tsx`.
- Тени дорогие: `castShadow` — только у важных объектов, размер карты теней — по необходимости.
- Состояние, которое меняется каждый кадр, не кладите в zustand-стор — React будет перерисовываться. Читайте его через ref в `useFrame`.
