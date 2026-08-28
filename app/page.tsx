"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type User = {
  nickname: string;
  userId: string;
  publicUserId: string;
};

type Submission = {
  id: string;
  user_id: string;
  diary: string;
  target_public_user_id: string | null;
  room_id: string | null;
  created_at: string;
};

// =========================
// Exchangeの基準時刻
// =========================
// 今は20時。
// 将来的に変更する場合はここだけ変更。
const EXCHANGE_START_HOUR = 20;

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // 今のExchange期間を取得
  // =========================
  const getExchangeRange = () => {
    const now = new Date();
    const start = new Date(now);

    // 現在時刻が20時より前なら前日の20時
    if (now.getHours() < EXCHANGE_START_HOUR) {
      start.setDate(start.getDate() - 1);
    }

    start.setHours(EXCHANGE_START_HOUR, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  };

  // =========================
  // データ読み込み
  // =========================
  useEffect(() => {
    const loadData = async () => {
      const savedUser = localStorage.getItem("user");

      if (savedUser === null) {
        router.replace("/setup");
        return;
      }

      const currentUser: User = JSON.parse(savedUser);
      setUser(currentUser);

      const { start, end } = getExchangeRange();

      const { data, error: fetchError } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", currentUser.userId)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("提出取得エラー:", fetchError.message);
        setError("日記データの読み込みに失敗しました。");
        setLoaded(true);
        return;
      }

      setSubmissions(data ?? []);
      setLoaded(true);
    };

    loadData();
  }, [router]);

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  if (!user) {
    return null;
  }

  // 現在のExchange期間における最新の自分の提出
  const todaySubmission = submissions[0];
  const isTodaySubmitted = todaySubmission !== undefined;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">交換日記</h1>
          <p className="mt-2 text-gray-600">
            こんばんは、{user.nickname}さん
          </p>
          <p className="mt-1 text-sm text-gray-500">
            公開ID：{user.publicUserId}
          </p>
        </header>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">今回の日記</h2>

          {isTodaySubmitted ? (
            <>
              <p className="mt-3 text-sm font-medium text-gray-800">
                提出済み ✓
              </p>
              <p className="mt-2 text-sm text-gray-500">
                今回の日記は提出しました。
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-500">
                今回の日記を書いてください。
              </p>
              <Link
                href="/diary"
                className="mt-5 block rounded-lg bg-gray-900 px-4 py-3 text-center text-sm text-white"
              >
                日記を書く
              </Link>
            </>
          )}
        </section>

        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">今回の交換</h2>

          {!todaySubmission ? (
            <p className="mt-2 text-sm text-gray-500">
              日記を提出すると交換が始まります。
            </p>
          ) : todaySubmission.room_id === null ? (
            <>
              <p className="mt-3 font-medium text-gray-800">
                交換相手を探しています…
              </p>
              <p className="mt-2 text-sm text-gray-500">
                相手からの指定を待っています。
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 font-medium text-gray-800">
                交換相手が決まりました。
              </p>
              <Link
                href={`/room/${todaySubmission.room_id}`}
                className="mt-5 block rounded-lg bg-gray-900 px-4 py-3 text-center text-sm text-white"
              >
                交換日記を見る
              </Link>
            </>
          )}
        </section>
      {/* 日記一覧 */}
      <Link
        href="/diaries"
        className="mt-4 block rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        日記一覧を見る
      </Link>
      </div>
    </main>
  );
}
