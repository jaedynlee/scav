import { teamDAO } from "@/lib/dao/team";
import { Team } from "@/lib/models/types";

class TeamService {
    async createTeam({ huntId, teamName }: { huntId: string, teamName: string }): Promise<Team> {
        const team = await teamDAO.createTeam({ huntId, name: teamName });
        await teamDAO.createTeamProgress({ teamId: team.id, huntId });
        return team;
    }
}

export const teamService = new TeamService();