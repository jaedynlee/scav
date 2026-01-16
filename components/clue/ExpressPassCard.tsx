import { Clue } from "@/lib/models/types";

type Props = {
    clue: Clue;
}

export function ExpressPassCard({ clue }: Props) {
    return (
        <div className="flex justify-between block p-4 border border-amber-200 bg-amber-50/50 rounded-lg hover:bg-amber-50 transition-colors">
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                        Express Pass
                    </span>
                    {clue.minutes != null && (
                        <span className="text-xs text-amber-700">
                            Save {Math.abs(clue.minutes)} min
                        </span>
                    )}
                </div>
                <p className="text-left text-sm text-gray-600 line-clamp-2 mt-1">
                    {clue.prompt || "(No prompt)"}
                </p>
                {clue.images && clue.images.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                        {clue.images.length} image(s)
                    </p>
                )}
            </div>
            <span className="text-gray-400">→</span>
        </div>
    )
}