import CopyButton from "@/components/shared/CopyButton";

export function CodeField({ code }: { code: string }) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Join Code:</span>
            <div className="flex items-center gap-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-lg border-2 border-violet-200">
                <span className="font-mono font-black px-3 py-1.5 text-violet-700">
                    {code}
                </span>
                <CopyButton text={code} size="sm" />
            </div>
        </div>
    )
}
