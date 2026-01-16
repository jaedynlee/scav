interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  label?: string;
  height?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export default function ProgressBar({
  completed,
  total,
  showLabel = true,
  label = "Progress",
  height = "md",
  showCount = true,
  className = "",
}: ProgressBarProps) {
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  const heightClasses = {
    sm: "h-[16px]",
    md: "h-[20px]",
    lg: "h-[24px]",
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-black text-gray-800 flex items-center gap-1">
            <span>⚡</span> {label}
          </span>
          {showCount && (
            <span className="text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {completed} / {total}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200/60 rounded-full ${heightClasses[height]} overflow-hidden shadow-inner border border-gray-300 items-center`}
      >
        <div
          className={`bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-700 ease-out shadow-lg relative`}
          style={{
            width: `${progressPercentage}%`,
            height: "100%",
            minHeight: height === "sm" ? "12px" : height === "md" ? "16px" : "24px"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full" />
        </div>
      </div>
    </div>
  );
}
