"use client";

import { useState } from "react";

export default function DiaryPage() {
  const [diary, setDiary] = useState("");

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            今日の日記
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            今日あったことや感じたことを書いてみよう。
          </p>
        </header>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <textarea
            value={diary}
            onChange={(e) => setDiary(e.target.value)}
            placeholder="ここに日記を書いてください..."
            className="h-64 w-full resize-none rounded-lg border border-gray-200 p-4 text-sm text-gray-800 outline-none focus:border-gray-400"
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {diary.length}文字
            </p>

            <button
              disabled={diary.trim().length === 0}
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              提出する
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}