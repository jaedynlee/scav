"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { teamDAO } from "@/lib/dao/team";
import type { Team, TeamProgress, Hunt, ClueSet } from "@/lib/models/types";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import Link from "next/link";
import { CodeField } from "./components/CodeField";
import AnswerSubmissions from "@/components/admin/AnswerSubmissions";
import { ProgressSummary } from "@/components/team/ProgressSummary";
import ToggleButton from "@/components/shared/ToggleButton";
import { CreateNewTeamCard } from "./components/CreateNewTeamCard";
import { huntDAO } from "@/lib/dao/hunt";
import { clueDAO } from "@/lib/dao/clue";

interface TeamWithProgress extends Team {
  progress: TeamProgress | null;
  currentClueSet: ClueSet | null;
  timeSavedMinutes?: number;
}

function TeamManagementContent() {
  const searchParams = useSearchParams();
  const huntId = searchParams.get("huntId");

  const [showJoinCode, setShowJoinCode] = useState(false);
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [teams, setTeams] = useState<TeamWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (huntId) loadData();
    else setLoading(false);
  }, [huntId]);

  async function loadData() {
    if (!huntId) return;
    try {
      const loadedHunt = await huntDAO.getHunt(huntId);
      if (!loadedHunt) {
        setError("Hunt not found");
        return;
      }
      setHunt(loadedHunt);
      await loadTeams();
    } catch (err) {
      setError("Failed to load hunt");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeams() {
    if (!huntId) return;
    try {
      const teamsWithProgress = await teamDAO.getTeamsWithProgress(huntId);

      // Load clueset and time adjustment for each team
      const teamsWithClueSets = await Promise.all(
        teamsWithProgress.map(async (team) => {
          let currentClueSet: ClueSet | null = null;
          if (team.progress?.currentClueSetId) {
            try {
              currentClueSet = await clueDAO.getClueSet(team.progress.currentClueSetId);
            } catch (err) {
              console.error("Failed to load clueset:", err);
            }
          }
          let timeSavedMinutes = 0;
          if (team.progress?.completedAt) {
            try {
              const adj = await clueDAO.getTimeAdjustment(team.id);
              timeSavedMinutes = adj.totalMinutes ?? 0;
            } catch {
              /**/
            }
          }
          return { ...team, currentClueSet, timeSavedMinutes };
        })
      );

      setTeams(teamsWithClueSets);
    } catch (err) {
      console.error("Failed to load teams:", err);
    }
  }

  if (!huntId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Hunt ID is required</p>
        <Link href="/admin/hunts">
          <Button>Back to Hunts</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Hunt not found"}</p>
        <Link href="/admin/hunts">
          <Button>Back to Hunts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Link href={`/admin/hunts/edit?id=${huntId}`}>
          <button className="text-gray-600">
            ← Back to Hunt
          </button>
        </Link>
        <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
          {hunt.name}
        </h1>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Teams ({teams.length})</h2>
          <ToggleButton variant="secondary" pressed={showJoinCode} onToggle={setShowJoinCode}>
            {showJoinCode ? "Hide Codes" : "Show Codes"}
          </ToggleButton>
        </div>


        <div className="space-y-4">
          {teams.map((team) => {
            const progress = team.progress;

            return (
              <Card key={team.id} className="border-2 border-violet-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-l font-bold text-gray-900">{team.name}</h3>
                      {showJoinCode && <CodeField code={team.joinCode} />}
                    </div>
                  </div>

                  {progress ? (
                    <div className="space-y-3">
                      <div>
                        <ProgressSummary progress={progress} />

                        {team.currentClueSet && (
                          <div className="flex flex-col gap-1 py-1 text-sm font-medium">
                            <div>
                              <span className="text-gray-600">Current clueset:</span>
                              <span className="ml-1 text-gray-900">
                                {team.currentClueSet.name || (progress.currentClueSetId ? "Loading..." : "None")}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="pt-3 mt-3 border-t border-gray-200">
                          <AnswerSubmissions teamId={team.id} huntId={huntId} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No progress data available</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {hunt.status !== "completed" && <CreateNewTeamCard huntId={huntId} callback={loadTeams} />}

    </div>
  );
}

export default function TeamManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <TeamManagementContent />
    </Suspense>
  );
}
