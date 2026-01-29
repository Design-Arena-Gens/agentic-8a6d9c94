## Text Insight Studio

Веб‑приложение на Next.js 16 для моментального анализа текста. Интерфейс на Tailwind CSS отправляет данные в Python-функцию (`api/python/analyze.py`), развёртываемую как бессерверный обработчик на Vercel. API возвращает структуру с ключевыми метриками текста, а клиент визуализирует их в карточках.

### Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000), вставьте текст и нажмите «Проанализировать».

### Производственная сборка

```bash
npm run build
npm start
```

### Тестирование Python ручки локально

Vercel CLI позволяет поднять среду, которая корректно исполняет Python-функции:

```bash
vercel dev
```

или отправьте запрос напрямую на развёрнутый экземпляр:

```bash
curl -X POST https://agentic-8a6d9c94.vercel.app/api/python/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Пример текста для анализа."}'
```

### Что внутри

- Next.js 16 (App Router, React 19)
- Tailwind CSS v4
- Python serverless endpoint с простым NLP (подсчёт слов, уникальных токенов, времени чтения, базовая оценка настроения)

Приложение полностью готово к деплою на Vercel.
