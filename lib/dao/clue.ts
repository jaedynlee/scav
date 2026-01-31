import type {
  ClueSet,
  Clue,
} from "@/lib/models/types";
import { supabase } from "@/app/supabaseClient";
import { toSnakeCase, keysToCamel } from "@/lib/utils/casing";
import { obscureAnswer, revealAnswer } from "@/lib/utils/obscure";
import { teamDAO } from "./team";

export class ClueDAO {
  async createClueSet(clueSet: Omit<ClueSet, "id" | "position">): Promise<ClueSet> {
    // Avoid unique constraint on (hunt_id, position): use next available position
    const huntId = clueSet.huntId;
    const { data: existing } = await supabase
      .from("clue_sets")
      .select("position")
      .eq("hunt_id", huntId)
      .order("position", { ascending: false })
      .limit(1);
    const maxPosition = existing?.length ? (existing[0]?.position ?? -1) : -1;
    const nextPosition = maxPosition + 1;

    const payload = toSnakeCase({ ...clueSet, position: nextPosition });
    const { data, error } = await supabase
      .from("clue_sets")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<ClueSet>(data);
  }

  async getClueSet(id: string): Promise<ClueSet | null> {
    const { data, error } = await supabase
      .from("clue_sets")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return keysToCamel<ClueSet>(data);
  }

  async getClueSetsByHunt(huntId: string): Promise<ClueSet[]> {
    const { data, error } = await supabase
      .from("clue_sets")
      .select("*")
      .eq("hunt_id", huntId)
      .order("position", { ascending: true });
    if (error) throw error;
    return keysToCamel<ClueSet[]>(data ?? []);
  }

  async updateClueSet(id: string, updates: Partial<ClueSet>): Promise<ClueSet> {
    const { data, error } = await supabase
      .from("clue_sets")
      .update(toSnakeCase(updates))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<ClueSet>(data);
  }

  async deleteClueSet(id: string): Promise<void> {
    const { error } = await supabase.from("clue_sets").delete().eq("id", id);
    if (error) throw error;
  }

  async createClue(clue: Omit<Clue, "id" | "position" | "hasTextAnswer">): Promise<Clue> {
    const clues = await this.getCluesByClueSet(clue.clueSetId);
    const orderedClues = clues.filter((c) => c.position != null);
    const lastPosition = orderedClues.length > 0 ? orderedClues[orderedClues.length - 1].position ?? 0 : 0;
    const correctAnswer = clue.correctAnswer ? obscureAnswer(clue.correctAnswer) : undefined;
    const { data, error } = await supabase
      .from("clues")
      .insert(toSnakeCase({ ...clue, correctAnswer, position: lastPosition + 1 }))
      .select("*")
      .single();
    if (error) throw error;
    const row = data as any;
    if (row.correct_answer != null) row.correct_answer = revealAnswer(row.correct_answer);
    row.has_text_answer = !!row.correct_answer;
    if (row.clue_type == null) row.clue_type = "CLUE";
    if (!("minutes" in row)) row.minutes = null;
    return keysToCamel<Clue>(row);
  }

  async getClue(id: string): Promise<Clue | null> {
    const { data, error } = await supabase
      .from("clues")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    const row = data as any;
    if (row.correct_answer != null) row.correct_answer = revealAnswer(row.correct_answer);
    row.has_text_answer = !!row.correct_answer;
    if (row.clue_type == null) row.clue_type = "CLUE";
    if (!("minutes" in row)) row.minutes = null;
    return keysToCamel<Clue>(row);
  }

  async getCluesByClueSet(clueSetId: string): Promise<Clue[]> {
    const { data, error } = await supabase
      .from("clues")
      .select("*")
      .eq("clue_set_id", clueSetId)
      .order("position", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []).map((row: any) => {
      if (row.correct_answer != null) row.correct_answer = revealAnswer(row.correct_answer);
      row.has_text_answer = !!row.correct_answer;
      if (row.clue_type == null) row.clue_type = "CLUE";
      if (!("minutes" in row)) row.minutes = null;
      return row;
    });
    return keysToCamel<Clue[]>(rows);
  }

  async getExpressPasses(clueSetId: string): Promise<Clue[]> {
    const { data, error } = await supabase
      .from("clues")
      .select("*")
      .eq("clue_set_id", clueSetId)
      .or("clue_type.eq.EXPRESS_PASS,position.is.null");
    if (error) throw error;
    const rows = (data ?? []).map((row: any) => {
      if (row.correct_answer != null) row.correct_answer = revealAnswer(row.correct_answer);
      row.has_text_answer = !!row.correct_answer;
      if (row.clue_type == null) row.clue_type = "EXPRESS_PASS";
      if (!("minutes" in row)) row.minutes = null;
      return row;
    });
    return keysToCamel<Clue[]>(rows);
  }

  async getAvailableExpressPasses(teamId: string): Promise<Clue[]> {
    // Mirror logic in api/main.py:get_available_express_passes
    const progress = await teamDAO.getTeamProgress(teamId);
    const cluesetId = progress?.currentClueSetId;
    const completedIds = new Set(progress?.completedClueIds ?? []);
    if (!cluesetId) return [];

    const { data, error } = await supabase
      .from("clues")
      .select("*")
      .eq("clue_set_id", cluesetId);
    if (error) throw error;
    const rows = (data ?? []).filter((row: any) => {
      const type = row.clue_type;
      const isExpress =
        type === "EXPRESS_PASS" || (type == null && row.position == null);
      return (
        isExpress &&
        !completedIds.has(String(row.id)) &&
        !completedIds.has(row.id)
      );
    });
    rows.forEach((row: any) => {
      if (row.correct_answer != null) row.correct_answer = revealAnswer(row.correct_answer);
      row.has_text_answer = !!row.correct_answer;
      if (row.clue_type == null) row.clue_type = "EXPRESS_PASS";
      if (!("minutes" in row)) row.minutes = null;
    });
    return keysToCamel<Clue[]>(rows);
  }

  async getAvailableRoadBlocks(teamId: string): Promise<Clue[]> {
    // Mirror logic in api/main.py:get_available_road_blocks
    const progress = await teamDAO.getTeamProgress(teamId);
    const cluesetId = progress?.currentClueSetId;
    const completedIds = new Set(progress?.completedClueIds ?? []);
    if (!cluesetId) return [];

    const { data, error } = await supabase
      .from("clues")
      .select("*")
      .eq("clue_set_id", cluesetId)
      .eq("clue_type", "ROAD_BLOCK");
    if (error) throw error;
    const rows = (data ?? []).filter(
      (row: any) =>
        !completedIds.has(String(row.id)) && !completedIds.has(row.id)
    );
    rows.forEach((row: any) => {
      if (row.correct_answer != null) row.correct_answer = revealAnswer(row.correct_answer);
      row.has_text_answer = !!row.correct_answer;
      if (!("minutes" in row)) row.minutes = null;
    });
    return keysToCamel<Clue[]>(rows);
  }

  async getTimeAdjustment(teamId: string): Promise<{ totalMinutes: number }> {
    const progress = await teamDAO.getTeamProgress(teamId);
    const completedIds = progress?.completedClueIds ?? [];
    if (!completedIds.length) return { totalMinutes: 0 };

    const { data, error } = await supabase
      .from("clues")
      .select("id, clue_type, minutes")
      .in(
        "id",
        completedIds.map((id) => id)
      );
    if (error) throw error;
    let total = 0;
    for (const row of data ?? []) {
      if (row.clue_type === "EXPRESS_PASS" && row.minutes != null) {
        total += Number(row.minutes);
      }
    }
    return { totalMinutes: total };
  }

  async updateClue(id: string, updates: Partial<Clue>): Promise<Clue> {
    const payload = { ...updates };
    if (payload.correctAnswer !== undefined) {
      payload.correctAnswer = payload.correctAnswer ? obscureAnswer(payload.correctAnswer) : undefined;
    }
    const { data, error } = await supabase
      .from("clues")
      .update(toSnakeCase(payload))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    const row = data as any;
    if (row.correct_answer != null) row.correct_answer = revealAnswer(row.correct_answer);
    row.has_text_answer = !!row.correct_answer;
    return keysToCamel<Clue>(row);
  }

  async deleteClue(id: string): Promise<void> {
    // Mirror admin delete: remove from clue_sets.clue_ids then delete clue + submissions
    // Delete answer submissions for this clue
    await supabase.from("answer_submissions").delete().eq("clue_id", id);

    // Remove from its clue set's clue_ids array
    const { data: clueRow, error: clueErr } = await supabase
      .from("clues")
      .select("clue_set_id")
      .eq("id", id)
      .single();
    if (clueErr) throw clueErr;
    const clueSetId = clueRow?.clue_set_id;
    if (clueSetId) {
      const { data: cs, error: csErr } = await supabase
        .from("clue_sets")
        .select("clue_ids")
        .eq("id", clueSetId)
        .single();
      if (!csErr && cs?.clue_ids) {
        const updated = (cs.clue_ids as string[]).filter(
          (cid) => String(cid) !== String(id)
        );
        await supabase
          .from("clue_sets")
          .update({ clue_ids: updated })
          .eq("id", clueSetId);
      }
    }

    const { error } = await supabase.from("clues").delete().eq("id", id);
    if (error) throw error;
  }
}

export const clueDAO = new ClueDAO();