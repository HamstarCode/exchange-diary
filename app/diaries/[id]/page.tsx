"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const EXCHANGE_START_HOUR = 20;

type Submission = {
  id: string;
  user_id: string;
  diary: string;
  room_id: string | null;
  created_at: string;
};

type Reply = {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  reaction: string | null;
  created_at: string;
};

type DiaryData = {
  id: string;
  date: string;
  diary: string;
  room_id: string | null;
  partnerNickname: string | null;
  partnerReply: string | null;
  partnerReaction: string | null;
};

export default function DiaryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [diaryData, setDiaryData] = useState<DiaryData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // Exchangeの日付
  // =========================

  const getExchangeDate = (createdAt: string) => {
    const date = new Date(createdAt);

    if (date.getHours() < EXCHANGE_START_HOUR) {
      date.setDate(date.getDate() - 1);
    }

    return `${date.getFullYear()}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  };

  // =========================
  // データ取得
  // =========================

  useEffect(() => {
    const loadDiary = async () => {
      const savedUser = localStorage.getItem("user");

      if (savedUser === null) {
        setError("ユーザー情報が見つかりません。");
        setLoaded(true);
        return;
      }

      const currentUser = JSON.parse(savedUser);

      // =========================
      // 自分の日記
      // =========================

      const {
        data: submission,
        error: submissionError,
      } = await supabase
        .from("submissions")
        .select("id, user_id, diary, room_id, created_at")
        .eq("id", id)
        .eq("user_id", currentUser.userId)
        .single();

      if (submissionError) {
        console.error("日記取得エラー:", submissionError.message);
        setError("日記の取得に失敗しました。");
        setLoaded(true);
        return;
      }

      const submissionData = submission as Submission;

      // =========================
      // 未マッチ
      // =========================

      if (submissionData.room_id === null) {
        setDiaryData({
          id: submissionData.id,
          date: getExchangeDate(submissionData.created_at),
          diary: submissionData.diary,
          room_id: null,
          partnerNickname: null,
          partnerReply: null,
          partnerReaction: null,
        });

        setLoaded(true);
        return;
      }

      // =========================
      // Room
      // =========================

      const {
        data: room,
        error: roomError,
      } = await supabase
        .from("rooms")
        .select("user_a_id, user_b_id")
        .eq("id", submissionData.room_id)
        .single();

      if (roomError) {
        console.error("Room取得エラー:", roomError.message);
        setError("交換情報の取得に失敗しました。");
        setLoaded(true);
        return;
      }

      const partnerUserId =
        room.user_a_id === currentUser.userId
          ? room.user_b_id
          : room.user_a_id;

      // =========================
      // 相手の返信・リアクション
      // =========================

      const {
        data: replies,
        error: replyError,
      } = await supabase
        .from("replies")
        .select(
          "id, room_id, user_id, content, reaction, created_at"
        )
        .eq("room_id", submissionData.room_id)
        .eq("user_id", partnerUserId)
        .order("created_at", { ascending: false });

      if (replyError) {
        console.error("返信取得エラー:", replyError.message);
        setError("返信の取得に失敗しました。");
        setLoaded(true);
        return;
      }

      // =========================
      // 相手の返信を取得
      // =========================

      const partnerReplyData =
        replies?.find(
          (reply: Reply) =>
            reply.content !== null &&
            reply.content.trim() !== ""
        ) ?? null;

      // =========================
      // 相手のリアクションを取得
      // =========================

      const partnerReactionData =
        replies?.find(
          (reply: Reply) =>
            reply.reaction !== null &&
            reply.reaction.trim() !== ""
        ) ?? null;

      // =========================
      // 相手のニックネーム
      // =========================

      let partnerNickname: string | null = null;

      const {
        data: partnerUser,
        error: userError,
      } = await supabase
        .from("users")
        .select("id, nickname")
        .eq("id", partnerUserId)
        .single();

      if (userError) {
        console.error(
          "相手ユーザー取得エラー:",
          userError.message
        );
      } else {
        partnerNickname = partnerUser.nickname;
      }

      // =========================
      // 表示データ
      // =========================

      setDiaryData({
        id: submissionData.id,
        date: getExchangeDate(submissionData.created_at),
        diary: submissionData.diary,
        room_id: submissionData.room_id,
        partnerNickname,
        partnerReply: partnerReplyData?.content ?? null,
        partnerReaction: partnerReactionData?.reaction ?? null,
      });

      setLoaded(true);
    };

    loadDiary();
  }, [id]);

  // =========================
  // Loading
  // =========================

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  // =========================
  // Error
  // =========================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-md">
          <p className="text-gray-600">{error}</p>

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

  if (!diaryData) {
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

  const hasResponse =
    diaryData.partnerReply !== null ||
    diaryData.partnerReaction !== null;

  // =========================
  // 画面
  // =========================

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
            {diaryData.date}
          </h1>
        </header>

        {/* 自分の日記 */}

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            自分の日記
          </p>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
            {diaryData.diary}
          </p>
        </section>

        {/* 相手からの返信 */}

        {hasResponse && (
          <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-500">
                {diaryData.partnerNickname ?? "相手"}からの返信
              </p>

              {diaryData.partnerReaction !== null && (
                <span className="text-lg">
                  {diaryData.partnerReaction}
                </span>
              )}
            </div>

            {diaryData.partnerReply !== null && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                {diaryData.partnerReply}
              </p>
            )}
          </section>
        )}

        {/* まだ返信がない */}

        {diaryData.room_id !== null && !hasResponse && (
          <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              まだ返信はありません。
            </p>
          </section>
        )}

        {/* 未マッチ */}

        {diaryData.room_id === null && (
          <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              この日記は交換相手が見つかりませんでした。
            </p>
          </section>
        )}

      </div>
    </main>
  );
}