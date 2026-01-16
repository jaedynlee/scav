import type { TeamProgress } from "@/lib/models/types";
import ProgressBar from "@/components/shared/ProgressBar";

interface ProgressIndicatorProps {
  progress: TeamProgress;
}

export default function ProgressIndicator({
  progress,
}: ProgressIndicatorProps) {
  const totalClues = progress.totalClueCount ?? 0;
  const completedClues = progress.completedRequiredClueCount ?? 0;

  return (
    <div className="mb-1">
      <ProgressBar
        completed={completedClues}
        total={totalClues}
        label="Progress"
        height="md"
      />
    </div>
  );
}
