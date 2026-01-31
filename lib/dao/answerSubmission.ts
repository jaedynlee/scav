import type { AnswerSubmission } from "@/lib/models/types";
import { supabase } from "@/app/supabaseClient";
import { toSnakeCase, keysToCamel } from "@/lib/utils/casing";

export interface CreateAnswerSubmissionInput {
    teamId: string;
    clueId: string;
    huntId: string;
    answerText: string;
    mediaUrls?: string[];
    isCorrect: boolean;
}

export class AnswerSubmissionDAO {
    async getByTeamId(teamId: string): Promise<AnswerSubmission[]> {
        const { data, error } = await supabase
            .from("answer_submissions")
            .select("*")
            .eq("team_id", teamId)
            .order("submitted_at", { ascending: false });
        if (error) {
            console.error("Error fetching answer submissions:", error);
            return [];
        }
        return keysToCamel<AnswerSubmission[]>(data ?? []);
    }

    async create(input: CreateAnswerSubmissionInput): Promise<void> {
        const row = toSnakeCase({
            ...input,
            submittedAt: new Date().toISOString(),
        });
        const { error } = await supabase.from("answer_submissions").insert(row);
        if (error) throw error;
    }

    async deleteByClueId(clueId: string): Promise<void> {
        const { error } = await supabase
            .from("answer_submissions")
            .delete()
            .eq("clue_id", clueId);
        if (error) throw error;
    }

    async deleteByHuntId(huntId: string): Promise<void> {
        const { error } = await supabase
            .from("answer_submissions")
            .delete()
            .eq("hunt_id", huntId);
        if (error) throw error;
    }
}

export const answerSubmissionDAO = new AnswerSubmissionDAO();
