"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { teamDAO } from "@/lib/dao/team";
import { huntDAO } from "@/lib/dao/hunt";
import { clueDAO } from "@/lib/dao/clue";
import type { AnswerSubmission, Clue, Team, Hunt, TeamProgress } from "@/lib/models/types";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import { ProgressSummary } from "@/components/team/ProgressSummary";

function TeamAnswersContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");
  const backLink = searchParams.get("backLink") || "/";

  const [team, setTeam] = useState<Team | null>(null);
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [progress, setProgress] = useState<TeamProgress | null>(null);
  const [submissions, setSubmissions] = useState<AnswerSubmission[]>([]);
  const [clues, setClues] = useState<Record<string, Clue>>({});
  const [roadBlockClues, setRoadBlockClues] = useState<Clue[]>([]);
  const [selectedRoadBlockIds, setSelectedRoadBlockIds] = useState<string[]>([]);
  const [savingRoadBlocks, setSavingRoadBlocks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [teamId]);

  async function loadData() {
    if (!teamId) {
      setLoading(false);
      return;
    }
    try {
      // Load data with individual error handling
      let loadedTeam: Team | null = null;
      let loadedHunt: Hunt | null = null;
      let loadedProgress: TeamProgress | null = null;
      let loadedSubmissions: AnswerSubmission[] = [];

      try {
        loadedTeam = await teamDAO.getTeam(teamId);
      } catch (err) {
        console.error("Failed to load team:", err);
        setError("Failed to load team information");
        setLoading(false);
        return;
      }

      if (!loadedTeam) {
        setError("Team not found");
        setLoading(false);
        return;
      }

      const huntId = loadedTeam.huntId;
      try {
        loadedHunt = await huntDAO.getHunt(huntId);
      } catch (err) {
        console.error("Failed to load hunt:", err);
        setError("Failed to load hunt information");
        setLoading(false);
        return;
      }

      try {
        loadedProgress = await teamDAO.getTeamProgress(teamId);
      } catch (err) {
        console.error("Failed to load progress:", err);
        // Progress is optional, continue without it
      }

      try {
        loadedSubmissions = await teamDAO.getTeamAnswerSubmissions(teamId);
      } catch (err) {
        console.error("Failed to load submissions:", err);
        loadedSubmissions = [];
      }

      let savedMinutes = 0;
      try {
        const adj = await clueDAO.getTimeAdjustment(teamId);
        savedMinutes = adj.totalMinutes ?? 0;
      } catch {
        /* ignore */
      }

      if (!loadedTeam) {
        setError("Team not found");
        setLoading(false);
        return;
      }

      if (!loadedHunt) {
        setError("Hunt not found");
        setLoading(false);
        return;
      }

      setTeam(loadedTeam);
      setHunt(loadedHunt);
      setProgress(loadedProgress);
      setSubmissions(Array.isArray(loadedSubmissions) ? loadedSubmissions : []);
      setSelectedRoadBlockIds(loadedProgress?.roadBlockClueIds ?? []);

      // Load ROAD_BLOCK clues for the hunt (for assignment UI)
      try {
        const clueSets = await clueDAO.getClueSetsByHunt(huntId);
        const allClues: Clue[] = [];
        for (const cs of clueSets) {
          const list = await clueDAO.getCluesByClueSet(cs.id);
          allClues.push(...list.filter((c) => (c.clueType ?? "CLUE") === "ROAD_BLOCK"));
        }
        setRoadBlockClues(allClues);
      } catch {
        setRoadBlockClues([]);
      }

      // Load clue information for each submission
      if (Array.isArray(loadedSubmissions) && loadedSubmissions.length > 0) {
        const clueIds = [...new Set(loadedSubmissions.map((s) => s.clueId))];
        const cluePromises = clueIds.map(async (clueId) => {
          try {
            const clue = await clueDAO.getClue(clueId);
            return { clueId, clue };
          } catch (err) {
            console.error(`Failed to load clue ${clueId}:`, err);
            return null;
          }
        });

        const clueResults = await Promise.all(cluePromises);
        const cluesMap: Record<string, Clue> = {};
        clueResults.forEach((result) => {
          if (result && result.clue) {
            cluesMap[result.clueId] = result.clue;
          }
        });
        setClues(cluesMap);
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Failed to load data";
      setError(`Failed to load data: ${errorMessage}`);
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }

  function getMediaType(url: string): "image" | "video" {
    if (url.startsWith("data:image/")) return "image";
    if (url.startsWith("data:video/")) return "video";
    return "image";
  }

  if (!teamId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Team ID is required</p>
        <Link href="/">
          <Button>Back to Home</Button>
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

  if (error || !team || !hunt) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Failed to load data"}</p>
        <Link href={backLink}>
          <Button>Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-100 to-rose-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <Link href={backLink} className="text-gray-600 hover:text-gray-800 mb-2 inline-block">
            ← Back to Hunt
          </Link>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
              {team.name} - Answers
            </h1>
            <p className="text-gray-600 mt-1 font-bold">{hunt.name}</p>
          </div>
        </div>

        {progress && (
          <Card className="border-2 border-violet-200">
            <ProgressSummary progress={progress} />
          </Card>
        )}

        {submissions.length === 0 ? (
          <Card>
            <p className="text-gray-600 text-center py-8">
              No answer submissions yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900">
                Submissions ({submissions.length})
              </h2>
            </Card>

            {submissions.map((submission) => {
              const clue = clues[submission.clueId];
              const isCorrect = progress?.completedClueIds.includes(submission.clueId) || false;

              return (
                <Card key={submission.id} className="border-2 border-violet-200">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                          {isCorrect ? (
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full ml-auto">
                              ✓
                            </span>
                          ) : (
                            <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full ml-auto">
                              ✗
                            </span>
                          )}
                        </div>
                        {clue && (
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-gray-600 mb-1">
                              Clue:
                            </p>
                            <p className="text-base font-medium text-gray-900">
                              {clue.prompt ||
                                (clue.position != null ? `Clue #${clue.position + 1}` : "Clue")}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">
                            Answer:
                          </p>
                          <p className="text-base text-gray-900">
                            {submission.answerText || (
                              <span className="text-gray-500 italic">
                                (no text answer)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {submission.mediaUrls.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Media ({submission.mediaUrls.length}):
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {submission.mediaUrls.map((url, index) => {
                            const mediaType = getMediaType(url);
                            return (
                              <div key={index} className="relative">
                                {mediaType === "image" ? (
                                  <img
                                    src={url}
                                    alt={`Submission media ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                  />
                                ) : (
                                  <video
                                    src={url}
                                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                    controls
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamAnswersPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <TeamAnswersContent />
    </Suspense>
  );
}
