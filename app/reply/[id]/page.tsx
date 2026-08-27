"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

const REACTIONS = [
  {
    emoji: "👀",
    label: "読みました",
  },
  {
    emoji: "😊",
    label: "共感しました",
  },
  {
    emoji: "👍",
    label: "いいね",
  },
  {
    emoji: "💭",
    label: "考えさせられました",
  },
];

export default function ReplyPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [reply, setReply] = useState("");
  const [selectedReaction, setSelectedReaction] =
    useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedExchanges = localStorage.getItem("exchanges");

    if (savedExchanges !== null) {
      const exchanges: Exchange[] =
        JSON.parse(savedExchanges);

      const foundExchange = exchanges.find(
        (exchange) => exchange.id === id
      );

      if (foundExchange) {
        setExchange(foundExchange);

        setReply(foundExchange.myReply ?? "");
      }
    }

    setLoaded(true);
  }, [id]);

  const handleSubmit = () => {
    // 文章もリアクションもない場合は送信しない
    if (
      reply.trim() === "" &&
      selectedReaction === null
    ) {
      return;
    }

    const savedExchanges =
      localStorage.getItem("exchanges");

    if (savedExchanges === null) return;

    const exchanges: Exchange[] =
      JSON.parse(savedExchanges);

    const reactionText = selectedReaction
      ? `${selectedReaction}`
      : "";

    const replyText = [
      reactionText,
      reply.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    const updatedExchanges = exchanges.map(
      (exchange) => {
        if (exchange.id !== id) {
          return exchange;
        }

        return {
          ...exchange,
          myReply: replyText,
        };
      }
    );

    localStorage.setItem(
      "exchanges",
      JSON.stringify(updatedExchanges)
    );

    router.push("/");
  };

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  if (!exchange) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-md">
          <p className="text-gray-600">
            交換が見つかりません。
          </p>
        </div>
      </main>
    );
  }

  const canSubmit =
    reply.trim() !== "" ||
    selectedReaction !== null;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        <header className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500"
          >
            ← 戻る
          </button>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            返信する
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {exchange.partner.nickname}の日記
          </p>
        </header>

        {/* 相手の日記 */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
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

        {/* リアクション */}
        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            リアクション
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {REACTIONS.map((reaction) => {
              const isSelected =
                selectedReaction === reaction.emoji;

              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() =>
                    setSelectedReaction(
                      isSelected
                        ? null
                        : reaction.emoji
                    )
                  }
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                    isSelected
                      ? "border-gray-900 bg-gray-100"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="text-xl">
                    {reaction.emoji}
                  </span>

                  <span className="ml-2 text-gray-700">
                    {reaction.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 返信入力 */}
        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <label
            htmlFor="reply"
            className="text-sm font-medium text-gray-700"
          >
            返信
          </label>

          <textarea
            id="reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="ひとこと返信できます"
            rows={5}
            className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
          />

          <p className="mt-2 text-xs text-gray-400">
            リアクションだけでも返信できます。
          </p>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            返信する
          </button>
        </section>

      </div>
    </main>
  );
}