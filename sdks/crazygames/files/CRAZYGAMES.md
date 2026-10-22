# CrazyGames

Проект создан с SDK CrazyGames (`--sdk=crazygames`): международный портал браузерных игр. Код игры обращается только к `platform` из `src/platform`; вызовы SDK собраны в `src/platform/crazygames.ts`.

Документация SDK: https://docs.crazygames.com/sdk/intro/ · требования: https://docs.crazygames.com/requirements/intro/

## Что уже подключено

| Что | Метод SDK v3 | Где в игре |
|---|---|---|
| Загрузка SDK | скрипт `crazygames-sdk-v3.js` + `SDK.init()` | `platform.init()` при старте игры |
| Загрузка игры | `game.loadingStart()` / `loadingStop()` | от старта до `platform.ready()` |
| Игровой процесс | `game.gameplayStart()` / `gameplayStop()` | старт уровня / победа, проигрыш, меню |
| Реклама между раундами | `ad.requestAd("midgame")` | после победы или проигрыша |
| Реклама за награду | `ad.requestAd("rewarded")` | `platform.showRewardedAd()` — подключите сами |
| Сохранения | `data.getItem` / `setItem`, ключ `save` | рекорд и настройки (+ копия в localStorage) |

Во время рекламы игра на паузе и без звука (`adStarted` → `onPause`). Ошибки рекламы (`unfilled`, `adCooldown`, `adblock`) — норма: игра просто продолжается.

## Чего нет и почему

- **Покупки.** CrazyGames продаёт через Xsolla и только в одобренных играх — подключается по их инструкции, когда игру одобрят.
- **Лидерборд.** В SDK его нет.
- **Язык.** Портал международный: язык берётся из браузера, английский по умолчанию для всех, кроме СНГ.

## Проверка

```bash
npm run dev   # на localhost SDK работает в режиме "local": вместо рекламы — тестовые заглушки
```

Перед отправкой загрузите сборку (`npm run zip`) в кабинет разработчика CrazyGames и проверьте её в предпросмотре (QA tool): https://developer.crazygames.com

На первом этапе (Basic Launch) реклама отключена — `requestAd` вернёт ошибку `adsDisabledBasicLaunch`, игра продолжится.
