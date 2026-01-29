"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clueDAO } from "@/lib/dao/clue";
import type { Clue, ClueSet, ClueType } from "@/lib/models/types";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/Textarea";
import Card from "@/components/shared/Card";
import ImageUpload from "@/components/admin/ImageUpload";
import Link from "next/link";

function ClueEditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clueId = searchParams.get("id");

  const [clue, setClue] = useState<Clue | null>(null);
  const [clueSet, setClueSet] = useState<ClueSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [prompt, setPrompt] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [allowsMedia, setAllowsMedia] = useState(false);
  const [clueType, setClueType] = useState<ClueType>("CLUE");
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (clueId) loadClue();
    else setLoading(false);
  }, [clueId]);

  async function loadClue() {
    if (!clueId) return;
    try {
      const loadedClue = await clueDAO.getClue(clueId);
      if (!loadedClue) {
        setError("Clue not found");
        return;
      }

      setClue(loadedClue);
      setPrompt(loadedClue.prompt);
      setCorrectAnswer(loadedClue.correctAnswer ?? "");
      setImages(loadedClue.images ?? []);
      setAllowsMedia(loadedClue.allowsMedia ?? false);
      setClueType(loadedClue.clueType ?? "CLUE");
      setMinutes(loadedClue.minutes ?? null);

      const loadedClueSet = await clueDAO.getClueSet(
        loadedClue.clueSetId
      );
      setClueSet(loadedClueSet);
    } catch (err) {
      setError("Failed to load clue");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!clue || !clueId) return;

    setSaving(true);
    setError("");

    if (clueType === "CLUE" && !correctAnswer.trim()) {
      setError("Correct answer is required for required clues");
      setSaving(false);
      return;
    }

    try {
      const updates: Parameters<typeof clueDAO.updateClue>[1] = {
        prompt: prompt.trim(),
        correctAnswer: correctAnswer.trim() || undefined,
        images,
        allowsMedia,
        clueType,
        minutes: clueType === "EXPRESS_PASS" ? minutes : null, // ROAD_BLOCK has no minutes
      };
      if (clueType === "EXPRESS_PASS" || clueType === "ROAD_BLOCK") {
        (updates as Record<string, unknown>).position = null;
      }
      await clueDAO.updateClue(clueId, updates);

      await loadClue();
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to save clue";
      if (errorMessage.includes("allows_media") || errorMessage.includes("column")) {
        setError("Database schema needs update. Please add 'allows_media' column to the clues table. See console for details.");
      } else {
        setError(errorMessage);
      }
      console.error("Error saving clue:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!clue || !clueSet) return;

    if (!confirm("Are you sure you want to delete this clue? This cannot be undone.")) {
      return;
    }

    try {
      // Delete clue (endpoint handles removing from clue set)
      await clueDAO.deleteClue(clue.id);

      router.push(`/admin/cluesets/edit?id=${clueSet.id}`);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to delete clue";
      setError(errorMessage);
      console.error("Error deleting clue:", err);
    }
  }

  if (!clueId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Clue ID is required</p>
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

  if (!clue || !clueSet) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Clue not found"}</p>
        <Link href="/admin/hunts">
          <Button>Back to Hunts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Edit Clue</h1>
        <Link href={`/admin/cluesets/edit?id=${clueSet.id}`}>
          <Button variant="secondary">Back to ClueSet</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
          {error}
        </div>
      )}

      <Card>
        <div className="space-y-4">
          <Textarea
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={saving}
          />

          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={5}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clue Type</label>
            <select
              value={clueType}
              onChange={(e) => setClueType(e.target.value as ClueType)}
              disabled={saving}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="CLUE">Required Clue</option>
              <option value="EXPRESS_PASS">Express Pass</option>
              <option value="ROAD_BLOCK">Road Block</option>
            </select>
          </div>

          {clueType === "EXPRESS_PASS" && (
            <Input
              label="Minutes (time saved, use negative e.g. -5)"
              type="number"
              value={minutes ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setMinutes(v === "" ? null : parseInt(v, 10));
              }}
              placeholder="-5"
              disabled={saving}
            />
          )}

          <Input
            label={clueType === "EXPRESS_PASS" ? "Correct Answer (optional)" : "Correct Answer *"}
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            required={clueType === "CLUE"}
            disabled={saving}
          />

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="allowsMedia"
              checked={allowsMedia}
              onChange={(e) => setAllowsMedia(e.target.checked)}
              disabled={saving}
              className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <label htmlFor="allowsMedia" className="text-sm font-medium text-gray-700 cursor-pointer">
              Allow teams to submit images/videos as answers
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving} fullWidth>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={saving}
              fullWidth
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ClueEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <ClueEditorContent />
    </Suspense>
  );
}
