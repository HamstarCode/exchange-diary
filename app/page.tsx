"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type User = {
  nickname: string;
  userId: string;
  publicUserId: string;
};

type Submission = {
  id: string;
  user_id: string;
  diary: string;
  target_public_user_id: string | null;
  room_id: string | null;
  created_at: string;
};

// =========================
// Exchangeの基準時刻
// =========================
// 今は20時。
// 将来的に変更する場合はここだけ変更。
const EXCHANGE_START_HOUR = 20;

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [matching, setMatching] = useState(false);

  // =========================
  // 今のExchange期間を取得
  // =========================

  const getExchangeRange = () => {
    const now = new Date();

    const start = new Date(now);

    // 現在時刻が20時より前なら前日の20時
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
  // データ読み込み
  // =========================

  useEffect(() => {
    //localStorage.clear();

    const loadData = async () => {
      const savedUser = localStorage.getItem("user");

      if (savedUser === null) {
        router.replace("/setup");
        return;
      }

      const currentUser: User = JSON.parse(savedUser);
      setUser(currentUser);

      const { start, end } = getExchangeRange();

      const { data, error: fetchError } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", currentUser.userId)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error(
          "提出取得エラー:",
          fetchError.message
        );

        setError(
          "日記データの読み込みに失敗しました。"
        );

        setLoaded(true);
        return;
      }

      setSubmissions(data ?? []);
      setLoaded(true);
    };

    loadData();
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
  // 今のExchangeのSubmission
  // =========================

  const todaySubmission = submissions[0];

  const isTodaySubmitted =
    todaySubmission !== undefined;

  // =========================
  // Room生成
  // =========================

  const handleMatching = async () => {
    if (!todaySubmission) {
      return;
    }

    if (todaySubmission.room_id !== null) {
      return;
    }

    if (
      todaySubmission.target_public_user_id === null
    ) {
      setError("指定された相手がいません。");
      return;
    }

    setMatching(true);
    setError("");

    // =========================
    // 相手のユーザーを取得
    // =========================

    const {
      data: partnerUser,
      error: partnerUserError,
    } = await supabase
      .from("users")
      .select("id, public_user_id")
      .eq(
        "public_user_id",
        todaySubmission.target_public_user_id
      )
      .single();

    if (partnerUserError || !partnerUser) {
      console.error(
        "相手ユーザー取得エラー:",
        partnerUserError?.message
      );

      setError("指定した相手が見つかりません。");
      setMatching(false);
      return;
    }

    // =========================
    // 今のExchange期間
    // =========================

    const { start, end } = getExchangeRange();

    // =========================
    // 相手のSubmissionを取得
    // =========================

    const {
      data: partnerSubmission,
      error: partnerSubmissionError,
    } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", partnerUser.id)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (partnerSubmissionError) {
      console.error(
        "相手Submission取得エラー:",
        partnerSubmissionError.message
      );

      setError(
        "相手の日記の確認に失敗しました。"
      );

      setMatching(false);
      return;
    }

    // =========================
    // 相手がまだ提出していない
    // =========================

    if (!partnerSubmission) {
      setError(
        "相手はまだこのExchangeの日記を提出していません。"
      );

      setMatching(false);
      return;
    }

    // =========================
    // 相手も自分を指定しているか確認
    // =========================

    if (
      partnerSubmission.target_public_user_id !==
      user.publicUserId
    ) {
      setError(
        "相手からの指定が確認できません。"
      );

      setMatching(false);
      return;
    }

    // =========================
    // すでにRoomがある場合
    // =========================

    if (partnerSubmission.room_id !== null) {
      setError("すでにRoomが存在します。");
      setMatching(false);
      return;
    }

    // =========================
    // Roomを作成
    // =========================

    const roomId = crypto.randomUUID();

    const { error: roomError } =
      await supabase
        .from("rooms")
        .insert({
          id: roomId,
          user_a_id: user.userId,
          user_b_id: partnerUser.id,
          started_at: start.toISOString(),
          ended_at: end.toISOString(),
        });

    if (roomError) {
      console.error(
        "Room作成エラー:",
        roomError.message
      );

      setError("Roomの作成に失敗しました。");
      setMatching(false);
      return;
    }

    // =========================
    // 自分のSubmissionにRoom IDを設定
    // =========================

    const { error: mySubmissionError } =
      await supabase
        .from("submissions")
        .update({
          room_id: roomId,
        })
        .eq("id", todaySubmission.id);

    if (mySubmissionError) {
      console.error(
        "自分のSubmission更新エラー:",
        mySubmissionError.message
      );

      setError(
        "SubmissionへのRoom紐付けに失敗しました。"
      );

      setMatching(false);
      return;
    }

    // =========================
    // 相手のSubmissionにRoom IDを設定
    // =========================

    const {
      error: partnerSubmissionUpdateError,
    } = await supabase
      .from("submissions")
      .update({
        room_id: roomId,
      })
      .eq("id", partnerSubmission.id);

    if (partnerSubmissionUpdateError) {
      console.error(
        "相手Submission更新エラー:",
        partnerSubmissionUpdateError.message
      );

      setError(
        "相手のSubmissionへのRoom紐付けに失敗しました。"
      );

      setMatching(false);
      return;
    }

    // =========================
    // 画面上のSubmissionも更新
    // =========================

    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === todaySubmission.id
          ? {
              ...submission,
              room_id: roomId,
            }
          : submission
      )
    );

    setMatching(false);
  };

  // =========================
  // 画面
  // =========================

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        {/* ヘッダー */}

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

        {/* エラー */}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* 今のExchangeの日記 */}

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            今回の日記
          </h2>

          {isTodaySubmitted ? (
            <>
              <p className="mt-3 text-sm font-medium text-gray-800">
                提出済み ✓
              </p>

              <p className="mt-2 text-sm text-gray-500">
                今回の日記は提出しました。
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-500">
                今回の日記を書いてください。
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

        {/* 今回の交換 */}

        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            今回の交換
          </h2>

          {!todaySubmission ? (
            <p className="mt-2 text-sm text-gray-500">
              日記を提出すると交換が始まります。
            </p>
          ) : todaySubmission.room_id === null ? (
            <>
              <p className="mt-3 font-medium text-gray-800">
                交換相手を探しています...
              </p>

              <p className="mt-2 text-sm text-gray-500">
                相互に相手を指定するとRoomが作成されます。
              </p>

              <button
                onClick={handleMatching}
                disabled={matching}
                className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {matching
                  ? "確認中..."
                  : "テスト：マッチングする"}
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 font-medium text-gray-800">
                交換相手が決まりました。
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Room ID：{todaySubmission.room_id}
              </p>
            </>
          )}
        </section>

        {/* 日記一覧 */}

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