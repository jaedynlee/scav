export type HuntStatus = "draft" | "active" | "completed";

export interface Hunt {
  id: string;
  name: string;
  description?: string;
  // clueSetIds: string[];
  createdAt: string;
  status: HuntStatus;
}

export interface ClueSet {
  id: string;
  name: string;
  huntId: string;
  clueIds: string[];
  position: number; // Sequence in hunt
}

export type ClueType = "CLUE" | "EXPRESS_PASS" | "ROAD_BLOCK";

export interface Clue {
  id: string;
  clueSetId: string;
  prompt: string; // Text prompt
  images: string[]; // Base64 or URLs
  correctAnswer?: string; // Normalized for comparison
  hasTextAnswer: boolean;
  position: number | null; // Order within clueset; null for EXPRESS_PASS, ROAD_BLOCK
  allowsMedia: boolean; // Whether teams can submit images/videos as answers
  clueType: ClueType;
  minutes: number | null; // Time saved (negative) for EXPRESS_PASS
}

export interface User {
  id: string;
  name: string;
  phoneNumber: number;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  huntId: string;
  createdAt: string;
  joinCode: string;
}

export interface TeamProgress {
  teamId: string;
  huntId: string;
  currentClueSetId: string | null;
  currentClueId: string | null;
  completedClueIds: string[];
  completedClueSetIds: string[];
  roadBlockClueIds: string[]; // Clue IDs assigned to this team as road blocks
  startedAt: string | null;
  completedAt: string | null;
  totalClueCount: number | null;
  completedRequiredClueCount: number | null;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  huntCompleted: boolean;
  nextClue: Clue | null;
}

export interface AnswerSubmission {
  id: string;
  teamId: string;
  clueId: string;
  huntId: string;
  answerText: string;
  mediaUrls: string[]; // URLs or base64 strings
  submittedAt: string;
}
