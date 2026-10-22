# VK Игры

Проект создан с SDK VK Игр (`--sdk=vk`): игра для каталога игр ВКонтакте (vk.com/games). Код игры обращается только к `platform` из `src/platform`; вызовы VK собраны в `src/platform/vk.ts` (пакет [@vkontakte/vk-bridge](https://dev.vk.com/ru/bridge/overview)).

> **VK Play** (vkplay.ru) — другая площадка. Открытого JS SDK для HTML5-игр у неё нет: подключение идёт через партнёрский договор, оплата и вход — через сервер игры. Для HTML5-игр в экосистеме VK используйте VK Игры.

## Что уже подключено

| Что | Метод VK Bridge | Где в игре |
|---|---|---|
| Запуск | `VKWebAppInit` | `platform.init()` при старте игры |
| Язык | параметр запуска `vk_language` | `src/i18n.ts` — русский или английский |
| Пауза | события `VKWebAppViewHide` / `VKWebAppViewRestore` | звук выключается, игра замирает |
| Реклама между раундами | `VKWebAppCheckNativeAds` + `VKWebAppShowNativeAds` (`interstitial`) | после победы или проигрыша |
| Реклама за награду | то же, `reward` | `platform.showRewardedAd()` — подключите сами |
| Сохранения | `VKWebAppStorageGet` / `VKWebAppStorageSet`, ключ `save` | рекорд и настройки (+ копия в localStorage); до 4096 байт |

Вне ВКонтакте (обычный `npm run dev`) мост не подключается: игра работает в режиме «без SDK».

## Чего нет и почему

- **Покупки.** `VKWebAppShowOrderBox` требует своего сервера: ВКонтакте присылает на него запросы о товаре и подтверждение оплаты (платёжные уведомления). Шаблон работает без сервера, поэтому кнопки покупок на VK не показываются (`features.purchases = false`). Когда появится сервер — реализуйте `purchase()` в `vk.ts` по документации: https://dev.vk.com/ru/api/payments/getting-started
- **Лидерборд.** VK показывает его своим окном (`VKWebAppShowLeaderBoardBox`), а не принимает очки молча. Нужен — добавьте кнопку «Рейтинг» и вызов в `vk.ts`.

## Проверка

1. `npm run build` → папка `dist/`.
2. Создайте приложение типа «Игра» в разделе разработчика: https://dev.vk.com/ru/games/getting-started
3. Для отладки укажите в настройках приложения адрес локального сервера (`npm run dev`, нужен https — например, через туннель) или загрузите архив `npm run zip`.
4. Откройте игру внутри ВКонтакте: реклама, сохранения и язык работают только там.

## Публикация

Требования и модерация каталога игр: https://dev.vk.com/ru/games/getting-started. Архив для загрузки — `npm run zip`.
