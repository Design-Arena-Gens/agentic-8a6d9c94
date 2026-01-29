"use client";

import { useMemo, useState } from "react";

type AnalysisResult = {
  characters: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  estimatedReadMinutes: number;
  sentimentScore: number;
  sentimentLabel: string;
  keywords: string[];
};

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: AnalysisResult };

const SAMPLE_TEXT =
  "Launch day was a resounding success. The team delivered an intuitive interface, and early customers sent overwhelmingly positive feedback. There are a few onboarding roadblocks to iron out, but morale is high and the roadmap feels achievable.";

export default function Home() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [state, setState] = useState<FetchState>({ status: "idle" });

  const sentimentBadge = useMemo(() => {
    if (state.status !== "success") {
      return null;
    }
    const hue =
      state.result.sentimentLabel === "positive"
        ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
        : state.result.sentimentLabel === "negative"
          ? "bg-rose-500/10 text-rose-700 border-rose-200"
          : "bg-slate-500/10 text-slate-700 border-slate-200";

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium capitalize transition-all ${hue}`}
      >
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-current opacity-70" />
        {state.result.sentimentLabel} tone
        <span className="text-xs opacity-60">
          ({state.result.sentimentScore.toFixed(2)})
        </span>
      </span>
    );
  }, [state]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setState({
        status: "error",
        message: "Введите текст для анализа.",
      });
      return;
    }

    setState({ status: "loading" });
    try {
      const response = await fetch("/api/python/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorPayload?.error ?? "Не удалось выполнить анализ.");
      }

      const data = (await response.json()) as { result: AnalysisResult };
      setState({ status: "success", result: data.result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Неизвестная ошибка.";
      setState({ status: "error", message });
    }
  };

  return (
    <div className="flex min-h-screen w-full justify-center px-4 py-10">
      <main className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
        <div className="relative flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Text Insight Studio
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl">
              Анализируйте текст мгновенно
            </h1>
            <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
              Вставьте произвольный текст и получите ключевые метрики: длину,
              уникальные слова, предполагаемое время чтения и базовую оценку
              настроения. Обработка выполняется в Python-функции на Vercel.
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <label
              htmlFor="text-input"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Текст для анализа
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-[180px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-inner transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
              placeholder="Вставьте текст или начните печатать..."
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={state.status === "loading"}
                className="flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-50 shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {state.status === "loading" ? (
                  <>
                    <span className="h-2 w-2 animate-ping rounded-full bg-current" />
                    Анализируем...
                  </>
                ) : (
                  "Проанализировать"
                )}
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Данные не сохраняются и не отправляются третьим сторонам.
              </span>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Результаты
              </h2>
              {sentimentBadge}
            </div>

            {state.status === "error" && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-inner dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                {state.message}
              </div>
            )}

            {state.status === "idle" && (
              <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Заполните текст и нажмите «Проанализировать», чтобы увидеть
                результаты.
              </div>
            )}

            {state.status === "loading" && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                Готовим статистику...
              </div>
            )}

            {state.status === "success" && (
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  label="Символов"
                  value={state.result.characters.toLocaleString("ru-RU")}
                />
                <MetricCard
                  label="Слов"
                  value={state.result.words.toLocaleString("ru-RU")}
                />
                <MetricCard
                  label="Уникальных слов"
                  value={state.result.uniqueWords.toLocaleString("ru-RU")}
                />
                <MetricCard
                  label="Предложений"
                  value={state.result.sentences.toLocaleString("ru-RU")}
                />
                <MetricCard
                  label="Время чтения"
                  value={`${state.result.estimatedReadMinutes.toFixed(2)} мин`}
                  hint="Расчёт основан на скорости чтения 200 слов в минуту."
                />
                <MetricCard
                  label="Ключевые слова"
                  value={
                    state.result.keywords.length
                      ? state.result.keywords.join(", ")
                      : "Не выделены"
                  }
                  hint="Отбираются слова длиннее 5 символов с наибольшей частотой."
                />
              </div>
            )}
          </section>

          <footer className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-xs text-slate-500 shadow-inner dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            Python-функция размещена в файле <code>api/python/analyze.py</code> и
            используется как бессерверная ручка Vercel. Интерфейс написан на
            Next.js 16 с Tailwind CSS v4.
          </footer>
        </div>
      </main>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <article className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        {label}
        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
      </div>
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-xl">
        {value}
      </p>
      {hint && (
        <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      )}
    </article>
  );
}
