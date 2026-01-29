"use client";

import Link from "next/link";

interface AnswerSubmissionsProps {
  teamId: string;
  huntId: string;
}

export default function AnswerSubmissions({ teamId, huntId }: AnswerSubmissionsProps) {
  return (
    <Link
      href={`/team/answers?teamId=${teamId}&backLink=${encodeURIComponent(`/admin/hunts/teams?huntId=${huntId}`)}`}
      className="text-sm text-violet-600 hover:text-violet-700 font-medium inline-block"
    >
      View Answer Submissions →
    </Link>
  );
}
