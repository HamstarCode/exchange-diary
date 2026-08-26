"use client";

import { useState } from "react";

export default function SetupPage() {
  const [nickname, setNickname] = useState("");

  const handleStart = () => {
    if (nickname.trim() === "") return;

    const user = {
      nickname: nickname.trim(),
      userId: crypto.randomUUID(),
      publicUserId: Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase(),
    };

    localStorage.setItem("user", JSON.stringify(user));

    window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">
          交換日記
        </h1>

        <p className="mt-2 text-gray-600">
          はじめにニックネームを設定してください。
        </p>

        <section className="mt-8 rounded-xl bg-white p-5 shadow-sm">
          <label
            htmlFor="nickname"
            className="text-sm font-medium text-gray-700"
          >
            ニックネーム
          </label>

          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ニックネームを入力"
            maxLength={20}
            className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
          />

          <button
            onClick={handleStart}
            disabled={nickname.trim() === ""}
            className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            はじめる
          </button>
        </section>
      </div>
    </main>
  );
}