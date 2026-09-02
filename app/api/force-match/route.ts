import { forceMatch } from "@/lib/forceMatch";

export async function GET() {
  try {
    const result = await forceMatch();

    return Response.json(result);
  } catch (error) {
    console.error("強制マッチングエラー:", error);

    return Response.json(
      { error: "強制マッチングに失敗しました。" },
      { status: 500 }
    );
  }
}