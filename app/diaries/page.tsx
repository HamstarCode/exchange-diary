"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Submission = {
  id: string;
  created_at: string;
};

const EXCHANGE_START_HOUR = 20;

// =========================
// Submissionが属するExchangeの日付
// =========================
const getExchangeDate = (createdAt: string) => {
  const date = new Date(createdAt);

  // 20時より前なら前日のExchange
  if (date.getHours() < EXCHANGE_START_HOUR) {
    date.setDate(date.getDate() - 1);
  }

  return `${date.getFullYear()}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${String(
    date.getDate()
  ).padStart(2, "2")}`;
};

export default function DiariesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDiaries = async () => {
      // =========================
      // 自分のユーザー情報
      // =========================

      const savedUser = localStorage.getItem("user");

      if (savedUser === null) {
        setError("ユーザー情報が見つかりません。");
        setLoaded(true);
        return;
      }

      const user = JSON.parse(savedUser);

      // =========================
      // 自分の日記を取得
      // =========================

      const { data, error: fetchError } = await supabase
        .from("submissions")
        .select("id, created_at")
        .eq("user_id", user.userId)
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        console.error(
          "日記一覧取得エラー:",
          fetchError.message
        );

        setError("日記一覧の取得に失敗しました。");
        setLoaded(true);
        return;
      }

      setSubmissions(data ?? []);
      setLoaded(true);
    };

    loadDiaries();
  }, []);

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        {/* =========================
            ヘッダー
        ========================= */}

        <header className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500"
          >
            ← ホームに戻る
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            日記一覧
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            これまでの交換日記
          </p>
        </header>

        {/* =========================
            エラー
        ========================= */}

        {error && (
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-red-500">
              {error}
            </p>
          </section>
        )}

        {/* =========================
            日記一覧
        ========================= */}

        {!error && submissions.length === 0 ? (
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              まだ日記がありません。
            </p>
          </section>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            {submissions.map((submission, index) => (
              <Link
                key={submission.id}
                href={`/diaries/${submission.id}`}
                className={`block px-5 py-4 text-sm text-gray-800 transition hover:bg-gray-50 ${
                  index !== submissions.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                {getExchangeDate(submission.created_at)}
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}