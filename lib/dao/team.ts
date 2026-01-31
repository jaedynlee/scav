import type {
  Team,
  TeamProgress,
} from "@/lib/models/types";
import { supabase } from "@/app/supabaseClient";
import { toSnakeCase, keysToCamel } from "@/lib/utils/casing";

export class TeamDAO {
  async createTeam({ huntId, name }: { huntId: string, name: string }): Promise<Team> {
    // Mirror admin create_team: ensure hunt exists, then insert team with unique join_code
    const { data: hunt, error: huntErr } = await supabase
      .from("hunts")
      .select("id")
      .eq("id", huntId)
      .single();
    if (huntErr || !hunt) throw new Error("Hunt not found");

    // Generate simple join code (reuse backend-generated codes if any)
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("teams")
      .insert(
        toSnakeCase({
          name,
          huntId,
          joinCode,
        })
      )
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<Team>(data);
  }

  async getTeamByJoinCode(joinCode: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("join_code", joinCode)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return keysToCamel<Team>(data);
  }

  async joinHunt(joinCode: string): Promise<Team> {
    const team = await this.getTeamByJoinCode(joinCode);
    if (!team) {
      throw new Error("Team not found");
    }

    const teamProgress = await this.getTeamProgress(team.id);
    if (!teamProgress?.startedAt) {
      await this.updateTeamProgress(team.id, team.huntId, { startedAt: new Date().toISOString() });
    }

    return team;
  }

  async getTeam(id: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return keysToCamel<Team>(data);
  }

  async getTeamsByHunt(huntId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("hunt_id", huntId);
    if (error) throw error;
    return keysToCamel<Team[]>(data ?? []);
  }

  async getTeamsWithProgress(huntId: string): Promise<Array<Team & { progress: TeamProgress | null }>> {
    const { data: teams, error } = await supabase
      .from("teams")
      .select("*")
      .eq("hunt_id", huntId);
    if (error) throw error;
    const camelTeams = keysToCamel<Team[]>(teams ?? []);

    const results: Array<Team & { progress: TeamProgress | null }> = [];
    for (const team of camelTeams) {
      const progress = await this.getTeamProgress(team.id);
      results.push({ ...team, progress });
    }
    return results;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase
      .from("teams")
      .update(toSnakeCase(updates))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<Team>(data);
  }

  async deleteTeam(id: string): Promise<void> {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) throw error;
  }
  async getTeamProgress(
    teamId: string,
  ): Promise<TeamProgress | null> {
    const { data, error } = await supabase
      .from("team_progress")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const raw = data as any;

    // Normalize lists
    raw.completed_clue_ids = raw.completed_clue_ids ?? [];
    raw.completed_clue_set_ids = raw.completed_clue_set_ids ?? [];
    raw.road_block_clue_ids = raw.road_block_clue_ids ?? [];

    let totalClueCount = 0;
    let completedRequiredClueCount = 0;

    // Compute totalClueCount
    const { data: clueSets } = await supabase
      .from("clue_sets")
      .select("id")
      .eq("hunt_id", raw.hunt_id);
    const clueSetIds = (clueSets ?? []).map((cs: any) => cs.id);
    if (clueSetIds.length > 0) {
      const { data: clues } = await supabase
        .from("clues")
        .select("id, clue_type, position")
        .in("clue_set_id", clueSetIds);
      totalClueCount = (clues ?? []).filter(
        (c: any) => c.clue_type === "CLUE" || c.position != null
      ).length;
    }

    // Compute completedRequiredClueCount
    const completedIds = raw.completed_clue_ids ?? [];
    if (completedIds.length > 0) {
      const { data: completedClues } = await supabase
        .from("clues")
        .select("id, clue_type, position")
        .in(
          "id",
          completedIds.map((id: any) => id)
        );
      completedRequiredClueCount = (completedClues ?? []).filter(
        (c: any) => c.clue_type === "CLUE" || c.position != null
      ).length;
    }

    raw.total_clue_count = totalClueCount;
    raw.completed_required_clue_count = completedRequiredClueCount;

    return keysToCamel<TeamProgress>(raw);
  }

  async createTeamProgress(
    { huntId, teamId, currentClueId, currentClueSetId }: { huntId: string, teamId: string, currentClueId: string | null, currentClueSetId: string | null }
  ): Promise<TeamProgress> {
    const { data, error } = await supabase
      .from("team_progress")
      .upsert({ hunt_id: huntId, team_id: teamId, current_clue_id: currentClueId, current_clue_set_id: currentClueSetId })
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<TeamProgress>(data);
  }

  async updateTeamProgress(
    teamId: string,
    huntId: string,
    updates: Partial<TeamProgress>
  ): Promise<TeamProgress> {
    const payload = { ...updates, teamId, huntId };
    const snake = toSnakeCase(payload);
    const { data, error } = await supabase
      .from("team_progress")
      .upsert(snake)
      .select("*")
      .single();
    if (error) throw error;
    return keysToCamel<TeamProgress>(data);
  }
}

export const teamDAO = new TeamDAO();
