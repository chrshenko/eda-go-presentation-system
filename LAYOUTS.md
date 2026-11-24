# Каталог макетов v1

Сборщик поддерживает 20 макетов. В полном Figma-каталоге 83 макета; остальные доступны как референсы, а не как реализованные ID.

| ID | Когда использовать | Ограничение | Исходник |
|---|---|---|---|
| `cover` | Обложка презентации | Заголовок ≤40 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2372) |
| `section` | Начало нового раздела | Заголовок ≤40 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2378) |
| `agenda` | План встречи | Заголовок ≤65 символов, блоков 1–6 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2383) |
| `metrics3` | Три ключевых показателя | Заголовок ≤65 символов, блоков 3–3 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2414) |
| `grid6` | Шесть направлений | Заголовок ≤65 символов, блоков 6–6 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2422) |
| `comparison` | Сравнение двух подходов | Заголовок ≤65 символов, блоков 2–2 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2431) |
| `timeline` | Четыре этапа запуска | Заголовок ≤65 символов, блоков 2–4 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2463) |
| `table` | Сводная таблица | Заголовок ≤65 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2494) |
| `bar` | Динамика по категориям | Заголовок ≤65 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2511) |
| `text-photo` | Сценарий с фотографией | Заголовок ≤65 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2548) |
| `photo-kpi` | Фото и два показателя | Заголовок ≤65 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2567) |
| `screenshots` | Путь клиента: до пяти экранов | Заголовок ≤65 символов, блоков 1–5 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2579) |
| `gallery` | Три блюда или проекта | Заголовок ≤65 символов, блоков 1–3 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2597) |
| `final` | Завершение выступления | Заголовок ≤40 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2613) |
| `section-yellow` | Альтернативный раздел | Заголовок ≤40 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2619) |
| `schedule` | Расписание и фото | Заголовок ≤65 символов, блоков 1–6 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2623) |
| `kpi-grid` | Четыре значения и главный результат | Заголовок ≤65 символов, блоков 4–4 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2642) |
| `product` | Четыре изменения и экран | Заголовок ≤65 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2663) |
| `theses` | Три ключевых тезиса | Заголовок ≤65 символов, блоков 1–3 | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2678) |
| `line-result` | Динамика и основной вывод | Заголовок ≤65 символов | [Figma](https://www.figma.com/design/uYVONn5qO4mfz2jdwt0OJw/?node-id=12-2689) |

Содержимое полей — в examples/catalog.json. `image` и `items[].image` — пути относительно корня пакета. `source` — источник данных. Подробные проверки и специальные ограничения — в scripts/validate.mjs.

При изменении количества или длины текста проверяйте итоговые превью. Автоматического уменьшения шрифта нет.
В версии 1.0.1 grid6 рассчитан на описание до 100 символов (до трёх строк); ширина и число строк дополнительно измеряются при сборке. В metrics3 допустим явный `valueFontSize: 104` для длинного значения; стандарт 132.
