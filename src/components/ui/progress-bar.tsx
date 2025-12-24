import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  variant = "default",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const getVariantColor = () => {
    if (variant === "default") {
      if (percentage >= 90) return "bg-destructive";
      if (percentage >= 75) return "bg-warning";
      return "bg-gold-gradient";
    }
    switch (variant) {
      case "success":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "danger":
        return "bg-destructive";
      default:
        return "bg-gold-gradient";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="progress-gold">
        <div
          className={cn("progress-gold-fill", getVariantColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
