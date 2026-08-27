"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ===== テスト用の日付 =====
const TEST_DATE = "2026/08/29";

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
  // 提出
  // =========================

  const handleSubmit = () => {
    if (diary.trim() === "") return;

    const targetId =
      targetPublicUserId.trim().toUpperCase();

    setError("");

    // =========================
    // 今回の交換
    // =========================
    //
    // この時点ではまだマッチングしていない。
    //
    // targetId があっても、
    // 相手が確定したわけではない。
    //
    // → matching状態で保存
    // → partnerはnull
    //
    // =========================

    const newExchange = {
      id: crypto.randomUUID(),

      date: TEST_DATE,

      status: "matching",

      partner: null,

      // 自分の日記
      myDiary: diary.trim(),

      // 相手の日記
      partnerDiary: null,

      // 自分から相手への返信
      myReply: null,

      // 相手から自分への返信
      partnerReply: null,

      // 指定した相手がいる場合は
      // マッチング条件として保存
      targetPublicUserId:
        targetId === "" ? null : targetId,
    };

    // =========================
    // これまでの交換履歴
    // =========================

    const savedExchanges =
      localStorage.getItem("exchanges");

    const exchanges = savedExchanges
      ? JSON.parse(savedExchanges)
      : [];

    // =========================
    // 新しい交換を追加
    // =========================

    exchanges.push(newExchange);

    localStorage.setItem(
      "exchanges",
      JSON.stringify(exchanges)
    );

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

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        {/* =========================
            ヘッダー
        ========================= */}

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            日記を確認
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            内容を確認して提出してください。
          </p>
        </header>

        {/* =========================
            日記
        ========================= */}

        <section className="rounded-xl bg-white p-5 shadow-sm">

          <div>
            <p className="text-sm font-medium text-gray-500">
              日記
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {diary}
            </p>
          </div>

          {/* =========================
              指定ポケット
          ========================= */}

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

          {/* =========================
              ボタン
          ========================= */}

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