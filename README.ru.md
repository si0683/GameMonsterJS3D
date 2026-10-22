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

## Проект через ИИ

[PROMT.md](https://raw.githubusercontent.com/si0683/GameMonsterJS3D/main/PROMT.md) — техническое задание для ИИ-ассистента (Claude Code, Cursor, Codex…). Скачайте его или возьмите из папки нового проекта, заполните (жанр, управление, механики, уровни, графика) и напишите ассистенту в папке проекта:

> Прочитай PROMT.md и AGENTS.md и сделай игру по разделу «Промт». Начни с плана и вопросов.

## Разработка репозитория

```bash
cd template && npm install && npm run dev
npm pack   # затем: npx ./create-gamemonsterjs3d-<v>.tgz test
```

MIT © si0683
