import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = ({ size = "md", className = "" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#00458c]`} />
    </div>
  );
};

export const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <LoadingSpinner size="lg" />
  </div>
);

export const ComponentLoadingFallback = ({ className = "py-12" }: { className?: string }) => (
  <LoadingSpinner size="md" className={className} />
);