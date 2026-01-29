"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Hunt } from "@/lib/models/types";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Card from "@/components/shared/Card";
import { clueDAO } from "@/lib/dao/clue";
import { huntDAO } from "@/lib/dao/hunt";

function NewClueSetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const huntId = searchParams.get("huntId");

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!huntId) {
      setError("Hunt ID is required");
      setLoading(false);
      return;
    }

    loadHunt();
  }, [huntId]);

  async function loadHunt() {
    if (!huntId) return;

    try {
      const loadedHunt = await huntDAO.getHunt(huntId);
      if (!loadedHunt) {
        setError("Hunt not found");
        return;
      }
      setHunt(loadedHunt);
    } catch (err) {
      setError("Failed to load hunt");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!huntId || !hunt) return;

    if (!name.trim()) {
      setError("Clue set name is required");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const clueSet = await clueDAO.createClueSet({
        name: name.trim(),
        huntId,
        clueIds: [],
      });

      router.push(`/admin/cluesets/edit?id=${clueSet.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create clueset";
      setError(errorMessage);
      console.error("Error creating clueset:", err);
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

  if (error || !hunt) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Hunt not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Clueset</h1>

      <Card>
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-gray-600">
            This clueset will be added to: <strong>{hunt.name}</strong>
          </p>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <Input
            label="Clue Set Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter clue set name"
            required
            disabled={creating}
          />

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={creating}
              fullWidth
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating} fullWidth>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewClueSetPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <NewClueSetContent />
    </Suspense>
  );
}
