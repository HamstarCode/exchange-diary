"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  nickname: string;
  userId: string;
  publicUserId: string;
};

type Exchange = {
  id: string;
  date: string;

  status: "matching" | "matched";

  partner: {
    publicUserId: string | null;
    nickname: string;
  } | null;

  myDiary: string;
  partnerDiary: string | null;
  myReply: string | null;
  partnerReply: string | null;
};

// ===== テスト用の日付 =====
const TEST_TODAY_DATE = "2026/08/29";
const TEST_PREVIOUS_DATE = "2026/08/28";

// ===== 仮想ユーザー =====
const MOCK_PARTNER = {
  publicUserId: "ABC123",
  nickname: "テストユーザーA",
};

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loaded, setLoaded] = useState(false);

  // =========================
  // データ読み込み
  // =========================

  useEffect(() => {
    //localStorage.clear();
    const savedUser = localStorage.getItem("user");

    if (savedUser === null) {
      router.replace("/setup");
      return;
    }

    setUser(JSON.parse(savedUser));

    const savedExchanges =
      localStorage.getItem("exchanges");

    if (savedExchanges !== null) {
      setExchanges(JSON.parse(savedExchanges));
    }

    setLoaded(true);
  }, [router]);

  // =========================
  // 読み込み中
  // =========================

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  if (!user) {
    return null;
  }

  // =========================
  // 今日のExchange
  // =========================

  const todayExchange = exchanges.find(
    (exchange) =>
      exchange.date === TEST_TODAY_DATE
  );

  // =========================
  // 前日のExchange
  // =========================

  const previousExchange = exchanges.find(
    (exchange) =>
      exchange.date === TEST_PREVIOUS_DATE
  );

  // =========================
  // 前日の返信判定
  // =========================

  const previousMatched =
    previousExchange?.status === "matched";

  const hasPreviousPartnerDiary =
    previousMatched &&
    previousExchange.partnerDiary !== null;

  const hasPreviousMyReply =
    previousMatched &&
    previousExchange.myReply !== null;

  const needsReply =
    previousMatched &&
    hasPreviousPartnerDiary &&
    !hasPreviousMyReply;

  // =========================
  // 今日の日記提出済み
  // =========================

  const isTodaySubmitted =
    todayExchange !== undefined;

  // =========================
  // テスト用マッチング処理
  // =========================

  const handleMatching = () => {
    if (!todayExchange) {
      return;
    }

    if (todayExchange.status !== "matching") {
      return;
    }

    const updatedExchanges = exchanges.map(
      (exchange) => {
        if (exchange.id !== todayExchange.id) {
          return exchange;
        }

        return {
          ...exchange,

          status: "matched" as const,

          partner: {
            publicUserId:
              MOCK_PARTNER.publicUserId,
            nickname:
              MOCK_PARTNER.nickname,
          },
        };
      }
    );

    localStorage.setItem(
      "exchanges",
      JSON.stringify(updatedExchanges)
    );

    setExchanges(updatedExchanges);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        {/* =========================
            ヘッダー
        ========================= */}

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            交換日記
          </h1>

          <p className="mt-2 text-gray-600">
            こんばんは、{user.nickname}さん
          </p>

          <p className="mt-1 text-sm text-gray-500">
            公開ID：{user.publicUserId}
          </p>
        </header>

        {/* =========================
            今日の日記
        ========================= */}

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            今日の日記
          </h2>

          {needsReply ? (
            <>
              <p className="mt-3 text-sm text-gray-500">
                昨日の相手の日記に返信してから、
                今日の日記を書いてください。
              </p>

              <Link
                href={`/reply/${previousExchange!.id}`}
                className="mt-5 block rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white"
              >
                返信する
              </Link>
            </>
          ) : isTodaySubmitted ? (
            <>
              <p className="mt-3 text-sm font-medium text-gray-800">
                提出済み ✓
              </p>

              <p className="mt-2 text-sm text-gray-500">
                今日の日記は提出しました。
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-500">
                今日の日記を書いてください。
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

        {/* =========================
            今晩の交換
        ========================= */}

        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            今晩の交換
          </h2>

          {/* まだ今日の日記を提出していない */}

          {!todayExchange ? (
            <p className="mt-2 text-sm text-gray-500">
              今日の日記を提出すると交換が始まります。
            </p>
          ) : todayExchange.status === "matching" ? (
            /* マッチング待機中 */

            <>
              <p className="mt-3 font-medium text-gray-800">
                交換相手を探しています...
              </p>

              <p className="mt-2 text-sm text-gray-500">
                相手が見つかるまでお待ちください。
              </p>

              {/* テスト用 */}

              <button
                onClick={handleMatching}
                className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white"
              >
                テスト：マッチングする
              </button>
            </>
          ) : (
            /* マッチング成立 */

            <>
              <p className="mt-3 text-sm text-gray-500">
                交換相手
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {todayExchange.partner?.nickname}
              </p>

              <p className="mt-4 text-sm text-gray-500">
                状態
              </p>

              {todayExchange.partnerDiary === null ? (
                <p className="mt-1 font-medium text-gray-800">
                  相手の日記を待っています
                </p>
              ) : (
                <p className="mt-1 font-medium text-gray-800">
                  相手の日記が届きました
                </p>
              )}
            </>
          )}
        </section>

        {/* =========================
            日記一覧
        ========================= */}

        <Link
          href="/diaries"
          className="mt-4 block rounded-xl bg-white p-5 text-center text-sm font-medium text-gray-700 shadow-sm"
        >
          日記一覧を見る
        </Link>

      </div>
    </main>
  );
}