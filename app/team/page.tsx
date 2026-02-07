"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitAnswer as submitGameAnswer } from "@/lib/dao/gameLogic";
import type { Hunt, Clue, Team, TeamProgress, ClueSet } from "@/lib/models/types";
import ClueDisplay from "@/components/team/ClueDisplay";
import AnswerInput from "@/components/team/AnswerInput";
import ProgressIndicator from "@/components/team/ProgressIndicator";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Link from "next/link";
import { RoadBlockBadge, RoadBlockCard } from "@/components/clue/RoadBlockCard";
import { ExpressPassCard } from "@/components/clue/ExpressPassCard";
import { teamDAO } from "@/lib/dao/team";
import { huntDAO } from "@/lib/dao/hunt";
import { clueDAO } from "@/lib/dao/clue";

function TeamHuntContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [progress, setProgress] = useState<TeamProgress | null>(null);
  const [currentClue, setCurrentClue] = useState<Clue | null>(null);
  const [currentClueSet, setCurrentClueSet] = useState<ClueSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastAnswerError, setLastAnswerError] = useState("");
  const [viewingExpressPass, setViewingExpressPass] = useState<Clue | null>(null);
  const [viewingRoadBlock, setViewingRoadBlock] = useState<Clue | null>(null);
  const [availableExpressPasses, setAvailableExpressPasses] = useState<Clue[]>([]);
  const [availableRoadBlocks, setAvailableRoadBlocks] = useState<Clue[]>([]);
  const [isRoadBlockGateMode, setIsRoadBlockGateMode] = useState(false);
  const [timeSavedMinutes, setTimeSavedMinutes] = useState<number>(0);

  useEffect(() => {
    if (!teamId) {
      router.push("/");
      return;
    }
    loadHunt();
  }, [teamId]);

  // Road-block-gate: when all required clues in current set are done but road blocks remain, default to road-block view
  useEffect(() => {
    if (!progress || !currentClueSet || availableRoadBlocks.length === 0) {
      setIsRoadBlockGateMode(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const clues = await clueDAO.getCluesByClueSet(currentClueSet!.id);
      const required = clues.filter((c) => c.position != null);
      const completed = new Set(progress.completedClueIds ?? []);
      const allDone = required.length > 0 && required.every((c) => completed.has(c.id));
      if (cancelled) return;
      if (allDone && availableRoadBlocks.length > 0) {
        setIsRoadBlockGateMode(true);
        setViewingRoadBlock((prev) => (prev && availableRoadBlocks.some((c) => c.id === prev.id)) ? prev : availableRoadBlocks[0]);
      } else {
        setIsRoadBlockGateMode(false);
        if (!allDone) setViewingRoadBlock(null);
      }
    })();
    return () => { cancelled = true; };
  }, [progress?.completedClueIds, currentClueSet?.id, availableRoadBlocks]);

  async function loadHunt() {
    if (!teamId) return;

    try {
      const loadedTeam = await teamDAO.getTeam(teamId);
      if (!loadedTeam) {
        setError("Team not found");
        return;
      }
      setTeam(loadedTeam);

      const huntId = loadedTeam.huntId;
      const loadedHunt = await huntDAO.getHunt(huntId);
      if (!loadedHunt) {
        setError("Hunt not found");
        return;
      }

      if (loadedHunt.status !== "active") {
        setError("This hunt is not currently active");
        return;
      }

      setHunt(loadedHunt);

      let loadedProgress = await teamDAO.getTeamProgress(teamId);
      setProgress(loadedProgress);

      if (loadedProgress && teamId) {
        try {
          const [passes, blocks] = await Promise.all([
            clueDAO.getAvailableExpressPasses(teamId),
            clueDAO.getAvailableRoadBlocks(teamId),
          ]);
          setAvailableExpressPasses(passes);
          setAvailableRoadBlocks(blocks);
          const adj = await clueDAO.getTimeAdjustment(teamId);
          setTimeSavedMinutes(adj.totalMinutes ?? 0);
        } catch {
          setAvailableExpressPasses([]);
          setAvailableRoadBlocks([]);
          setTimeSavedMinutes(0);
        }
      }

      if (loadedProgress?.currentClueId) {
        try {
          const clue = await clueDAO.getClue(loadedProgress.currentClueId);
          setCurrentClue(clue);

          if (clue?.clueSetId) {
            const clueSet = await clueDAO.getClueSet(clue.clueSetId);
            setCurrentClueSet(clueSet);
          }
        } catch (err) {
          setError("Failed to load current clue");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      setError("Failed to load hunt");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswerSubmit(answer: string, mediaUrls?: string[]) {
    setLastAnswerError("");

    const clueToSubmit = viewingRoadBlock ?? viewingExpressPass ?? currentClue;
    if (!clueToSubmit || !team || !progress) return;

    setSubmitting(true);

    try {
      const response = await submitGameAnswer(team.id, {
        answer,
        huntId: team.huntId,
        clueId: clueToSubmit.id,
        mediaUrls: mediaUrls || []
      });

      if (!response.correct) {
        setLastAnswerError("That's incorrect. Try again!");
        setSubmitting(false);
        return;
      }

      const updatedProgress = await teamDAO.getTeamProgress(team.id);
      if (updatedProgress) {
        setProgress(updatedProgress);
      }

      if (viewingRoadBlock) {
        setViewingRoadBlock(null);
        const blocks = await clueDAO.getAvailableRoadBlocks(team.id);
        setAvailableRoadBlocks(blocks);
        const updated = await teamDAO.getTeamProgress(team.id);
        if (updated) setProgress(updated);
        setSubmitting(false);
        return;
      }
      if (viewingExpressPass) {
        setViewingExpressPass(null);
        const passes = await clueDAO.getAvailableExpressPasses(team.id);
        setAvailableExpressPasses(passes);
        const adj = await clueDAO.getTimeAdjustment(team.id);
        setTimeSavedMinutes(adj.totalMinutes ?? 0);
        setSubmitting(false);
        return;
      }

      if (response.huntCompleted) {
        setCurrentClue(null);
        setCurrentClueSet(null);
      } else if (response.nextClue) {
        setCurrentClue(response.nextClue);
        if (response.nextClue.clueSetId) {
          const clueSet = await clueDAO.getClueSet(response.nextClue.clueSetId);
          setCurrentClueSet(clueSet);
        }
        const [passes, blocks] = await Promise.all([
          clueDAO.getAvailableExpressPasses(team.id),
          clueDAO.getAvailableRoadBlocks(team.id),
        ]);
        setAvailableExpressPasses(passes);
        setAvailableRoadBlocks(blocks);
        const adj = await clueDAO.getTimeAdjustment(team.id);
        setTimeSavedMinutes(adj.totalMinutes ?? 0);
      } else if (updatedProgress?.currentClueId) {
        const nextClue = await clueDAO.getClue(updatedProgress.currentClueId);
        setCurrentClue(nextClue);
        if (nextClue?.clueSetId) {
          const clueSet = await clueDAO.getClueSet(nextClue.clueSetId);
          setCurrentClueSet(clueSet);
        }
        const [passes, blocks] = await Promise.all([
          clueDAO.getAvailableExpressPasses(team.id),
          clueDAO.getAvailableRoadBlocks(team.id),
        ]);
        setAvailableExpressPasses(passes);
        setAvailableRoadBlocks(blocks);
        const adj = await clueDAO.getTimeAdjustment(team.id);
        setTimeSavedMinutes(adj.totalMinutes ?? 0);
      } else {
        setCurrentClue(null);
        setCurrentClueSet(null);
      }
    } catch (err) {
      setLastAnswerError("Failed to submit answer. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600 text-lg">Loading hunt...</p>
      </div>
    );
  }

  if (error || !hunt || !team || !progress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <p className="text-red-600 text-center mb-4">
            {error || "Failed to load hunt"}
          </p>
          <Link href="/">
            <Button fullWidth>Join a Hunt</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Hunt completed
  if (progress.completedAt || currentClue === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-52 h-52 bg-yellow-300 rounded-full opacity-40 blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-orange-300 rounded-full opacity-40 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-pink-300 rounded-full opacity-30 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <Card className="max-w-md w-full text-center relative z-10 border-2 border-yellow-300 shadow-2xl">
          <div className="space-y-6">
            <div className="text-9xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              YOU DID IT!
            </h1>
            <p className="text-xl text-gray-800 font-black">
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">{team.name}</span> crushed it 🔥
            </p>
            <div className="pt-4">
              <Link href="/">
                <Button fullWidth className="text-lg py-4">
                  🎊 Let's Celebrate
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-100 to-rose-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h1 className="text-xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent truncate">
                  {hunt.name}
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/team/answers?teamId=${team.id}&backLink=${encodeURIComponent(`/team?teamId=${team.id}`)}`}
                  className="text-xs font-black text-violet-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border-2 border-violet-200 shadow-md hover:bg-violet-50 transition-colors cursor-pointer"
                >
                  History
                </Link>
              </div>
            </div>
            <ProgressIndicator
              progress={progress}
            />
            {timeSavedMinutes !== 0 && (
              <p className="text-sm font-semibold text-amber-700">
                Time saved: {Math.abs(timeSavedMinutes)} min
              </p>
            )}
          </div>

          {!(viewingRoadBlock || viewingExpressPass) && availableRoadBlocks.map((clue) => (
            <button
              key={clue.id}
              type="button"
              onClick={() => setViewingRoadBlock(clue)}
              className="w-full"
            >
              <RoadBlockCard clue={clue} />
            </button>
          ))}

          {!(viewingRoadBlock || viewingExpressPass) && availableExpressPasses.map((clue) => (
            <button
              key={clue.id}
              type="button"
              onClick={() => setViewingExpressPass(clue)}
              className="w-full"
            >
              <ExpressPassCard clue={clue} />
            </button>
          ))}

          <Card className={`flex flex-col gap-6 border-2 border-violet-200 shadow-2xl`}>
            {viewingRoadBlock ? (
              <div className="flex flex-col items-start space-y-3">
                {!isRoadBlockGateMode && (
                  <Button
                    variant="tertiary"
                    onClick={() => setViewingRoadBlock(null)}
                    className="text-xs py-1.5 px-3"
                  >
                    ← Back to current clue
                  </Button>
                )}
                <RoadBlockBadge />
              </div>
            ) : viewingExpressPass ? (
              <div className="flex flex-col items-start space-y-3">
                {!isRoadBlockGateMode && (
                  <Button
                    variant="tertiary"
                    onClick={() => setViewingExpressPass(null)}
                    className="text-xs py-1.5 px-3"
                  >
                    ← Back to current clue
                  </Button>
                )}
                <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                  Express Pass
                </span>
              </div>
            ) : null}
            <ClueDisplay clue={viewingRoadBlock ?? viewingExpressPass ?? currentClue} />
            <AnswerInput
              onSubmit={handleAnswerSubmit}
              disabled={submitting}
              isSubmitting={submitting}
              allowsMedia={(viewingRoadBlock ?? viewingExpressPass ?? currentClue).allowsMedia}
              clueHasTextAnswer={(viewingRoadBlock ?? viewingExpressPass ?? currentClue).hasTextAnswer}
            />
            {lastAnswerError && (
              <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
                {lastAnswerError}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TeamHuntPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600 text-lg">Loading hunt...</p>
      </div>
    }>
      <TeamHuntContent />
    </Suspense>
  );
}
