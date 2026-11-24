# Ассеты: картинки, звуки, озвучка

Игре не нужны внешние файлы: всё, чего нет, рисуется или синтезируется кодом. Ассеты подключаются через **слоты**: положил файл, запустил команду, файл попал в игру.

```
assets_src/                исходники (в сборку игры не попадают)
  photos/<слот>.jpg|png    фото из «Моих рисунков» и т.п.
  tapes/<слот>.jpg|png     фоны для VHS-записей
  slots.json               кадрирование, цвет, сюжетные наложения для каждого слота
  credits.json             откуда взят каждый исходник (лицензия, автор, ссылка)
src/assets/img/            готовые фото (генерируются)
src/assets/tapes/          готовые фоны записей + points.js (генерируются)
src/assets/manifest.js     слоты для звуков
src/lang/<язык>/assets/    ассеты конкретного языка (озвучка, картинки с текстом)
```

Пересобрать картинки после любых изменений:

```bash
npm run photos
```

Для каждого слота скрипт `tools/gen_photos.py` делает следующее:
1. Берёт исходник из `assets_src`. Если исходника нет, рисует процедурную версию.
2. Кадрирует до 4:3 и делает цветокоррекцию (в том числе «ночь» из дневного фото).
3. Добавляет **сюжетные наложения**: фигуру в тумане, силуэт в окне, «луну» на сцене, призрака у двери.
4. Делает кадр похожим на снимок дешёвой мыльницы 2003 года: мягкость, шум, вспышка, виньетка, JPEG-артефакты и оранжевая дата в углу.

## Что сейчас стоит

Реальные фото с Wikimedia Commons, только **CC0 и общественное достояние** (без условий, можно и коммерчески). Авторы перечислены в [CREDITS.md](CREDITS.md).

| Слот | Сейчас | Сюжетные наложения |
|---|---|---|
| `pell_hill_tower` | вышка на холме (CC0) | — |
| `IMG_0047` | вышка в тумане, переделанная в ночь (CC0) | тёмная высокая фигура |
| `station_control_room` | аппаратная с ЭЛТ-мониторами (PD) | — |
| `lily_birthday_8` | торт со свечами в темноте (CC0) | — |
| `christmas_2002` | ёлка в доме (CC0) | — |
| `lake_fishing` | пирс на озере (CC0) | — |
| `DSC_0013` | дом с горящими окнами ночью (CC0) | силуэт человека за компьютером в окне |
| `school_play_2003` | зал со сценой (PD) | прожектор, ребёнок-«луна», призрак у двери |
| `family_picnic_2001` | парк со столом для пикника (CC0) | — |
| `tapes/house`, `tapes/room`, `tapes/tower` | дом, комната с ЭЛТ, вышка (CC0/PD) | рисуются в записях: окно, человек, Ведущий |
| `ch12_staff_2003`, `_b`, `lily_moon_costume`, `frame_0233/0234/0237` | **нарисованы** | у `_b` — высокая фигура за спинами |

Фото с людьми (Лили, коллектив станции, лица на VHS-кадрах) я специально не брал из интернета: реальные узнаваемые лица в хорроре о пропавших людях — плохая идея. Для них нужны ИИ-картинки (промпты ниже).

## Как заменить картинку своей (ИИ или другой)

1. Сгенерировать картинку. Подойдёт любой размер, лучше от 1024×768 и с пропорциями около 4:3. **Дату не рисовать**, её добавит игра.
2. Сохранить как `assets_src/photos/<слот>.png` (или `.jpg`/`.webp`). Старый файл с другим расширением удалить.
3. Если на картинке уже есть то, что нужно сюжету (фигура, силуэт и т.п.), поставить в `slots.json` для этого слота `"overlays": []`. Иначе поправить координаты наложений: это доли кадра, 0..1.
4. Запустить `npm run photos` и открыть фото в игре.
5. Обновить `assets_src/credits.json`, например: `"source": "AI (название модели)"`.

Для фонов записей (`assets_src/tapes/*`) в `slots.json` есть `points`:
- окно в доме: `window` = [x, y, ширина, высота];
- экран монитора: `screen`;
- огонь на вышке: `beacon` = [x, y].

После замены картинки их нужно подвинуть под новую композицию.

## Промпты для генерации картинок

Общий стиль. Добавлять к каждому промпту (на английском, так модели понимают лучше):

> amateur snapshot taken with a cheap 2003 consumer digital camera, 4:3, on-camera flash or available light, slightly soft focus, muted colors, small-town America, mundane and real, no text, no watermark, no date stamp

| Слот | Промпт |
|---|---|
| `family_picnic_2001` | a summer picnic in a small-town park: wooden picnic table, red checkered blanket, cooler, paper plates; a mother and a little girl seen from behind, faces not visible |
| `lily_birthday_8` | a birthday cake with eight lit candles on a kitchen table at night, the room dark and lit only by the candles, a child's hands and a paper party hat at the edge of the frame |
| `christmas_2002` | a decorated Christmas tree with colorful lights in a modest living room at night, wrapped presents underneath, flash photo |
| `lake_fishing` | a small wooden fishing dock on a quiet lake at dawn, mist on the water, a man seen from behind sitting at the end of the dock with a fishing rod |
| `pell_hill_tower` | a red-and-white lattice TV transmitter tower on top of a grassy hill, a small transmitter shed at its base, guy wires, late summer afternoon |
| `IMG_0047` | night photo with harsh on-camera flash: wet grass in the foreground, the base of a lattice transmitter tower disappearing into fog, a red aircraft light high above, and an impossibly tall, thin, dark figure standing in the fog near the tower, no face visible *(после этого — `"overlays": []`)* |
| `station_control_room` | early-2000s local TV station master control room at night: rows of small CRT monitors showing color bars and news, a video switcher with glowing buttons, equipment racks, dim fluorescent light, an empty chair |
| `DSC_0013` | a wooden suburban house at night photographed from across the street, one window lit warm yellow with the silhouette of a man sitting at a computer, everything else dark, one street lamp *(после этого — `"overlays": []`)* |
| `school_play_2003` | an elementary school stage during a play, photographed from the back row: a little girl in a homemade yellow cardboard crescent-moon costume under a spotlight, a cardboard lighthouse prop, silhouettes of parents' heads in the foreground; near the exit door at the back a faint, half-transparent man standing and clapping *(после этого — `"overlays": []`)* |
| `ch12_staff_2003` | group photo of five employees of a small-town TV news station posing in front of the news set with a big "12" logo, early-2000s clothes, flash, awkward smiles |
| `ch12_staff_2003_b` | the same group photo, but behind them stands an extremely tall dark figure whose head is cut off by the top of the frame *(или не делать: игра сама дорисует фигуру на фото `ch12_staff_2003`)* |
| `lily_moon_costume` | a nine-year-old girl in a homemade yellow cardboard crescent-moon costume in a cluttered living room, proud pose, flash photo |
| `frame_0233` | paused VHS frame from a dark TV studio: extreme close-up of a smooth, featureless grey oval face with no eyes and no mouth, scanlines, tracking noise |
| `frame_0234` | paused VHS frame: the same close-up, but the face is now a tired middle-aged man looking straight into the camera, smeared and blurry |
| `frame_0237` | paused VHS frame: a young person's face in a dark room, lit blue from below by a computer screen, looking straight into the camera |
| `tapes/house` | a wooden suburban house at night from across the street, wide shot, one window faintly lit, empty street |
| `tapes/room` | a small home office at night: a beige CRT monitor on a desk, an office chair, a window behind it, very dark |
| `tapes/tower` | a lattice TV tower on a hill at night against a deep blue sky, silhouette |

Обои рабочего стола рисуются кодом (`src/js/os/wallpaper.js`): на каждом уровне заражения меняется небо, а фигура подходит ближе. Если захочешь нарисованные обои, понадобится по одной картинке на уровень (0–4) с одной и той же композицией.

## Звуки

Звуки синтезируются, но любой можно заменить записанным файлом:
1. Положить файл в `src/assets/sfx/`.
2. Прописать его в `src/assets/manifest.js`, например: `sounds: { startup: 'sfx/startup.ogg' }`.

| Имя | Что это |
|---|---|
| `startup` / `shutdown` / `logon` | мелодия запуска, выключения и входа в ОС (оригинальная, не похожая на Windows) |
| `ding`, `exclaim`, `notify` | ошибка, предупреждение, всплывающее уведомление |
| `click`, `type` | щелчок интерфейса, нажатие клавиши |
| `hdd`, `hddDeath` | щелчок головки жёсткого диска; «щелчок смерти» умирающего диска |
| `static`, `staticShort`, `glitch` | помехи ТВ, короткий глитч |
| `scare`, `sting`, `thump`, `heartbeat`, `whisper` | скример, тревожный аккорд, глухой удар, сердцебиение, шёпот |
| `jingle` | заставка «Ночной программы» на канале 12 |
| `blip` | короткий сигнал BIOS |

## Озвучка

Реплики в записях сейчас читает системный синтезатор речи (TTS). Для своей озвучки:
1. Выгрузить сценарий:
   ```bash
   npm run voice:export
   ```
   В `docs/voice/voice_lines_<язык>.csv` будет таблица: ключ реплики, персонаж, указания для голоса (на английском, для ИИ-генераторов), имя файла и текст.
2. Сгенерировать или записать файлы и положить их в `src/lang/<язык>/assets/voice/`.
3. Прописать их в `src/lang/languages.js` у нужного языка, например: `voices: { 'tp.h.say': 'host_good_evening.ogg' }`.

Реплики, которые не прописаны, по-прежнему читает синтезатор. Реплика `tp.l.sayEvening` содержит **настоящее имя игрока**: запись его знать не может, поэтому её лучше оставить синтезатору или записать вариант без имени.

Персонажи:
- **Диктор** — спокойный голос местного ТВ начала 2000-х.
- **Он же в «возврате»** — замедлен примерно до 70%, ниже примерно на 5 полутонов, с «плывущей» плёнкой.
- **Ведущий** — очень низкий, дружелюбный, чуть слишком медленный, «улыбается» во время речи.
- **Голос экстренного оповещения** — монотонный синтетический, как старое погодное радио.
