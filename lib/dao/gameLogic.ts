import { supabase } from "@/app/supabaseClient";
import type { Clue, SubmitAnswerResponse, TeamProgress } from "@/lib/models/types";
import { keysToCamel } from "@/lib/utils/casing";
import { revealAnswer } from "@/lib/utils/obscure";
import { teamDAO } from "./team";
import { clueDAO } from "./clue";

function revealClueRow(row: Record<string, unknown>): void {
  if (row.correct_answer != null) {
    row.correct_answer = revealAnswer(String(row.correct_answer));
  }
}

function normalizeAnswer(answer: string): string {
  return (answer || "").trim().toLowerCase();
}



export async function getNextClue(
  huntId: string,
  curClue: Clue | null
): Promise<Clue | null> {
  // Port of api/dao/clues.py:get_next_clue
  let curClueSet: { id: string; hunt_id: string; position: number } | null = null;

  if (curClue) {
    if (curClue.position != null) {
      const { data: nextInSet, error } = await supabase
        .from("clues")
        .select("*")
        .eq("clue_set_id", curClue.clueSetId)
        .eq("clue_type", "CLUE")
        .gt("position", curClue.position)
        .order("position", { ascending: true })
        .limit(1);
      if (error) throw error;
      if (nextInSet && nextInSet.length > 0) {
        const row: any = nextInSet[0];
        revealClueRow(row);
        row.has_text_answer = !!row.correct_answer;
        if (row.clue_type == null) row.clue_type = "CLUE";
        if (!("minutes" in row)) row.minutes = null;
        return keysToCamel<Clue>(row);
      }
    }

    const { data: curSetRows, error: setErr } = await supabase
      .from("clue_sets")
      .select("id, hunt_id, position")
      .eq("id", curClue.clueSetId)
      .limit(1);
    if (setErr) throw setErr;
    if (!curSetRows || curSetRows.length === 0) {
      return null;
    }
    curClueSet = curSetRows[0] as any;
  }

  let nextSetRows: any[] | null = null;
  if (curClueSet) {
    const { data, error } = await supabase
      .from("clue_sets")
      .select("id")
      .eq("hunt_id", huntId)
      .gt("position", curClueSet.position)
      .order("position", { ascending: true })
      .limit(1);
    if (error) throw error;
    nextSetRows = data;
  } else {
    const { data, error } = await supabase
      .from("clue_sets")
      .select("id")
      .eq("hunt_id", huntId)
      .order("position", { ascending: true })
      .limit(1);
    if (error) throw error;
    nextSetRows = data;
  }

  if (!nextSetRows || nextSetRows.length === 0) {
    return null;
  }

  const nextSetId = nextSetRows[0].id;
  const { data: nextClues, error: clueErr } = await supabase
    .from("clues")
    .select("*")
    .eq("clue_set_id", nextSetId)
    .eq("clue_type", "CLUE")
    .order("position", { ascending: true })
    .limit(1);
  if (clueErr) throw clueErr;
  if (!nextClues || nextClues.length === 0) return null;

  const row: any = nextClues[0];
  revealClueRow(row);
  row.has_text_answer = !!row.correct_answer;
  if (row.clue_type == null) row.clue_type = "CLUE";
  if (!("minutes" in row)) row.minutes = null;
  return keysToCamel<Clue>(row);
}

export interface SubmitAnswerPayload {
  answer: string;
  huntId: string;
  clueId: string;
  mediaUrls?: string[];
}

export async function submitAnswer(
  teamId: string,
  payload: SubmitAnswerPayload
): Promise<SubmitAnswerResponse> {
  const progressRow = await teamDAO.getTeamProgress(teamId);
  const progress = keysToCamel<TeamProgress>(progressRow);

  const currentClueId = progress.currentClueId;
  const currentClueSetId = progress.currentClueSetId;
  const roadBlockIds = new Set(
    (progress.roadBlockClueIds ?? []).map((id) => String(id))
  );

  let clue: Clue | null = null;
  let isExpressPass = false;
  let isRoadBlock = false;

  if (String(payload.clueId) === String(currentClueId)) {
    if (!currentClueId) {
      throw new Error("No active clue");
    }
    const cur = await clueDAO.getClue(currentClueId);
    if (!cur) throw new Error("Current clue not found");
    clue = cur;
    isExpressPass = clue.clueType === "EXPRESS_PASS";
    isRoadBlock = clue.clueType === "ROAD_BLOCK";
  } else {
    const other = await clueDAO.getClue(payload.clueId);
    if (!other) throw new Error("Clue not found");
    clue = other;
    if (clue.clueType === "EXPRESS_PASS") {
      isExpressPass = true;
      isRoadBlock = false;
    } else if (
      clue.clueType === "ROAD_BLOCK" &&
      roadBlockIds.has(String(clue.id))
    ) {
      isExpressPass = false;
      isRoadBlock = true;
    } else {
      throw new Error(
        "Can only submit for the current clue, an express pass, or an assigned road block"
      );
    }
    if (!currentClueSetId || String(clue.clueSetId) !== String(currentClueSetId)) {
      throw new Error("That clue is not in your current clueset");
    }
  }

  // Media requirement
  const allowsMedia = !!clue.allowsMedia;
  const hasMedia = (payload.mediaUrls ?? []).length > 0;
  if (allowsMedia && !hasMedia) {
    throw new Error("Media upload is required for this clue");
  }

  // Store answer submission
  const submission = {
    team_id: teamId,
    clue_id: payload.clueId,
    hunt_id: payload.huntId,
    answer_text: payload.answer,
    media_urls: payload.mediaUrls ?? [],
    submitted_at: new Date().toISOString(),
  };
  await supabase.from("answer_submissions").insert(submission);

  // Correctness (clue.correctAnswer is already plaintext from DAO reveal)
  const answerText = (payload.answer || "").trim();
  const correctAnswer = (clue.correctAnswer || "").trim();

  let correct = false;
  if (answerText && correctAnswer) {
    correct =
      normalizeAnswer(answerText) === normalizeAnswer(correctAnswer);
  } else if (hasMedia && allowsMedia) {
    correct = true;
  }

  if (!correct) {
    return { correct: false, huntCompleted: false, nextClue: null };
  }

  // EXPRESS_PASS or ROAD_BLOCK: add to completed_clue_ids only, do not advance current clue
  if (isExpressPass || isRoadBlock) {
    const completed = new Set(progress.completedClueIds ?? []);
    completed.add(String(clue.id));
    await teamDAO.updateTeamProgress(teamId, progress.huntId, {
      completedClueIds: Array.from(completed),
    });
    return {
      correct: true,
      huntCompleted: false,
      nextClue: progress.currentClueId
        ? await clueDAO.getClue(progress.currentClueId)
        : null,
    };
  }

  // CLUE: advance to next clue, possibly complete clueset/hunt
  const maybeNext = await getNextClue(progress.huntId, clue);
  const nextClueId = maybeNext?.id ?? null;
  const nextClueSetId = maybeNext?.clueSetId ?? null;

  let completedClueSetId: string | null = null;
  if (!nextClueSetId || String(nextClueSetId) !== String(clue.clueSetId)) {
    completedClueSetId = String(clue.clueSetId);
  }

  let blockedByRoadBlock = false;
  if (completedClueSetId && roadBlockIds.size > 0) {
    const cluesetIdStr = String(clue.clueSetId);
    const completedAfter = new Set(
      (progress.completedClueIds ?? []).map((id) => String(id))
    );
    completedAfter.add(String(clue.id));

    const { data: roadBlockRows, error } = await supabase
      .from("clues")
      .select("id, clue_set_id")
      .in("id", Array.from(roadBlockIds));
    if (error) throw error;
    for (const row of roadBlockRows ?? []) {
      if (
        String(row.clue_set_id) === cluesetIdStr &&
        !completedAfter.has(String(row.id))
      ) {
        blockedByRoadBlock = true;
        completedClueSetId = null;
        break;
      }
    }
  }

  const updatedCompletedClueIds = Array.from(
    new Set([...(progress.completedClueIds ?? []), String(clue.id)])
  );
  const updatedCompletedClueSetIds = completedClueSetId
    ? Array.from(
      new Set([...(progress.completedClueSetIds ?? []), completedClueSetId])
    )
    : progress.completedClueSetIds ?? [];

  const huntComplete = !maybeNext && !blockedByRoadBlock;

  await teamDAO.updateTeamProgress(teamId, progress.huntId, {
    completedClueIds: updatedCompletedClueIds,
    completedClueSetIds: updatedCompletedClueSetIds,
    currentClueId: nextClueId,
    currentClueSetId: nextClueSetId,
    completedAt: huntComplete
      ? new Date().toISOString()
      : progress.completedAt,
  });

  return {
    correct: true,
    huntCompleted: huntComplete,
    nextClue: maybeNext ?? null,
  };
}

