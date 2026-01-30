import { teamDAO } from "@/lib/dao/team";
import { Team } from "@/lib/models/types";
import { getNextClue } from "../dao/gameLogic";

class TeamService {
    async createTeam({ huntId, teamName }: { huntId: string, teamName: string }): Promise<Team> {
        const team = await teamDAO.createTeam({ huntId, name: teamName });
        const firstClue = await getNextClue(huntId, null);
        await teamDAO.createTeamProgress({ teamId: team.id, huntId, currentClueId: firstClue?.id ?? null, currentClueSetId: firstClue?.clueSetId ?? null });
        return team;
    }
}

export const teamService = new TeamService();