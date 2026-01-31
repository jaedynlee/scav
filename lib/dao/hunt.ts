import type {
  Hunt,
} from "@/lib/models/types";
import { supabase } from "@/app/supabaseClient";
import { toSnakeCase, keysToCamel } from "@/lib/utils/casing";
import { answerSubmissionDAO } from "./answerSubmission";

export class HuntDAO {
  async createHunt({ name, description }: { name: string, description?: string }): Promise<Hunt> {
    const { data, error } = await supabase
      .from("hunts")
      .insert(toSnakeCase({ name, description, status: "draft" }))
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<Hunt>(data);
  }

  async getHunt(id: string): Promise<Hunt | null> {
    const { data, error } = await supabase
      .from("hunts")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return keysToCamel<Hunt>(data);
  }

  async getAllHunts(): Promise<Hunt[]> {
    const { data, error } = await supabase.from("hunts").select("*");
    if (error) throw error;
    return keysToCamel<Hunt[]>(data ?? []);
  }

  async updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt> {
    const { data, error } = await supabase
      .from("hunts")
      .update(toSnakeCase(updates))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<Hunt>(data);
  }

  async deleteHunt(id: string): Promise<void> {
    // Delete dependents first (FKs reference hunts)
    await answerSubmissionDAO.deleteByHuntId(id);

    const { data: teams } = await supabase.from("teams").select("id").eq("hunt_id", id);
    for (const t of teams ?? []) {
      const { error: progressErr } = await supabase
        .from("team_progress")
        .delete()
        .eq("team_id", t.id);
      if (progressErr) throw progressErr;
    }

    const { error: teamsErr } = await supabase.from("teams").delete().eq("hunt_id", id);
    if (teamsErr) throw teamsErr;

    const { data: clueSets } = await supabase.from("clue_sets").select("id").eq("hunt_id", id);
    for (const cs of clueSets ?? []) {
      const { error: cluesErr } = await supabase.from("clues").delete().eq("clue_set_id", cs.id);
      if (cluesErr) throw cluesErr;
    }

    const { error: setsErr } = await supabase.from("clue_sets").delete().eq("hunt_id", id);
    if (setsErr) throw setsErr;

    const { error } = await supabase.from("hunts").delete().eq("id", id);
    if (error) throw error;
  }
}

export const huntDAO = new HuntDAO();
