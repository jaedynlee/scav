import { Clue } from "@/lib/models/types";

type Props = {
    clue: Clue;
}

export function RoadBlockCard({ clue }: Props) {
    return (
        <div className="flex text-left justify-between items-center block p-4 border border-rose-200 bg-rose-100 rounded-lg transition-colors">
            <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between">
                    <RoadBlockBadge />
                    <span className="text-gray-400">→</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {clue.prompt || "(No prompt)"}
                </p>
                {clue.images && clue.images.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                        {clue.images.length} image(s)
                    </p>
                )}
                <div className="text-xs text-rose-800">You must complete this task before moving on from this location.</div>

            </div>

        </div>
    )
}

export function RoadBlockBadge() {
    return (
        <span className="text-xs font-bold bg-rose-200 text-rose-800 px-2 py-1 rounded">
            <span className="pr-1">🛑</span> Road Block
        </span>
    )
}