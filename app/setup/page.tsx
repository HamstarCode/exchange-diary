"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SetupPage() {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    if (nickname.trim() === "" || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const user = {
      nickname: nickname.trim(),
      userId: crypto.randomUUID(),
      publicUserId: Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase(),
    };

    // Supabaseにユーザーを保存
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.userId,
        public_user_id: user.publicUserId,
        nickname: user.nickname,
      });

    if (insertError) {
      console.error("ユーザー登録エラー:", insertError.message);
      setError("ユーザー登録に失敗しました。");
      setIsSubmitting(false);
      return;
    }

    // localStorageにも保存
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
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={nickname.trim() === "" || isSubmitting}
            className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? "登録中..." : "はじめる"}
          </button>
        </section>
      </div>
    </main>
  );
}