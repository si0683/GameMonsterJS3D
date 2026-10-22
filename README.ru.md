# GameMonsterJS3D

**Стартер 3D-игры для браузера одной командой:** Vite · Three.js · React Three Fiber · Drei · Rapier · Howler.js · zustand · TypeScript.

[English](README.md) · [Сайт](https://si0683.github.io/GameMonsterJS3D/)

```bash
npm create gamemonsterjs3d@latest my-game
cd my-game
npm run dev
```

Пока пакета нет в npm, запускайте с GitHub: `npx github:si0683/GameMonsterJS3D my-game`.
Ключи: `--no-install`, `--no-git`. Нужен Node.js 20.19+.

## Что внутри

| | |
|---|---|
| [Three.js](https://threejs.org) | 3D-движок: сцены, модели glTF, свет, материалы, анимации |
| [React Three Fiber](https://r3f.docs.pmnd.rs) | React-слой над Three.js |
| [Drei](https://drei.docs.pmnd.rs) | готовые 3D-компоненты: загрузка моделей, управление, небо, окружения, эффекты |
| [React Three Rapier](https://github.com/pmndrs/react-three-rapier) | 3D-физика и коллизии Rapier |
| [Howler.js](https://howlerjs.com) | звук и музыка |
| [zustand](https://zustand.docs.pmnd.rs) | состояние игры, общее для 3D-сцены и интерфейса |
| [Vite](https://vite.dev), TypeScript | сервер разработки, сборка, строгие типы |

А ещё готовый уровень (катящийся шар, прыжок, рампа, ящики, монеты, таймер, экран победы), модель glTF через `useGLTF`, кнопки для телефона, `AGENTS.md` для нейросетей и выкладка на GitHub Pages.

## SDK платформы

Установщик спрашивает, под какую платформу собирать. Можно указать сразу:

```bash
npm create gamemonsterjs3d@latest my-game -- --sdk=none     # без SDK — обычная веб-сборка (по умолчанию)
npm create gamemonsterjs3d@latest my-game -- --sdk=yandex   # SDK Яндекс Игр
```

Игра обращается к одному интерфейсу — `platform` в `src/platform/`. Через него идут запуск, «игра готова», начало и конец геймплея, реклама (полноэкранная и за награду), сохранения, лидерборд, язык, пауза и продолжение.

- **Без SDK** платформа работает через localStorage и браузер.
- **С `yandex`** те же вызовы уходят в [SDK Яндекс Игр](https://yandex.ru/dev/games/doc/ru/sdk/sdk-about). Дополнительно появляются:
  - `npm run yandex` — проверка с настоящим SDK через `@yandex-games/sdk-dev-proxy`;
  - `YANDEX.md` — публикация и чек-лист модерации.

В любом проекте есть `npm run zip`: он собирает `game.zip` с `index.html` в корне для игровых порталов.

## Проект через ИИ

[PROMT.md](https://raw.githubusercontent.com/si0683/GameMonsterJS3D/main/PROMT.md) — готовый промт-ТЗ для ИИ-ассистента (Claude Code, Cursor, Codex, ChatGPT…). Весь файл — это промт:

1. Откройте ссылку, выделите всё (Ctrl+A) и скопируйте (Ctrl+C). Тот же файл лежит в папке каждого нового проекта.
2. Замените `«…»` своими данными, отметьте нужное `[x]`, лишнее удалите. Можно и не заполнять — ИИ задаст вопросы.
3. Вставьте в ИИ. Или положите файл в папку проекта и напишите ассистенту: «Прочитай PROMT.md и сделай по нему игру».

Пример заполнения (коротко):

> **1.** Мини-гольф «Остров»: 9 лунок на летающих островах, цель — меньше ударов. Похоже на Golf With Your Friends. Для всех, сессия 10 минут.
> **2.** Камера — орбита вокруг мяча. Удар: зажать ЛКМ и потянуть (сила как у рогатки). На телефоне — то же пальцем.
> **3.** Мяч — Rapier `ball`, трение 0.6; препятствия — мельницы, трамплины, песок (замедляет); упал с острова — +1 удар и возврат.
> **4.** 9 лунок из примитивов, яркое небо, мягкие тени.
> **6.** Low-poly, модели Kenney Minigolf Kit (CC0), звуки удара и лунки.

Подсказки:

- **3D-проект делайте маленькими шагами.** Сначала «кубик, который двигается и прыгает», потом всё остальное.
- **Модели проверяйте до того, как отдать ИИ.** Откройте .glb на https://gltf-viewer.donmccurdy.com: виден размер, анимации и названия частей.
- **Тормозит на телефоне** — попросите ИИ: «уменьши качество на телефонах: без теней, dpr 1, меньше объектов».
- **Нашли баг** — опишите шаги и приложите скриншот; для физики помогает `<Physics debug>`.

## Разработка репозитория

```bash
cd template && npm install && npm run dev
npm pack   # затем: npx ./create-gamemonsterjs3d-<v>.tgz test
```

MIT © si0683
