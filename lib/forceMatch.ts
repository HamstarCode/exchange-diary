import { supabase } from "./supabase";

const EXCHANGE_START_HOUR = 20;

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
  created_at: string;
};

type User = {
  id: string;
  personality_type: string | null;
};

const getExchangeRange = () => {
  const now = new Date();

  const start = new Date(now);

  if (now.getHours() < EXCHANGE_START_HOUR) {
    start.setDate(start.getDate() - 1);
  }

  start.setHours(EXCHANGE_START_HOUR, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export async function forceMatch() {
  const { start, end } = getExchangeRange();

  // =========================
  // 未マッチのSubmissionを取得
  // =========================
  const {
    data: submissions,
    error: submissionError,
  } = await supabase
    .from("submissions")
    .select("id, user_id, room_id, created_at")
    .is("room_id", null)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", {
      ascending: true,
    });

  if (submissionError) {
    throw new Error(
      `Submission取得エラー: ${submissionError.message}`
    );
  }

  if (!submissions || submissions.length < 2) {
    return {
      matched: 0,
      remaining: submissions?.length ?? 0,
    };
  }

  // =========================
  // ユーザーの性格タイプを取得
  // =========================
  const userIds = [
    ...new Set(
      submissions.map(
        (submission) => submission.user_id
      )
    ),
  ];

  const {
    data: users,
    error: userError,
  } = await supabase
    .from("users")
    .select("id, personality_type")
    .in("id", userIds);

  if (userError) {
    throw new Error(
      `ユーザー取得エラー: ${userError.message}`
    );
  }

  const userMap = new Map<string, User>();

  users?.forEach((user) => {
    userMap.set(user.id, user);
  });

  // 未マッチのSubmission
  const remainingSubmissions = [...submissions];

  let matched = 0;

  // =========================
  // Room作成処理
  // =========================
  const createRoom = async (
    submissionA: Submission,
    submissionB: Submission
  ) => {
    const {
      data: room,
      error: roomError,
    } = await supabase
      .from("rooms")
      .insert({
        user_a_id: submissionA.user_id,
        user_b_id: submissionB.user_id,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
      })
      .select("id")
      .single();

    if (roomError) {
      throw new Error(
        `Room作成エラー: ${roomError.message}`
      );
    }

    const {
      error: updateError,
    } = await supabase
      .from("submissions")
      .update({
        room_id: room.id,
      })
      .in("id", [
        submissionA.id,
        submissionB.id,
      ]);

    if (updateError) {
      throw new Error(
        `Submission更新エラー: ${updateError.message}`
      );
    }

    matched += 2;
  };

  // =========================
  // ① 性格タイプでマッチング
  // =========================
  let matchedByType = true;

  while (
    matchedByType &&
    remainingSubmissions.length >= 2
  ) {
    matchedByType = false;

    for (
      let i = 0;
      i < remainingSubmissions.length;
      i++
    ) {
      const submissionA =
        remainingSubmissions[i];

      const userA = userMap.get(
        submissionA.user_id
      );

      if (
        !userA ||
        userA.personality_type === null
      ) {
        continue;
      }

      const targetType =
        MATCHING_TYPE[
          userA.personality_type
        ];

      if (!targetType) {
        continue;
      }

      const candidateIndex =
        remainingSubmissions.findIndex(
          (submissionB, index) => {
            if (index === i) {
              return false;
            }

            const userB = userMap.get(
              submissionB.user_id
            );

            return (
              userB?.personality_type ===
              targetType
            );
          }
        );

      if (candidateIndex === -1) {
        continue;
      }

      const submissionB =
        remainingSubmissions[
          candidateIndex
        ];

      await createRoom(
        submissionA,
        submissionB
      );

      // 後ろから削除
      const indexes = [
        i,
        candidateIndex,
      ].sort((a, b) => b - a);

      for (const index of indexes) {
        remainingSubmissions.splice(
          index,
          1
        );
      }

      matchedByType = true;
      break;
    }
  }

  // =========================
  // ② 残った人を強制マッチング
  // =========================
  for (
    let i = 0;
    i + 1 < remainingSubmissions.length;
    i += 2
  ) {
    const submissionA =
      remainingSubmissions[i];

    const submissionB =
      remainingSubmissions[i + 1];

    await createRoom(
      submissionA,
      submissionB
    );
  }

  return {
    matched,
    remaining:
      remainingSubmissions.length % 2,
  };
}