import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border-2 border-violet-100/50 ${className}`}
    >
      {children}
    </div>
  );
}
