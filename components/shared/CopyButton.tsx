"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function CopyButton({
  text,
  className = "",
  size = "md",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  const sizeClasses = {
    sm: "w-6 h-6 text-sm",
    md: "w-8 h-8 text-base",
    lg: "w-10 h-10 text-lg",
  };

  return (
    <button
      onClick={handleCopy}
      className={`${sizeClasses[size]} flex items-center justify-center active:scale-95 transition-all duration-200 touch-manipulation ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <span className="text-xs">✓</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 7.5H6a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 006 22.5h8.25a2.25 2.25 0 002.25-2.25v-10.5A2.25 2.25 0 0014.25 7.5h-2.25m-6 3h6m-6 0v-3a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v3m-6 0h6"
          />
        </svg>
      )}
    </button>
  );
}
