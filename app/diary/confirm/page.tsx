"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ===== Exchangeの基準時刻 =====
const EXCHANGE_START_HOUR = 20;

// ===== 日記の提出締切時刻 =====
const EXCHANGE_SUBMIT_END_HOUR = 5;

// ===== 性格タイプの相性 =====
const MATCHING_TYPE: Record<string, string> = {
  船長タイプ: "応援団タイプ",
  応援団タイプ: "船長タイプ",

  大黒柱タイプ: "聞き役タイプ",
  聞き役タイプ: "大黒柱タイプ",

  仕掛け人タイプ: "旅人タイプ",
  旅人タイプ: "仕掛け人タイプ",

  軍師タイプ: "職人タイプ",
  職人タイプ: "軍師タイプ",

  実況者タイプ: "実況者タイプ",
  観察者タイプ: "観察者タイプ",

  太陽タイプ: "盛り上げ役タイプ",
  盛り上げ役タイプ: "太陽タイプ",

  癒し系タイプ: "社交家タイプ",
  社交家タイプ: "癒し系タイプ",

  ムードメーカー: "ムードメーカー",
  包容力タイプ: "包容力タイプ",
};

type Submission = {
  id: string;
  user_id: string;
  room_id: string | null;
};

type Bookmark = {
  publicUserId: string;
  nickname: string;
};

type TargetUser = {
  publicUserId: string;
  nickname: string;
};

export default function ConfirmPage() {
  const router = useRouter();

  const [diary, setDiary] = useState("");
  const [targetPublicUserId, setTargetPublicUserId] =
    useState("");

  const [bookmarks, setBookmarks] =
    useState<Bookmark[]>([]);

  const [showBookmarks, setShowBookmarks] =
    useState(false);

  const [targetUsers, setTargetUsers] =
    useState<TargetUser[]>([]);

  const [showTargetUsers, setShowTargetUsers] =
    useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // =========================
  // 今のExchange期間を取得
  // =========================
  const getExchangeRange = () => {
    const now = new Date();
    const start = new Date(now);

    if (now.getHours() < EXCHANGE_START_HOUR) {
      start.setDate(start.getDate() - 1);
    }

    start.setHours(
      EXCHANGE_START_HOUR,
      0,
      0,
      0
    );

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  };

  // =========================
  // 下書き・ブックマーク・
  // 最近あなたを指定してくれた人を読み込む
  // =========================
  useEffect(() => {
    const loadData = async () => {
      // =========================
      // 下書き
      // =========================
      const savedDiary =
        localStorage.getItem("draftDiary");

      if (savedDiary !== null) {
        setDiary(savedDiary);
      }

      // =========================
      // ブックマーク
      // =========================
      const savedBookmarks =
        localStorage.getItem("bookmarks");

      if (savedBookmarks !== null) {
        try {
          const parsedBookmarks: Bookmark[] =
            JSON.parse(savedBookmarks);

          setBookmarks(parsedBookmarks);
        } catch {
          console.error(
            "ブックマークの読み込みに失敗しました。"
          );
        }
      }

      // =========================
      // ローカルユーザー
      // =========================
      const savedUser =
        localStorage.getItem("user");

      if (savedUser === null) {
        setLoaded(true);
        return;
      }

      const user = JSON.parse(savedUser);

      // =========================
      // 現在のExchange
      // =========================
      const { start, end } =
        getExchangeRange();

      const startIso =
        start.toISOString();

      const endIso =
        end.toISOString();

      // =========================
      // 最近あなたを指定してくれた人
      //
      // 現在のExchange内
      // 未マッチ
      // 自分自身は除外
      // 新しい順
      // 直近3件
      // =========================
      const {
        data: targetSubmissions,
        error: targetSubmissionError,
      } = await supabase
        .from("submissions")
        .select(
          "id, user_id, created_at"
        )
        .eq(
          "target_public_user_id",
          user.publicUserId
        )
        .is("room_id", null)
        .neq(
          "user_id",
          user.userId
        )
        .gte(
          "created_at",
          startIso
        )
        .lt(
          "created_at",
          endIso
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(3);

      if (targetSubmissionError) {
        console.error(
          "ターゲット一覧取得エラー:",
          targetSubmissionError.message
        );
        setLoaded(true);
        return;
      }

      // =========================
      // 相手ユーザー情報を取得
      // =========================
      if (
        targetSubmissions &&
        targetSubmissions.length > 0
      ) {
        const targetUserIds =
          targetSubmissions.map(
            (submission) =>
              submission.user_id
          );

        const {
          data: targetUserData,
          error: targetUserError,
        } = await supabase
          .from("users")
          .select(
            "id, nickname, public_user_id"
          )
          .in(
            "id",
            targetUserIds
          );

        if (targetUserError) {
          console.error(
            "ターゲットユーザー取得エラー:",
            targetUserError.message
          );
        } else if (
          targetUserData
        ) {
          // Submissionの順番を維持する
          const usersById =
            new Map(
              targetUserData.map(
                (targetUser) => [
                  targetUser.id,
                  targetUser,
                ]
              )
            );

          const targets: TargetUser[] =
            targetSubmissions
              .map(
                (submission) => {
                  const targetUser =
                    usersById.get(
                      submission.user_id
                    );

                  if (
                    !targetUser
                  ) {
                    return null;
                  }

                  return {
                    publicUserId:
                      targetUser.public_user_id,
                    nickname:
                      targetUser.nickname,
                  };
                }
              )
              .filter(
                (
                  target
                ): target is TargetUser =>
                  target !== null
              );

          setTargetUsers(targets);
        }
      }

      setLoaded(true);
    };

    loadData();
  }, []);

  // =========================
  // ブックマークを選択
  // =========================
  const handleSelectBookmark = (
    bookmark: Bookmark
  ) => {
    setTargetPublicUserId(
      bookmark.publicUserId
    );

    setError("");
  };

  // =========================
  // 最近あなたを指定してくれた人を選択
  // =========================
  const handleSelectTargetUser = (
    targetUser: TargetUser
  ) => {
    setTargetPublicUserId(
      targetUser.publicUserId
    );

    setError("");
  };

  // =========================
  // ブックマーク削除確認
  // =========================
  const handleDeleteBookmark = (
    publicUserId: string
  ) => {
    setDeleteTarget(publicUserId);
  };

  // =========================
  // ブックマーク削除
  // =========================
  const confirmDeleteBookmark = () => {
    if (deleteTarget === null) {
      return;
    }

    const updatedBookmarks =
      bookmarks.filter(
        (bookmark) =>
          bookmark.publicUserId !==
          deleteTarget
      );

    localStorage.setItem(
      "bookmarks",
      JSON.stringify(
        updatedBookmarks
      )
    );

    setBookmarks(updatedBookmarks);
    setDeleteTarget(null);
  };

  // =========================
  // 提出
  // =========================
  const handleSubmit = async () => {
    if (
      diary.trim() === "" ||
      isSubmitting
    ) {
      return;
    }

    // =========================
    // 提出可能時間チェック
    // =========================
    const { start } =
      getExchangeRange();

    const submitEndAt =
      new Date(start);

    submitEndAt.setDate(
      submitEndAt.getDate() + 1
    );

    submitEndAt.setHours(
      EXCHANGE_SUBMIT_END_HOUR,
      0,
      0,
      0
    );

    if (
      new Date() >=
      submitEndAt
    ) {
      setError(
        "日記の提出受付は終了しました。"
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    // =========================
    // ローカルユーザー取得
    // =========================
    const savedUser =
      localStorage.getItem("user");

    if (savedUser === null) {
      setError(
        "ユーザー情報が見つかりません。"
      );
      setIsSubmitting(false);
      return;
    }

    const user =
      JSON.parse(savedUser);

    // =========================
    // 指定ポケット
    // =========================
    const targetId =
      targetPublicUserId
        .trim()
        .toUpperCase();

    // 自分自身は指定できない
    if (
      targetId !== "" &&
      targetId ===
        user.publicUserId
    ) {
      setError(
        "この公開IDは存在しません。"
      );
      setIsSubmitting(false);
      return;
    }

    // =========================
    // Exchange期間
    // =========================
    const {
      start: exchangeStart,
      end,
    } = getExchangeRange();

    const startIso =
      exchangeStart.toISOString();

    const endIso =
      end.toISOString();

    // =========================
    // 自分の性格タイプを取得
    // =========================
    const {
      data: userData,
      error: userError,
    } = await supabase
      .from("users")
      .select(
        "personality_type"
      )
      .eq(
        "id",
        user.userId
      )
      .single();

    if (userError) {
      console.error(
        "ユーザー情報取得エラー:",
        userError.message
      );

      setError(
        "ユーザー情報の取得に失敗しました。"
      );

      setIsSubmitting(false);
      return;
    }

    const personalityType =
      userData.personality_type;

    // =========================
    // Submissionを作成
    // =========================
    const submissionId =
      crypto.randomUUID();

    const {
      error: insertError,
    } = await supabase
      .from("submissions")
      .insert({
        id: submissionId,
        user_id:
          user.userId,
        diary:
          diary.trim(),
        target_public_user_id:
          targetId === ""
            ? null
            : targetId,
        room_id: null,
      });

    if (insertError) {
      console.error(
        "Exchange登録エラー:",
        insertError.message
      );

      setError(
        "日記の提出に失敗しました。"
      );

      setIsSubmitting(false);
      return;
    }

    let candidate:
      Submission | null =
      null;

    // ==================================================
    // 指定あり
    // ==================================================
    if (
      targetId !== ""
    ) {
      const {
        data,
        error:
          matchingError,
      } = await supabase
        .from("submissions")
        .select(
          "id, user_id, room_id"
        )
        .eq(
          "target_public_user_id",
          user.publicUserId
        )
        .neq(
          "user_id",
          user.userId
        )
        .is(
          "room_id",
          null
        )
        .gte(
          "created_at",
          startIso
        )
        .lt(
          "created_at",
          endIso
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1);

      if (
        matchingError
      ) {
        console.error(
          "指定相手の候補検索エラー:",
          matchingError.message
        );

        setError(
          "交換相手の検索に失敗しました。"
        );

        setIsSubmitting(false);
        return;
      }

      candidate =
        data?.[0] ??
        null;
    }

    // ==================================================
    // 指定なし
    // ==================================================
    if (
      targetId === ""
    ) {
      const targetType =
        personalityType === null
          ? null
          : MATCHING_TYPE[
              personalityType
            ] ?? null;

      // =========================
      // usersから候補者を探す
      // =========================
      let usersQuery =
        supabase
          .from("users")
          .select("id");

      if (
        targetType ===
        null
      ) {
        usersQuery =
          usersQuery.is(
            "personality_type",
            null
          );
      } else {
        usersQuery =
          usersQuery.eq(
            "personality_type",
            targetType
          );
      }

      const {
        data: matchedUsers,
        error: usersError,
      } = await usersQuery;

      if (usersError) {
        console.error(
          "性格タイプのユーザー検索エラー:",
          usersError.message
        );

        setError(
          "性格タイプによる交換相手の検索に失敗しました。"
        );

        setIsSubmitting(false);
        return;
      }

      // =========================
      // 候補ユーザーのID一覧
      // =========================
      const candidateUserIds =
        matchedUsers
          ?.map(
            (matchedUser) =>
              matchedUser.id
          )
          .filter(
            (id) =>
              id !==
              user.userId
          ) ?? [];

      // =========================
      // 候補Submissionを探す
      // =========================
      if (
        candidateUserIds.length >
        0
      ) {
        const {
          data,
          error:
            submissionMatchingError,
        } = await supabase
          .from("submissions")
          .select(
            "id, user_id, room_id"
          )
          .in(
            "user_id",
            candidateUserIds
          )
          .is(
            "target_public_user_id",
            null
          )
          .is(
            "room_id",
            null
          )
          .gte(
            "created_at",
            startIso
          )
          .lt(
            "created_at",
            endIso
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          )
          .limit(1);

        if (
          submissionMatchingError
        ) {
          console.error(
            "性格タイプによるSubmission検索エラー:",
            submissionMatchingError.message
          );

          setError(
            "交換相手の検索に失敗しました。"
          );

          setIsSubmitting(false);
          return;
        }

        candidate =
          data?.[0] ??
          null;
      }
    }

    // ==================================================
    // 相手が見つからなかった
    // ==================================================
    if (
      candidate ===
      null
    ) {
      localStorage.removeItem(
        "draftDiary"
      );

      router.push("/");
      return;
    }

    // =========================
    // Room作成
    // =========================
    const roomId =
      crypto.randomUUID();

    const {
      error: roomError,
    } = await supabase
      .from("rooms")
      .insert({
        id: roomId,
        user_a_id:
          user.userId,
        user_b_id:
          candidate.user_id,
        started_at:
          startIso,
        ended_at:
          endIso,
      });

    if (roomError) {
      console.error(
        "Room作成エラー:",
        roomError.message
      );

      setError(
        "Roomの作成に失敗しました。"
      );

      setIsSubmitting(false);
      return;
    }

    // =========================
    // SubmissionにRoomを紐付け
    // =========================
    const {
      error:
        submissionUpdateError,
    } = await supabase
      .from("submissions")
      .update({
        room_id:
          roomId,
      })
      .in("id", [
        submissionId,
        candidate.id,
      ]);

    if (
      submissionUpdateError
    ) {
      console.error(
        "SubmissionへのRoom紐付けエラー:",
        submissionUpdateError.message
      );

      setError(
        "SubmissionへのRoom紐付けに失敗しました。"
      );

      setIsSubmitting(false);
      return;
    }

    console.log(
      "Room作成・Submission紐付け成功！",
      {
        roomId,
        mySubmissionId:
          submissionId,
        candidateSubmissionId:
          candidate.id,
      }
    );

    // =========================
    // 完了
    // =========================
    localStorage.removeItem(
      "draftDiary"
    );

    router.push("/");
  };

  // =========================
  // 読み込み中
  // =========================
  if (!loaded) {
    return (
      <p>読み込み中...</p>
    );
  }

  // =========================
  // 現在の提出可能時間
  // =========================
  const { start } =
    getExchangeRange();

  const submitEndAt =
    new Date(start);

  submitEndAt.setDate(
    submitEndAt.getDate() + 1
  );

  submitEndAt.setHours(
    EXCHANGE_SUBMIT_END_HOUR,
    0,
    0,
    0
  );

  const isSubmitOpen =
    new Date() <
    submitEndAt;

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
              性格タイプをもとにマッチングします。
            </p>

            <input
              id="targetPublicUserId"
              type="text"
              value={
                targetPublicUserId
              }
              onChange={(e) => {
                setTargetPublicUserId(
                  e.target.value
                );
                setError("");
              }}
              placeholder="公開IDを入力（例：ABC123）"
              disabled={
                isSubmitting ||
                !isSubmitOpen
              }
              className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 disabled:bg-gray-100"
            />

            {/* =========================
                最近あなたを指定してくれた人
                ========================= */}
            {targetUsers.length >
              0 && (
              <div className="mt-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowTargetUsers(
                      !showTargetUsers
                    );
                    setDeleteTarget(
                      null
                    );
                  }}
                  className="text-sm text-gray-500"
                  disabled={
                    isSubmitting ||
                    !isSubmitOpen
                  }
                >
                  最近あなたを指定してくれた人{" "}
                  {showTargetUsers
                    ? "⌃"
                    : "⌄"}
                </button>

                {showTargetUsers && (
                  <div className="mt-2 space-y-1">

                    {targetUsers.map(
                      (targetUser) => (
                        <button
                          key={
                            targetUser.publicUserId
                          }
                          type="button"
                          onClick={() =>
                            handleSelectTargetUser(
                              targetUser
                            )
                          }
                          disabled={
                            isSubmitting ||
                            !isSubmitOpen
                          }
                          className="flex w-full items-center rounded-lg px-2 py-2 text-left hover:bg-gray-50"
                        >
                          <span className="truncate text-sm text-gray-800">
                            {
                              targetUser.nickname
                            }
                          </span>

                          <span className="ml-2 text-xs text-gray-400">
                            {
                              targetUser.publicUserId
                            }
                          </span>
                        </button>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

            {/* =========================
                ブックマーク
                ========================= */}
            {bookmarks.length >
              0 && (
              <div className="mt-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowBookmarks(
                      !showBookmarks
                    );
                    setDeleteTarget(
                      null
                    );
                  }}
                  className="text-sm text-gray-500"
                  disabled={
                    isSubmitting ||
                    !isSubmitOpen
                  }
                >
                  ブックマーク{" "}
                  {showBookmarks
                    ? "⌃"
                    : "⌄"}
                </button>

                {showBookmarks && (
                  <div className="mt-2 space-y-1">

                    {bookmarks.map(
                      (bookmark) => (
                        <div
                          key={
                            bookmark.publicUserId
                          }
                        >

                          <div className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50">

                            <button
                              type="button"
                              onClick={() =>
                                handleSelectBookmark(
                                  bookmark
                                )
                              }
                              disabled={
                                isSubmitting ||
                                !isSubmitOpen
                              }
                              className="flex min-w-0 flex-1 items-center text-left"
                            >
                              <span className="truncate text-sm text-gray-800">
                                {
                                  bookmark.nickname
                                }
                              </span>

                              <span className="ml-2 text-xs text-gray-400">
                                {
                                  bookmark.publicUserId
                                }
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteBookmark(
                                  bookmark.publicUserId
                                )
                              }
                              disabled={
                                isSubmitting ||
                                !isSubmitOpen
                              }
                              className="ml-3 text-xs text-gray-400"
                            >
                              削除
                            </button>

                          </div>

                          {/* 削除確認 */}
                          {deleteTarget ===
                            bookmark.publicUserId && (
                            <div className="px-2 pb-2 text-xs text-gray-500">
                              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">

                                <span>
                                  ブックマークから削除しますか？
                                </span>

                                <div className="ml-3 flex shrink-0 gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteTarget(
                                        null
                                      )
                                    }
                                    className="text-gray-500"
                                  >
                                    キャンセル
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      confirmDeleteBookmark
                                    }
                                    className="font-medium text-gray-800"
                                  >
                                    OK
                                  </button>

                                </div>

                              </div>
                            </div>
                          )}

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

            {error && (
              <p className="mt-2 text-sm text-red-500">
                {error}
              </p>
            )}

          </div>

          {/* ボタン */}
          <div className="mt-6 flex gap-3">

            <button
              onClick={() =>
                router.back()
              }
              disabled={
                isSubmitting
              }
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              戻る
            </button>

            <button
              onClick={
                handleSubmit
              }
              disabled={
                diary.trim() === "" ||
                isSubmitting ||
                !isSubmitOpen
              }
              className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting
                ? "提出中..."
                : isSubmitOpen
                  ? "提出する"
                  : "提出受付終了"}
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}