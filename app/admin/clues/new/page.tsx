"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clueDAO } from "@/lib/dao/clue";
import type { ClueSet, ClueType } from "@/lib/models/types";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/Textarea";
import Card from "@/components/shared/Card";
import ImageUpload from "@/components/admin/ImageUpload";

function NewClueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clueSetId = searchParams.get("clueSetId");

  const [clueSet, setClueSet] = useState<ClueSet | null>(null);
  const [prompt, setPrompt] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [allowsMedia, setAllowsMedia] = useState(false);
  const [clueType, setClueType] = useState<ClueType>("CLUE");
  const [minutes, setMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clueSetId) {
      setError("ClueSet ID is required");
      setLoading(false);
      return;
    }

    loadClueSet();
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
    } catch (err) {
      setError("Failed to load clueset");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (clueType === "CLUE" && !correctAnswer.trim() && !allowsMedia) {
      setError("Correct answer is required for required clues unless media is allowed");
      return;
    }

    if (!clueSetId || !clueSet) return;

    setCreating(true);

    try {
      await clueDAO.createClue({
        clueSetId,
        prompt: prompt.trim() || "",
        images,
        correctAnswer: correctAnswer.trim() || undefined,
        allowsMedia,
        clueType,
        minutes: clueType === "EXPRESS_PASS" ? (minutes ?? null) : null,
      });

      router.push(`/admin/cluesets/edit?id=${clueSetId}`);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to create clue";
      if (errorMessage.includes("allows_media") || errorMessage.includes("column")) {
        setError("Database schema needs update. Please add 'allows_media' column to the clues table. See console for details.");
      } else {
        setError(errorMessage);
      }
      console.error("Error creating clue:", err);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !clueSet) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "ClueSet not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Clue</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <Textarea
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter clue prompt/question"
            rows={4}
            required
            disabled={creating}
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
              disabled={creating}
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
              disabled={creating}
            />
          )}

          <Input
            label={clueType === "EXPRESS_PASS" ? "Correct Answer (optional)" : "Correct Answer (optional if media is allowed)"}
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="Enter the correct answer"
            required={clueType === "CLUE" && !allowsMedia}
            disabled={creating}
          />

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="allowsMedia"
              checked={allowsMedia}
              onChange={(e) => setAllowsMedia(e.target.checked)}
              disabled={creating}
              className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <label htmlFor="allowsMedia" className="text-sm font-medium text-gray-700 cursor-pointer">
              Allow teams to submit images/videos as answers
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={creating} fullWidth>
              {creating ? "Creating..." : "Create"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={creating}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewCluePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <NewClueContent />
    </Suspense>
  );
}
