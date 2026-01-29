"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { huntDAO } from "@/lib/dao/hunt";
import { clueDAO } from "@/lib/dao/clue";
import { teamDAO } from "@/lib/dao/team";
import type { Hunt, ClueSet } from "@/lib/models/types";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/Textarea";
import Card from "@/components/shared/Card";
import Link from "next/link";

function HuntEditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const huntId = searchParams.get("id");

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [clueSets, setClueSets] = useState<ClueSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Hunt["status"]>("draft");

  useEffect(() => {
    if (huntId) loadHunt();
    else setLoading(false);
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
      setName(loadedHunt.name);
      setDescription(loadedHunt.description || "");
      setStatus(loadedHunt.status);

      const loadedClueSets = await clueDAO.getClueSetsByHunt(huntId);
      setClueSets(loadedClueSets);
    } catch (err) {
      setError("Failed to load hunt");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!hunt || !huntId) return;

    setSaving(true);
    setError("");

    try {
      await huntDAO.updateHunt(huntId, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });

      await loadHunt();
    } catch (err) {
      setError("Failed to save hunt");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!huntId) return;
    if (!confirm("Are you sure you want to delete this hunt? This cannot be undone.")) {
      return;
    }

    try {
      await huntDAO.deleteHunt(huntId);
      router.push("/admin/hunts");
    } catch (err) {
      setError("Failed to delete hunt");
      console.error(err);
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

      <Link href="/admin/hunts">
        <button className="text-gray-600">
          ← Back to All Hunts
        </button>
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
          Edit Hunt
        </h1>
      </div>

      <Card>
        <div className="space-y-4">
          <Input
            label="Hunt Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            disabled={saving}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Hunt["status"])}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>


          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving} fullWidth>
              {saving ? "Saving..." : "Save Changes"}
            </Button>

          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Teams</h2>
          <Link href={`/admin/hunts/teams?huntId=${huntId}`}>
            <Button>View</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cluesets</h2>
          <Link href={`/admin/cluesets/new?huntId=${huntId}`}>
            <Button>Add Clueset</Button>
          </Link>
        </div>

        {clueSets.length === 0 ? (
          <p className="text-gray-600 text-center py-4">
            No cluesets yet.
          </p>
        ) : (
          <div className="space-y-2">
            {clueSets.map((clueSet, index) => (
              <Link
                key={clueSet.id}
                href={`/admin/cluesets/edit?id=${clueSet.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {clueSet.name || `Clueset ${index + 1}`}
                    </h3>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
      <Button
        variant="danger"
        onClick={handleDelete}
        disabled={saving}
        fullWidth
      >
        Delete Hunt
      </Button>
    </div>
  );
}

export default function HuntEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <HuntEditorContent />
    </Suspense>
  );
}
