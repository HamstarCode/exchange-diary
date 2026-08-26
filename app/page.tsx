"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  nickname: string;
  userId: string;
  publicUserId: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

 useEffect(() => {
  console.log("Home useEffect 開始");

  const savedUser = localStorage.getItem("user");
  console.log("savedUser:", savedUser);

  if (savedUser !== null) {
    setUser(JSON.parse(savedUser));
  }

  setLoaded(true);
  console.log("loaded true");
}, []);

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  if (!user) {
    return <p>ユーザー情報がありません。</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">
          交換日記
        </h1>

        <p className="mt-2 text-gray-600">
          こんばんは、{user.nickname}さん
        </p>

        <p className="mt-1 text-sm text-gray-500">
          公開ID：{user.publicUserId}
        </p>

        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            今日の日記
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            まだ日記を提出していません。
          </p>

          <Link
            href="/diary"
            className="mt-5 block rounded-lg bg-gray-900 px-4 py-3 text-center text-sm text-white"
          >
            日記を書く
          </Link>
        </section>

        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            今晩の交換
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            マッチング待機中
          </p>
        </section>
      </div>
    </main>
  );
}