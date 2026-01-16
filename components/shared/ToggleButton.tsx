"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ToggleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Current pressed state (controlled). */
  pressed: boolean;
  /** Called when the user toggles; receives the new pressed state. */
  onToggle: (pressed: boolean) => void;
  /** Content shown when not pressed. */
  children: ReactNode;
  /** Optional content when pressed; defaults to children. */
  pressedContent?: ReactNode;
  /** Visual style; "primary" shows filled when pressed, "secondary" shows bordered. */
  variant?: "primary" | "secondary";
}

export default function ToggleButton({
  pressed,
  onToggle,
  children,
  pressedContent,
  variant = "primary",
  className = "",
  disabled,
  "aria-label": ariaLabel,
  ...props
}: ToggleButtonProps) {
  const baseClasses =
    "px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: pressed
      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200",
    secondary: pressed
      ? "bg-violet-100 text-violet-800 border-2 border-violet-400"
      : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200",
  };

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onToggle(!pressed)}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {pressed && pressedContent !== undefined ? pressedContent : children}
    </button>
  );
}
