"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Exchange = {
  id: string;
  date: string;

  partner: {
    publicUserId: string | null;
    nickname: string;
  };

  myDiary: string;
  partnerDiary: string | null;
  myReply: string | null;
  partnerReply: string | null;
};

export default function DiariesPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedExchanges = localStorage.getItem("exchanges");

    if (savedExchanges !== null) {
      setExchanges(JSON.parse(savedExchanges));
    }

    setLoaded(true);
  }, []);

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

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

        {exchanges.length === 0 ? (
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              まだ日記がありません。
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {[...exchanges].reverse().map((exchange) => (
              <Link
                key={exchange.id}
                href={`/diaries/${exchange.id}`}
                className="block rounded-xl bg-white p-5 shadow-sm transition hover:bg-gray-50"
              >
                <p className="text-sm text-gray-500">
                  {exchange.date}
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800">
                  {exchange.partner.nickname}
                </p>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {exchange.myDiary}
                </p>

                {exchange.partnerReply !== null && (
                  <p className="mt-4 text-sm text-gray-500">
                    ＋ 相手からの返信があります
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}