"use client";

import { useState, useEffect } from "react";
import { clueDAO } from "@/lib/dao/clue";
import type { ClueSet, Clue, TeamProgress } from "@/lib/models/types";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";

interface ClueHistoryProps {
  completedClueSetIds: string[];
  progress: TeamProgress;
}

export default function ClueHistory({
  completedClueSetIds,
  progress,
}: ClueHistoryProps) {
  const [clueSets, setClueSets] = useState<ClueSet[]>([]);
  const [clues, setClues] = useState<Record<string, Clue[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedClueSet, setExpandedClueSet] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [completedClueSetIds]);

  async function loadHistory() {
    try {
      const loadedClueSets: ClueSet[] = [];
      const loadedClues: Record<string, Clue[]> = {};

      for (const clueSetId of completedClueSetIds) {
        const clueSet = await clueDAO.getClueSet(clueSetId);
        if (clueSet) {
          loadedClueSets.push(clueSet);

          // Get all clues for this clueset
          const cluesInSet = await clueDAO.getCluesByClueSet(clueSetId);
          // Filter to only show completed clues
          const completedClues = cluesInSet.filter((clue) =>
            progress.completedClueIds.includes(clue.id)
          );
          loadedClues[clueSetId] = completedClues;
        }
      }

      setClueSets(loadedClueSets);
      setClues(loadedClues);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">Loading history...</p>
      </div>
    );
  }

  if (completedClueSetIds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No completed cluesets yet. Complete your first clueset to see it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clueSets.map((clueSet, index) => {
        const cluesInSet = clues[clueSet.id] || [];
        const isExpanded = expandedClueSet === clueSet.id;

        return (
          <Card key={clueSet.id} className="border-2 border-green-200">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {clueSet.name || `ClueSet ${index + 1}`} ✓
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {cluesInSet.length} clue(s) completed
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setExpandedClueSet(isExpanded ? null : clueSet.id)
                  }
                >
                  {isExpanded ? "Hide" : "View Clues"}
                </Button>
              </div>

              {isExpanded && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {cluesInSet.map((clue, clueIndex) => (
                    <Card key={clue.id} className="bg-green-50 border-2 border-green-200">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-700">
                            ✓ Clue {clueIndex + 1} (Completed)
                          </span>
                        </div>

                        {clue.prompt && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-2">Prompt:</h4>
                            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {clue.prompt}
                            </p>
                          </div>
                        )}

                        {clue.images.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-2">Images:</h4>
                            <div className="grid gap-3">
                              {clue.images.map((image, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={image}
                                  alt={`Clue image ${imgIndex + 1}`}
                                  className="w-full rounded-xl border-2 border-green-200 shadow-md"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-green-200">
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold">Answer:</span> {clue.correctAnswer}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
