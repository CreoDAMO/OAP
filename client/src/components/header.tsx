import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="text-slate-600 dark:text-gray-300 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            <i className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"}`}></i>
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <i className="fas fa-bell"></i>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>
          
          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}
