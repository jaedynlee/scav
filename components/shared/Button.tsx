import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "px-6 py-3 rounded-2xl font-black text-base transition-all duration-300 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 hover:scale-105";

  const tertiaryBaseClasses =
    "px-0 py-0 rounded-none font-medium text-base transition-colors duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white hover:from-violet-700 hover:via-fuchsia-700 hover:to-rose-600 shadow-violet-500/30",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300 border-2 border-slate-300",
    tertiary: "bg-transparent text-gray-700 hover:text-gray-900 border-0 shadow-none hover:shadow-none hover:underline",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const classesToUse = variant === "tertiary" ? tertiaryBaseClasses : baseClasses;

  return (
    <button
      className={`${classesToUse} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

