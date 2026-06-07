# sBoard Pixi + Skia

Тестовый проект на TypeScript: Pixi-сцена отображается через стандартный canvas renderer и через собственный Skia-renderer, после чего экспортируется в PDF.

Поддержаны базовые объекты из задания: контейнеры, трансформации, `PIXI.Graphics` (`rect`, `ellipse`, `line`) и `PIXI.Sprite`.

## Запуск

Требуется Node.js 20+.

```bash
npm install
npm run dev
```

Команда запускает frontend и локальный PDF-сервис:

- приложение: `http://127.0.0.1:5173/`;
- PDF export API: `http://127.0.0.1:8787/`.

Открыть приложение:

```text
http://127.0.0.1:5173/
```

Для production-сборки:

```bash
npm run build
```

Собранные файлы появятся в `dist/`.

Запуск production-сервера:

```bash
npm start
```

По умолчанию сервер слушает порт `3000`. На хостинге можно передать порт через переменную `PORT`.

Для отдельного запуска PDF backend:

```bash
npm run pdf-server
```

Сгенерировать PDF без UI:

```bash
npm run generate:pdf
```

Файл создается здесь:

```text
output/sboard-skia-vector.pdf
```

## Скрипты

```bash
npm run dev           # frontend + PDF export API
npm run vite          # только Vite frontend
npm run pdf-server    # только PDF export API
npm run generate:pdf  # генерация PDF в output/
npm run build         # TypeScript check + production build
npm start             # production server
```

## Возможности

- Pixi legacy `7.2.4` и `PIXI.Application({ forceCanvas: true })`.
- Одна сцена отображается в двух canvas: Pixi и Skia CanvasKit.
- `DefaultPixiSkiaAdapter` проходит по `PIXI.Container` и переводит поддержанные объекты в векторные команды.
- Трансформации `translate`, `rotate`, `scale` учитываются через world matrix.
- Кнопка `Случайная фигура` добавляет новые векторные объекты в текущий контейнер.
- Кнопка `Следующая сцена` переключает подготовленные контейнеры.
- Кнопка `Экспорт PDF` экспортирует текущую сцену через Skia PDF backend.
- `pointerdown` и `pointerup` работают на Pixi canvas и на Skia canvas.

## PDF export

Экспорт выполняется на локальном Node-сервисе:

1. Проходит по текущему `PIXI.Container` через `DefaultPixiSkiaAdapter`.
2. Сериализует `rect`, `ellipse`, `polyline` и `sprite` в JSON-команды с матрицами трансформаций.
3. Отправляет команды на `POST /api/export-pdf`.
4. `scripts/pdf-export-server.mjs` рисует сцену через `skia-canvas` и возвращает PDF.

`rect`, `ellipse` и `polyline` попадают в PDF как векторные команды. `PIXI.Sprite` экспортируется как bitmap. Весь canvas не растеризуется в одну картинку.

Пример результата можно получить командой `npm run generate:pdf`; файл будет создан в `output/sboard-skia-vector.pdf`.

## Структура

```text
src/
  adapters/          Pixi -> Skia command adapter
  events/            hit-test и pointer-события для Skia canvas
  scene/             демо-сцены и случайные фигуры
  skia/              CanvasKit loader, canvas target, PDF export
  types/             общие типы векторных команд
  utils/             color/matrix helpers
scripts/
  pdf-export-server.mjs       PDF export service
  dev-with-pdf-server.mjs     dev runner
  generate-vector-pdf.mjs     PDF generator
```
