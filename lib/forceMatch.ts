import { supabase } from "./supabase";

const EXCHANGE_START_HOUR = 20;

type Submission = {
  id: string;
  user_id: string;
  room_id: string | null;
  created_at: string;
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

  const { data: submissions, error: submissionError } =
    await supabase
      .from("submissions")
      .select("id, user_id, room_id, created_at")
      .is("room_id", null)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true });

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

  let matched = 0;

  for (let i = 0; i + 1 < submissions.length; i += 2) {
    const submissionA = submissions[i];
    const submissionB = submissions[i + 1];

    const { data: room, error: roomError } = await supabase
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
      throw new Error(`Room作成エラー: ${roomError.message}`);
    }

    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        room_id: room.id,
      })
      .in("id", [submissionA.id, submissionB.id]);

    if (updateError) {
      throw new Error(
        `Submission更新エラー: ${updateError.message}`
      );
    }

    matched += 2;
  }

  return {
    matched,
    remaining: submissions.length - matched,
  };
}