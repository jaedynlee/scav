"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ClueSet, Clue, Hunt } from "@/lib/models/types";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Card from "@/components/shared/Card";
import Link from "next/link";
import { ExpressPassCard } from "@/components/clue/ExpressPassCard";
import { RoadBlockCard } from "@/components/clue/RoadBlockCard";
import { clueDAO } from "@/lib/dao/clue";
import { huntDAO } from "@/lib/dao/hunt";

function ClueSetEditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clueSetId = searchParams.get("id");

  const [clueSet, setClueSet] = useState<ClueSet | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (clueSetId) loadClueSet();
    else setLoading(false);
  }, [clueSetId]);

  async function loadClueSet() {
    if (!clueSetId) return;
    try {
      const loadedClueSet = await clueDAO.getClueSet(clueSetId);
      if (!loadedClueSet) {
        setError("ClueSet not found");
        return;
      }

      setClueSet(loadedClueSet);
      setName(loadedClueSet.name || "");

      const loadedClues = await clueDAO.getCluesByClueSet(clueSetId);
      setClues(loadedClues);

      const loadedHunt = await huntDAO.getHunt(loadedClueSet.huntId);
      setHunt(loadedHunt);
    } catch (err) {
      setError("Failed to load clueset");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!clueSet) return;

    if (!name.trim()) {
      setError("Clue set name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await clueDAO.updateClueSet(clueSet.id, {
        name: name.trim(),
        huntId: clueSet.huntId,
        clueIds: clueSet.clueIds,
        position: clueSet.position,
      });

      await loadClueSet();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save clueset name";
      setError(errorMessage);
      console.error("Error saving clueset:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!clueSet || !hunt) return;

    if (!confirm("Are you sure you want to delete this clueset? This cannot be undone.")) {
      return;
    }

    try {
      // Delete clueset
      await clueDAO.deleteClueSet(clueSet.id);

      router.push(`/admin/hunts/edit?id=${hunt.id}`);
    } catch (err) {
      setError("Failed to delete clueset");
      console.error(err);
    }
  }

  if (!clueSetId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Clue set ID is required</p>
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

  if (!clueSet || !hunt) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Clueset not found"}</p>
        <Link href="/admin/hunts">
          <Button>Back to Hunts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/admin/hunts/edit?id=${hunt.id}`}>
        <button className="text-gray-600 pb-4">
          ← Back to {hunt.name}
        </button>
      </Link>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
          {error}
        </div>
      )}

      <Card>
        <div className="space-y-4">
          <Input
            label="Clue Set Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter clue set name"
            disabled={saving}
            required
          />
          <Button onClick={handleSave} disabled={saving} fullWidth>
            {saving ? "Saving..." : "Save Name"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Clues</h2>
          <Link href={`/admin/clues/new?clueSetId=${clueSetId}`}>
            <Button>Add Clue</Button>
          </Link>
        </div>

        {clues.length === 0 ? (
          <p className="text-gray-600 text-center py-4">
            No clues yet.
          </p>
        ) : (
          <div className="space-y-2">
            {(() => {
              const requiredClues = clues.filter((c) => (c.clueType ?? "CLUE") === "CLUE" || c.position != null);
              const expressPasses = clues.filter((c) => (c.clueType ?? "CLUE") === "EXPRESS_PASS");
              const roadBlocks = clues.filter((c) => (c.clueType ?? "CLUE") === "ROAD_BLOCK");

              return (
                <>
                  {requiredClues.length > 0 && (
                    <div className="space-y-2">
                      {requiredClues
                        .slice()
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((clue, index) => (
                          <Link
                            key={clue.id}
                            href={`/admin/clues/edit?id=${clue.id}`}
                            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  Clue {index + 1}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {clue.prompt || "(No prompt)"}
                                </p>
                                {clue.images && clue.images.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {clue.images.length} image(s)
                                  </p>
                                )}
                              </div>
                              <span className="text-gray-400">→</span>
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}
                  {expressPasses.length > 0 && (
                    <div className="space-y-2">
                      {expressPasses.map((clue) => (
                        <Link
                          key={clue.id}
                          href={`/admin/clues/edit?id=${clue.id}`}
                        >
                          <ExpressPassCard clue={clue} />
                        </Link>
                      ))}
                    </div>
                  )}
                  {roadBlocks.length > 0 && (
                    <div className="space-y-2">
                      {roadBlocks.map((clue) => (
                        <Link
                          key={clue.id}
                          href={`/admin/clues/edit?id=${clue.id}`}
                        >
                          <RoadBlockCard clue={clue} />
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Card>


      <div className="flex gap-4">
        <Button variant="danger" onClick={handleDelete} fullWidth>
          Delete ClueSet
        </Button>
      </div>

    </div>
  );
}

export default function ClueSetEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <ClueSetEditorContent />
    </Suspense>
  );
}
