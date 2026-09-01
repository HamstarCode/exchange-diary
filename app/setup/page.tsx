"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const PERSONALITY_TYPES = [
  "船長タイプ",
  "大黒柱タイプ",
  "仕掛け人タイプ",
  "軍師タイプ",
  "実況者タイプ",
  "観察者タイプ",
  "旅人タイプ",
  "職人タイプ",
  "応援団タイプ",
  "聞き役タイプ",
  "太陽タイプ",
  "癒し系タイプ",
  "ムードメーカー",
  "包容力タイプ",
  "盛り上げ役タイプ",
  "社交家タイプ",
  "バランス型",
];

export default function SetupPage() {
  const [nickname, setNickname] = useState("");
  const [personalityType, setPersonalityType] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    // ニックネームと性格タイプの両方が必要
    if (
      nickname.trim() === "" ||
      personalityType === "" ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    const user = {
      nickname: nickname.trim(),
      userId: crypto.randomUUID(),
      publicUserId: Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase(),
      personalityType,
    };

    // =========================
    // Supabaseにユーザーを保存
    // =========================

    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.userId,
        public_user_id: user.publicUserId,
        nickname: user.nickname,
        personality_type: user.personalityType,
      });

    if (insertError) {
      console.error(
        "ユーザー登録エラー:",
        insertError.message
      );

      setError("ユーザー登録に失敗しました。");
      setIsSubmitting(false);
      return;
    }

    // =========================
    // localStorageにも保存
    // =========================

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    // =========================
    // ホームへ
    // =========================

    window.location.href = "/";
  };

  const canStart =
    nickname.trim() !== "" &&
    personalityType !== "" &&
    !isSubmitting;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">
          交換日記
        </h1>

        <p className="mt-2 text-gray-600">
          はじめにニックネームと対人スタイルを設定してください。
        </p>

        <section className="mt-8 rounded-xl bg-white p-5 shadow-sm">
          {/* =========================
              ニックネーム
          ========================= */}

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
            onChange={(e) => {
              setNickname(e.target.value);
              setError("");
            }}
            placeholder="ニックネームを入力"
            maxLength={20}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
          />

          {/* =========================
              性格タイプ
          ========================= */}

          <label
            htmlFor="personalityType"
            className="mt-6 block text-sm font-medium text-gray-700"
          >
            対人スタイル
          </label>

          <select
            id="personalityType"
            value={personalityType}
            onChange={(e) => {
              setPersonalityType(e.target.value);
              setError("");
            }}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            <option value="">
              タイプを選択してください
            </option>

            {PERSONALITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* =========================
              エラー
          ========================= */}

          {error && (
            <p className="mt-3 text-sm text-red-500">
              {error}
            </p>
          )}

          {/* =========================
              はじめる
          ========================= */}

          <button
            onClick={handleStart}
            disabled={!canStart}
            className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? "登録中..." : "はじめる"}
          </button>
        </section>
      </div>
    </main>
  );
}