"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

export default function DiaryDetailPage() {
  const params = useParams();
  const id = params.id;

  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedExchanges = localStorage.getItem("exchanges");

    if (savedExchanges !== null) {
      const exchanges: Exchange[] = JSON.parse(savedExchanges);

      const foundExchange = exchanges.find(
        (exchange) => exchange.id === id
      );

      if (foundExchange) {
        setExchange(foundExchange);
      }
    }

    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  if (!exchange) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-md">
          <p className="text-gray-600">
            日記が見つかりません。
          </p>

          <Link
            href="/diaries"
            className="mt-5 block text-sm text-gray-600 underline"
          >
            日記一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        <header className="mb-8">
          <Link
            href="/diaries"
            className="text-sm text-gray-500"
          >
            ← 日記一覧
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {exchange.date}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {exchange.partner.nickname}
          </p>
        </header>

        {/* 自分の日記 */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            自分の日記
          </p>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
            {exchange.myDiary}
          </p>
        </section>

        {/* 相手の日記 */}
        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            {exchange.partner.nickname}の日記
          </p>

          {exchange.partnerDiary !== null ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {exchange.partnerDiary}
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              まだ相手の日記は届いていません。
            </p>
          )}
        </section>

        {/* 自分の返信 */}
        {exchange.myReply !== null && (
          <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              自分の返信
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {exchange.myReply}
            </p>
          </section>
        )}

        {/* 相手からの返信 */}
        {exchange.partnerReply !== null && (
          <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              {exchange.partner.nickname}からの返信
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {exchange.partnerReply}
            </p>
          </section>
        )}

      </div>
    </main>
  );
}