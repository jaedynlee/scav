import { formatElapsedMs } from "@/lib/utils/format";
import ProgressBar from "../shared/ProgressBar";
import { TeamProgress } from "@/lib/models/types";
import { useEffect, useMemo, useState } from "react";
import { clueDAO } from "@/lib/dao/clue";

export function ProgressSummary({ progress }: { progress: TeamProgress }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [now, setNow] = useState(() => new Date());
    const [timeSavedMinutes, setTimeSavedMinutes] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, [progress.teamId]);

    async function loadData() {
        setError("");
        try {
            let savedMinutes = 0;
            try {
                const adj = await clueDAO.getTimeAdjustment(progress.teamId);
                savedMinutes = adj.totalMinutes ?? 0;
            } catch {
                /* ignore */
            }

            setTimeSavedMinutes(savedMinutes);
        } catch (err: any) {
            const errorMessage = err?.message || err?.toString() || "Failed to load data";
            setError(`Failed to load data: ${errorMessage}`);
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    }

    const elapsedTime = useMemo(() => {
        if (!progress?.startedAt) return 0;
        return (progress.completedAt
            ? new Date(progress.completedAt).getTime()
            : now.getTime()) - new Date(progress.startedAt).getTime()
    }, [progress?.completedAt, progress?.startedAt, now]);

    // Update "now" every minute when hunt is in progress (for elapsed time)
    useEffect(() => {
        if (!progress?.startedAt || progress.completedAt) return;
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, [progress?.startedAt, progress?.completedAt]);

    return (
        <div className="space-y-3">
            <ProgressBar
                completed={progress.completedRequiredClueCount ?? progress.completedClueIds.length ?? 0}
                total={progress.totalClueCount ?? 0}
                height="sm"
                showLabel={true}
                showCount={true}
            />
            {error && (
                <div className="text-red-600 text-sm font-medium py-1" role="alert">
                    {error}
                </div>
            )}
            {loading && !error && (
                <div className="text-gray-500 text-sm py-1">Loading…</div>
            )}
            {!loading && (
                <div className="flex flex-col gap-1 text-sm">
                    {progress.startedAt && (
                        <div>
                            <span className="text-gray-600 font-medium">Time started:</span>{" "}
                            <span className="font-semibold text-gray-900">
                                {new Date(progress.startedAt).toLocaleString()}
                            </span>
                        </div>
                    )}
                    {progress.completedAt && (
                        <div>
                            <span className="text-gray-600 font-medium">Time ended:</span>{" "}
                            <span className="font-semibold text-gray-900">
                                {new Date(progress.completedAt).toLocaleString()}
                            </span>
                        </div>
                    )}
                    {progress.startedAt && (
                        <div>
                            <span className="text-gray-600 font-medium">Time elapsed:</span>{" "}
                            <span className={timeSavedMinutes !== 0 ? "font-semibold text-gray-900" : "font-semibold text-emerald-700"}>
                                {formatElapsedMs(elapsedTime)}
                            </span>
                        </div>
                    )}
                    {timeSavedMinutes !== 0 && (
                        <div>
                            <span className="text-gray-600 font-medium">Express pass:</span>{" "}
                            <span className="font-semibold text-amber-700">
                                -{Math.abs(timeSavedMinutes)} min
                            </span>
                        </div>
                    )}
                    {timeSavedMinutes !== 0 && elapsedTime !== 0 && (
                        <div>
                            <span className="text-gray-600 font-medium">Effective time:</span>{" "}
                            <span className="font-semibold text-emerald-700">
                                {formatElapsedMs(elapsedTime + timeSavedMinutes * 60_000)}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}