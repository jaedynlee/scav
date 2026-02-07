"use client";

import { useState } from "react";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import MediaUpload from "./MediaUpload";

interface AnswerInputProps {
  onSubmit: (answer: string, mediaUrls?: string[]) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  allowsMedia?: boolean;
  clueHasTextAnswer?: boolean;
}

export default function AnswerInput({ onSubmit, disabled, isSubmitting = false, allowsMedia = false, clueHasTextAnswer = true }: AnswerInputProps) {
  const [answer, setAnswer] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // If media is allowed, at least one upload is required
    if (allowsMedia) {
      if (mediaUrls.length === 0) {
        setError("Please upload media before submitting.");
        return;
      }
    } else {
      if (!answer.trim()) {
        setError("Please enter an answer before submitting.");
        return;
      }
    }

    onSubmit(answer.trim() || "", allowsMedia ? mediaUrls : undefined);
    setAnswer("");
    setMediaUrls([]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {clueHasTextAnswer && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Answer <span className="text-red-500">*</span>
          </label>

          <Input
            label=""
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setError("");
            }}
            placeholder={"Type your answer here..."}
            required={!allowsMedia}
            disabled={disabled}
            autoFocus={!allowsMedia}
          />
        </>
      )}

      {allowsMedia && (
        <MediaUpload
          mediaUrls={mediaUrls}
          onMediaChange={(newUrls) => {
            setMediaUrls(newUrls);
            setError(""); // Clear error when media is uploaded
          }}
          maxMedia={5}
          disabled={disabled}
        />
      )}

      <Button
        type="submit"
        fullWidth
        disabled={disabled}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="32 24"
              />
            </svg>
            Submitting…
          </span>
        ) : (
          "🚀 Submit Answer"
        )}
      </Button>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-medium">
          {error}
        </div>
      )}
    </form>
  );
}
