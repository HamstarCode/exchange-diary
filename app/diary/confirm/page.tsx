"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ===== Exchangeの基準時刻 =====
// 今は20時。将来的に変更する場合はここだけ変更。
const EXCHANGE_START_HOUR = 20;

export default function ConfirmPage() {
  const router = useRouter();

  const [diary, setDiary] = useState("");
  const [targetPublicUserId, setTargetPublicUserId] =
    useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // 下書きを読み込む
  // =========================

  useEffect(() => {
    const saved = localStorage.getItem("draftDiary");

    if (saved !== null) {
      setDiary(saved);
    }

    setLoaded(true);
  }, []);

  // =========================
  // 今のExchange期間を取得
  // =========================

  const getExchangeRange = () => {
    const now = new Date();

    const start = new Date(now);

    // 基準時刻より前なら前日のExchange
    if (now.getHours() < EXCHANGE_START_HOUR) {
      start.setDate(start.getDate() - 1);
    }

    start.setHours(EXCHANGE_START_HOUR, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      start,
      end,
    };
  };

  // =========================
  // 提出
  // =========================

  const handleSubmit = async () => {
    if (diary.trim() === "") return;

    const targetId =
      targetPublicUserId.trim().toUpperCase();

    const savedUser = localStorage.getItem("user");

    if (savedUser === null) {
      setError("ユーザー情報が見つかりません。");
      return;
    }

    const user = JSON.parse(savedUser);

    setError("");

    // =========================
    // 現在のExchange期間を取得
    // =========================

    const { start, end } = getExchangeRange();

    console.log(
      "現在のExchange:",
      start.toISOString(),
      "〜",
      end.toISOString()
    );

    // =========================
    // Supabaseに提出を保存
    // =========================

    const { error: insertError } = await supabase
      .from("submissions")
      .insert({
        id: crypto.randomUUID(),
        user_id: user.userId,
        diary: diary.trim(),
        target_public_user_id:
          targetId === "" ? null : targetId,
        room_id: null,
      });

    if (insertError) {
      console.error(
        "Exchange登録エラー:",
        insertError.message
      );

      setError("日記の提出に失敗しました。");
      return;
    }

    console.log("Submission登録成功");

    // =========================
    // 下書きを削除
    // =========================

    localStorage.removeItem("draftDiary");

    // =========================
    // ホームへ
    // =========================

    router.push("/");
  };

  // =========================
  // 読み込み中
  // =========================

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  // =========================
  // 画面
  // =========================

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            日記を確認
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            内容を確認して提出してください。
          </p>
        </header>

        <section className="rounded-xl bg-white p-5 shadow-sm">

          {/* 日記 */}

          <div>
            <p className="text-sm font-medium text-gray-500">
              日記
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {diary}
            </p>
          </div>

          {/* 指定ポケット */}

          <div className="mt-6">

            <label
              htmlFor="targetPublicUserId"
              className="text-sm font-medium text-gray-700"
            >
              指定ポケット
            </label>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              特定の相手に届けたい場合、
              相手の公開IDを入力してください。
              <br />
              空欄のままだと、
              匿名の相手とマッチングします。
            </p>

            <input
              id="targetPublicUserId"
              type="text"
              value={targetPublicUserId}
              onChange={(e) => {
                setTargetPublicUserId(
                  e.target.value
                );
                setError("");
              }}
              placeholder="公開IDを入力（例：ABC123）"
              className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
            />

            {error && (
              <p className="mt-2 text-sm text-red-500">
                {error}
              </p>
            )}

          </div>

          {/* ボタン */}

          <div className="mt-6 flex gap-3">

            <button
              onClick={() => router.back()}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
            >
              戻る
            </button>

            <button
              onClick={handleSubmit}
              disabled={diary.trim() === ""}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              提出する
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}