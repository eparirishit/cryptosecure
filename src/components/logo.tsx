import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "minimal";
  iconSize?: "sm" | "md" | "lg";
}

export const Logo = ({ 
  className, 
  variant = "default",
  iconSize = "md"
}: LogoProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {variant === "default" ? (
        <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
          <ShieldCheck className={cn("text-white", sizeClasses[iconSize])} />
        </div>
      ) : (
        <ShieldCheck className={cn("text-blue-600", sizeClasses[iconSize])} />
      )}
      <span className="text-xl font-bold tracking-tight text-neutral-900">
        CryptoSecure
      </span>
    </div>
  );
};

