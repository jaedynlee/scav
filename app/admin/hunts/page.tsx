"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { huntDAO } from "@/lib/dao/hunt";
import type { Hunt } from "@/lib/models/types";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";

export default function HuntsPage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHunts();
  }, []);

  async function loadHunts() {
    try {
      const allHunts = await huntDAO.getAllHunts();
      setHunts(allHunts);
    } catch (error) {
      console.error("Failed to load hunts:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/">
        <button className="text-gray-600">
          ← Back to Home
        </button>
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
          All Hunts
        </h1>
        <Link href="/admin/hunts/new">
          <Button>New Hunt</Button>
        </Link>
      </div>

      {hunts.length === 0 ? (
        <Card className="text-center border-2 border-violet-200">
          <div className="py-12 space-y-4">
            <p className="text-xl text-gray-700 font-bold">
              No hunts yet!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5">
          {hunts.map((hunt) => (
            <Link key={hunt.id} href={`/admin/hunts/${hunt.id}`}>
              <Card className="hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                      {hunt.name}
                    </h2>
                    {hunt.description && (
                      <p className="text-gray-700 mb-3 font-medium">{hunt.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm justify-between items-center">
                      <span
                        className={`${hunt.status === "active"
                          ? "text-emerald-600"
                          : hunt.status === "completed"
                            ? "text-purple-600"
                            : "text-gray-600"
                          }`}
                      >
                        {hunt.status === "active" ? "🟢 " : hunt.status === "completed" ? "🟣 " : "🟡 "}
                        <span className="font-bold">{hunt.status === "completed" ? "done" : hunt.status}</span>
                      </span>
                      {/* <span className="font-bold text-gray-700">🔍 {hunt.clueSetIds.length} cluesets</span> */}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
