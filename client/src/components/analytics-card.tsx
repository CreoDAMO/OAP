import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "primary" | "secondary" | "accent" | "amber";
  label?: string;
}

const colorClasses = {
  primary: {
    text: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    progress: "bg-blue-600"
  },
  secondary: {
    text: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    progress: "bg-purple-600"
  },
  accent: {
    text: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    progress: "bg-green-600"
  },
  amber: {
    text: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    progress: "bg-amber-600"
  }
};

export function AnalyticsCard({ title, value, icon, color, label }: AnalyticsCardProps) {
  const colors = colorClasses[color];
  
  const getLabel = (score: number) => {
    if (score >= 90) return "⭐ EXCELLENT";
    if (score >= 80) return "⭐ STRONG";
    if (score >= 70) return "⭐ GOOD";
    if (score >= 60) return "⭐ FAIR";
    return "⭐ NEEDS WORK";
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", colors.bg)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-gray-300">{title}</p>
            <p className={cn("text-3xl font-bold", colors.text)}>{value}</p>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colors.iconBg)}>
            <i className={cn(icon, "text-xl", colors.text)}></i>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={cn("h-2 rounded-full", colors.progress)} 
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className={cn("ml-2 text-xs", colors.text)}>
            {label || getLabel(value)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
