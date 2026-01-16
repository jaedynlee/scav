"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { huntDAO } from "@/lib/dao/hunt";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/Textarea";
import Card from "@/components/shared/Card";

export default function NewHuntPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Hunt name is required");
      setLoading(false);
      return;
    }

    try {
      const hunt = await huntDAO.createHunt({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      router.push(`/admin/hunts/${hunt.id}`);
    } catch (err) {
      setError("Failed to create hunt. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Hunt</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <Input
            label="Hunt Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter hunt name"
            required
            disabled={loading}
          />

          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter hunt description"
            rows={4}
            disabled={loading}
          />

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              fullWidth
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
