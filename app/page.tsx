"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Card from "@/components/shared/Card";
import { useUserRole } from "./auth/hooks/useUserRole";
import Link from "next/link";
import { huntDAO } from "@/lib/dao/hunt";
import { teamDAO } from "@/lib/dao/team";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isAdmin, loading: roleLoading, error: roleError } = useUserRole();

  if (roleLoading) {
    return <div className="text-center min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (roleError) {
    return <div>Error: {roleError}</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!joinCode.trim()) {
      setError("Team join code is required");
      setLoading(false);
      return;
    }

    try {
      const team = await teamDAO.joinHunt(joinCode.trim().toUpperCase());

      const hunt = await huntDAO.getHunt(team.huntId);
      let progress = null;
      try {
        progress = await teamDAO.getTeamProgress(team.id);
      } catch {
        /* ignore */
      }

      const isCompleted =
        hunt?.status === "completed" || (progress?.completedAt != null);

      if (isCompleted) {
        const backLink = encodeURIComponent("/");
        router.push(
          `/team/answers?teamId=${team.id}&backLink=${backLink}`
        );
      } else {
        router.push(`/team?teamId=${team.id}`);
      }
    } catch (err) {
      setError("Invalid join code. Please check your code and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-40 h-40 bg-violet-300 rounded-full opacity-30 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-52 h-52 bg-fuchsia-300 rounded-full opacity-30 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-rose-300 rounded-full opacity-25 blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-yellow-300 rounded-full opacity-20 blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="text-center space-y-5">
          <div className="inline-block animate-wiggle">
            <h1 className="text-7xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent mb-2 drop-shadow-lg">
              🧩
            </h1>
          </div>
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent leading-tight">
            Epic Hunt
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Year 2 🔎
          </p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <Input
              label=""
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter your join code"
              required
              disabled={loading}
              className="text-center text-2xl font-mono tracking-wider"
              maxLength={8}
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Joining..." : "Join"}
            </Button>
          </form>
        </Card>
        {isAdmin && <div className="text-center"><Link href="/admin/hunts">Switch to admin dashboard</Link></div>}
      </div>
    </div>
  );
}
