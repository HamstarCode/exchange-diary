"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ===== Exchangeの基準時刻 =====
// 将来的に変更する場合はここだけ変更。
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

    // 自分のSubmissionを後で更新するため、IDを先に作成
    const submissionId = crypto.randomUUID();

    // =========================
    // Supabaseに提出を保存
    // =========================

    const { error: insertError } = await supabase
      .from("submissions")
      .insert({
        id: submissionId,
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

    // =========================
    // Submission保存成功
    // =========================

    console.log("Submission保存成功！");

    // =========================
    // 今回、自分を指定している
    // 未マッチの他人のSubmissionを検索
    // =========================

    const {
      data: matchingSubmissions,
      error: matchingError,
    } = await supabase
      .from("submissions")
      .select("*")
      .eq(
        "target_public_user_id",
        user.publicUserId
      )
      .neq("user_id", user.userId)
      .is("room_id", null)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", {
        ascending: false,
      })
      .limit(1);

    if (matchingError) {
      console.error(
        "候補Submissionの検索エラー:",
        matchingError.message
      );
    } else if (
      !matchingSubmissions ||
      matchingSubmissions.length === 0
    ) {
      console.log(
        "今回のExchangeで自分を指定している人はいません。"
      );
    } else {
      const candidate = matchingSubmissions[0];

      console.log(
        "相互指定成立！候補Submission:",
        candidate
      );

      // =========================
      // Roomを作成
      // =========================

      const roomId = crypto.randomUUID();

      const { error: roomError } = await supabase
        .from("rooms")
        .insert({
          id: roomId,
          user_a_id: user.userId,
          user_b_id: candidate.user_id,
          started_at: start.toISOString(),
          ended_at: end.toISOString(),
        });

      if (roomError) {
        console.error(
          "Room作成エラー:",
          roomError.message
        );

        setError("Roomの作成に失敗しました。");
        return;
      }

      // =========================
      // 両方のSubmissionへ同じRoom IDを設定
      // =========================

      const { error: submissionUpdateError } =
        await supabase
          .from("submissions")
          .update({
            room_id: roomId,
          })
          .in("id", [submissionId, candidate.id]);

      if (submissionUpdateError) {
        console.error(
          "SubmissionへのRoom紐付けエラー:",
          submissionUpdateError.message
        );

        setError(
          "SubmissionへのRoom紐付けに失敗しました。"
        );
        return;
      }

      console.log("Room作成・Submission紐付け成功！", {
        roomId,
        mySubmissionId: submissionId,
        candidateSubmissionId: candidate.id,
      });
    }

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
                setTargetPublicUserId(e.target.value);
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