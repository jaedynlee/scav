import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import { useState } from "react";
import Input from "@/components/shared/Input";
import { teamService } from "@/lib/services/teams";

type Props = {
    huntId: string;
    callback: () => Promise<void>;
}

export function CreateNewTeamCard({ huntId, callback }: Props) {
    const [creating, setCreating] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [error, setError] = useState("");

    async function handleCreateTeam(e: React.FormEvent) {
        e.preventDefault();
        if (!teamName.trim()) {
            setError("Team name is required");
            return;
        }

        setCreating(true);
        setError("");

        try {
            await teamService.createTeam({ huntId, teamName: teamName.trim() });
            setTeamName("");
            await callback();
        } catch (err) {
            setError("Failed to create team");
            console.error(err);
        } finally {
            setCreating(false);
        }
    }


    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
                <Input
                    label="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    disabled={creating}
                    required
                />
                <Button type="submit" disabled={creating} fullWidth>
                    {creating ? "Creating..." : "Create Team"}
                </Button>
            </form>
        </Card>
    )
}
