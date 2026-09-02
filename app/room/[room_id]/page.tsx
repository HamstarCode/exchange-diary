"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Room = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  started_at: string;
  ended_at: string;
};

type Submission = {
  id: string;
  user_id: string;
  diary: string;
  target_public_user_id: string | null;
  room_id: string | null;
  created_at: string;
};

type Reply = {
  id: string;
  room_id: string;
  user_id: string;
  content: string | null;
  reaction: string | null;
  created_at: string;
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

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();

  const roomId = params.room_id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [partnerSubmission, setPartnerSubmission] =
    useState<Submission | null>(null);

  const [reply, setReply] = useState("");
  const [selectedReaction, setSelectedReaction] =
    useState<string | null>(null);

  const [myReply, setMyReply] = useState<Reply | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [isExpired, setIsExpired] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadRoom = async () => {
      // =========================
      // 自分のユーザー情報
      // =========================

      const savedUser = localStorage.getItem("user");

      if (savedUser === null) {
        setError("ユーザー情報が見つかりません。");
        setLoaded(true);
        return;
      }

      const currentUser = JSON.parse(savedUser);

      // =========================
      // Room取得
      // =========================

      const { data: roomData, error: roomError } =
        await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

      if (roomError) {
        console.error(
          "Room取得エラー:",
          roomError.message
        );

        setError("Roomの取得に失敗しました。");
        setLoaded(true);
        return;
      }

      setRoom(roomData);

      // =========================
      // 時間判定
      // =========================

      const now = new Date();

      const startedAt = new Date(roomData.started_at);
      const endedAt = new Date(roomData.ended_at);

      // Exchange開始日の翌朝6:00
      const openAt = new Date(startedAt);

      openAt.setDate(openAt.getDate() + 1);
      openAt.setHours(6, 0, 0, 0);

      setIsOpen(now >= openAt);
      setIsExpired(now >= endedAt);

      // =========================
      // このRoomの日記を取得
      // =========================

      const {
        data: submissionData,
        error: submissionError,
      } = await supabase
        .from("submissions")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", {
          ascending: true,
        });

      if (submissionError) {
        console.error(
          "Submission取得エラー:",
          submissionError.message
        );

        setError("日記の取得に失敗しました。");
        setLoaded(true);
        return;
      }

      // =========================
      // 相手の日記を取得
      // =========================

      const partnerDiary =
        submissionData?.find(
          (submission) =>
            submission.user_id !== currentUser.userId
        ) ?? null;

      setPartnerSubmission(partnerDiary);

      // =========================
      // 自分の返信を取得
      // =========================

      const {
        data: replyData,
        error: replyError,
      } = await supabase
        .from("replies")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", currentUser.userId)
        .maybeSingle();

      if (replyError) {
        console.error(
          "返信取得エラー:",
          replyError.message
        );

        setError("返信の取得に失敗しました。");
        setLoaded(true);
        return;
      }

      setMyReply(replyData ?? null);

      setLoaded(true);
    };

    loadRoom();
  }, [roomId]);

  // =========================
  // 返信する
  // =========================

  const handleReply = async () => {
    // 文章もリアクションもない場合
    if (
      reply.trim() === "" &&
      selectedReaction === null
    ) {
      return;
    }

    // すでに返信済み
    if (myReply !== null) {
      return;
    }

    // Roomがない
    if (!room) {
      return;
    }

    // =========================
    // 閲覧開始時間チェック
    // =========================

    const now = new Date();

    const startedAt = new Date(room.started_at);
    const openAt = new Date(startedAt);

    openAt.setDate(openAt.getDate() + 1);
    openAt.setHours(6, 0, 0, 0);

    if (now < openAt) {
      setIsOpen(false);
      setError("このExchangeは朝6時から開放されます。");
      return;
    }

    // =========================
    // 返信期限チェック
    // =========================

    const end = new Date(room.ended_at);

    if (now >= end) {
      setIsExpired(true);
      setError("このExchangeは終了しました。");
      return;
    }

    // =========================
    // ユーザー取得
    // =========================

    const savedUser = localStorage.getItem("user");

    if (savedUser === null) {
      setError("ユーザー情報が見つかりません。");
      return;
    }

    const currentUser = JSON.parse(savedUser);

    setSending(true);
    setError("");

    // =========================
    // 返信保存
    // =========================

    const { data: replyData, error: replyError } =
      await supabase
        .from("replies")
        .insert({
          id: crypto.randomUUID(),
          room_id: roomId,
          user_id: currentUser.userId,
          content:
            reply.trim() === ""
              ? null
              : reply.trim(),
          reaction: selectedReaction,
        })
        .select()
        .single();

    if (replyError) {
      console.error(
        "返信送信エラー:",
        replyError.message
      );

      setError("返信の送信に失敗しました。");
      setSending(false);
      return;
    }

    setMyReply(replyData);
    setSending(false);

    // =========================
    // 返信後はホームへ
    // =========================

    router.push("/");
  };

  // =========================
  // 読み込み中
  // =========================

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  if (error && !room) {
    return <p>{error}</p>;
  }

  if (!room) {
    return <p>Roomが見つかりません。</p>;
  }

  // =========================
  // 送信可能か
  // =========================

  const canSubmit =
    reply.trim() !== "" ||
    selectedReaction !== null;

  // =========================
  // 画面
  // =========================

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        {/* ホームに戻る */}

        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-gray-500"
        >
          ← ホームに戻る
        </button>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          交換日記
        </h1>

        {/* =========================
            相手の日記
        ========================= */}

        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">

          <p className="text-sm font-medium text-gray-500">
            相手の日記
          </p>

          {!isOpen ? (
            <>
              <p className="mt-3 font-medium text-gray-800">
                まだ開放されていません。
              </p>

              <p className="mt-2 text-sm text-gray-500">
                朝6時になると相手の日記を閲覧できます。
              </p>
            </>
          ) : partnerSubmission ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {partnerSubmission.diary}
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              相手の日記がありません。
            </p>
          )}

        </section>

        {/* =========================
            返信
        ========================= */}

        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">

          <p className="text-sm font-medium text-gray-500">
            返信
          </p>

          {!isOpen ? (
            <p className="mt-3 text-sm text-gray-500">
              朝6時から返信できます。
            </p>
          ) : myReply ? (
            <>
              <p className="mt-3 text-sm font-medium text-gray-800">
                返信済み ✓
              </p>

              {myReply.reaction && (
                <p className="mt-3 text-2xl">
                  {myReply.reaction}
                </p>
              )}

              {myReply.content && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {myReply.content}
                </p>
              )}

              <p className="mt-4 text-sm text-gray-500">
                次のExchangeまでお待ちください。
              </p>
            </>
          ) : isExpired ? (
            <>
              <p className="mt-3 font-medium text-gray-800">
                このExchangeは終了しました。
              </p>

              <p className="mt-2 text-sm text-gray-500">
                返信期限を過ぎています。
              </p>
            </>
          ) : (
            <>
              {/* リアクション */}

              <p className="mt-3 text-sm font-medium text-gray-700">
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

              {/* 返信入力 */}

              <label
                htmlFor="reply"
                className="mt-5 block text-sm font-medium text-gray-700"
              >
                返信
              </label>

              <textarea
                id="reply"
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  setError("");
                }}
                placeholder="ひとこと返信できます"
                rows={5}
                className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
              />

              <p className="mt-2 text-xs text-gray-400">
                リアクションだけでも返信できます。
              </p>

              <button
                onClick={handleReply}
                disabled={sending || !canSubmit}
                className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {sending ? "送信中..." : "返信する"}
              </button>
            </>
          )}

        </section>

        {/* エラー */}

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}

      </div>
    </main>
  );
}