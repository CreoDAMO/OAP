import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-chart-line" },
  { name: "Editor", href: "/editor", icon: "fas fa-edit" },
  { name: "AI Analysis", href: "/analysis", icon: "fas fa-brain" },
  { name: "Royalty Calculator", href: "/royalty-calculator", icon: "fas fa-dollar-sign" },
  { name: "Collaboration", href: "/collaboration", icon: "fas fa-users" },
  { name: "Blockchain", href: "/blockchain", icon: "fas fa-cubes" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: () => api.getUser(),
  });

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-quill-pen text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">OmniAuthor Pro</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400">2025 Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href} className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium",
              isActive
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800"
            )}>
              <i className={item.icon}></i>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img 
            src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150"} 
            alt="User profile" 
            className="w-10 h-10 rounded-full object-cover" 
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-white">
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || "User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400 capitalize">
              {user?.plan || "Free"} Plan
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
