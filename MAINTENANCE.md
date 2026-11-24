# Обновление системы

Каноническая Figma: https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2276

1. Внести и проверить правки в Figma.
2. Записать изменения правил в DESIGN-RULES.md и presentation.tokens.json.
3. Обновить соответствующий layout в scripts/build.mjs и его лимиты в layouts.json/validate.mjs.
4. Обновить исходные ссылки/превью и examples/catalog.json. Не заменять оригинальные SVG логотипов ручным рисунком.
5. Собрать каталог; проверить все изменённые слайды и один новый реальный бриф.
6. Обновить templates/catalog.pptx, PDF и превью, receipt и CHANGELOG.md. Пометить, какие версии совместимы.

Полная библиотека Figma шире v1 сборщика. Расширяя его, добавлять новый ID в schema, layouts.json, validate.mjs, build.mjs и пример каталога в одном изменении.

При выпуске обновлять и PPTX, и PDF каталога, PNG-превью, пример, номер версии, CHANGELOG и отчёт проверок. Проверять изображение спирали после любого повторного экспорта из Figma: SVG viewBox должен соответствовать полному рисунку. Выполнить scripts/package-release.py, чтобы хеши и архив соответствовали последней версии.
