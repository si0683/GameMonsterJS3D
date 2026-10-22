# Poki

Проект создан с SDK Poki (`--sdk=poki`): международный портал браузерных игр. Код игры обращается только к `platform` из `src/platform`; вызовы SDK собраны в `src/platform/poki.ts`.

Документация SDK: https://developers.poki.com/guide/sdk-html5

## Что уже подключено

| Что | Метод SDK v2 | Где в игре |
|---|---|---|
| Загрузка SDK | скрипт `poki-sdk.js` + `PokiSDK.init()` | `platform.init()` при старте игры |
| Игра загружена | `gameLoadingFinished()` | `platform.ready()` после загрузки ресурсов |
| Игровой процесс | `gameplayStart()` / `gameplayStop()` | старт уровня / победа, проигрыш, меню |
| Реклама между раундами | `commercialBreak()` | после победы или проигрыша |
| Реклама за награду | `rewardedBreak()` | `platform.showRewardedAd()` — подключите сами |
| Без прокрутки страницы | `keydown` / `wheel` + `preventDefault` | пробел и стрелки не листают страницу Poki |

Не каждый `commercialBreak()` показывает рекламу — Poki решает сам. Игра встаёт на паузу только когда реклама действительно началась.

## Чего нет и почему

- **Покупки, лидерборд, облачные сохранения** — у Poki их нет. Сохранения остаются в localStorage браузера.
- **Язык** — из браузера.

## Проверка

1. `npm run zip` → `game.zip`.
2. Загрузите архив в Poki Inspector: https://inspector.poki.dev — он покажет, правильно ли вызываются события и реклама.
3. Отправьте игру на Poki через кабинет разработчика: https://developers.poki.com
