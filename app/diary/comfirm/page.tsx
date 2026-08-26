"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const [targetId, setTargetId] = useState("");
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">提出前確認</h1>

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">指定ポケット</h2>

          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="相手の公開IDを入力"
            className="mt-4 w-full rounded-xl border p-3 outline-none focus:ring-2"
          />

          <p className="mt-3 text-sm text-gray-500">
            空欄の場合は自動マッチングになります。
          </p>
        </section>

        <button
          onClick={() => router.push("/waiting")}
          className="mt-6 w-full rounded-xl bg-black py-3 font-medium text-white"
        >
          この内容で提出
        </button>

        <button
          onClick={() => router.back()}
          className="mt-3 w-full rounded-xl py-3 text-gray-500"
        >
          戻る
        </button>
      </div>
    </main>
  );
}