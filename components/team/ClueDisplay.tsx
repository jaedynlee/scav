import type { Clue } from "@/lib/models/types";

interface ClueDisplayProps {
  clue: Clue;
}

export default function ClueDisplay({ clue }: ClueDisplayProps) {
  return (
    <div className="space-y-6">
      {clue.prompt && (
        <p className="text-gray-900 text-md whitespace-pre-wrap leading-relaxed font-medium">
          {clue.prompt}
        </p>
      )}

      {clue.images.length > 0 && (
        <div className="grid gap-4">
          {clue.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Clue image ${index + 1}`}
              className="w-full"
            />
          ))}
        </div>
      )}

      {!clue.prompt && clue.images.length === 0 && (
        <p className="text-gray-500 italic text-center py-4 font-medium">No clue content available 🤔</p>
      )}
    </div>
  );
}
