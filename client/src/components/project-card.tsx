import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/api";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: number) => void;
}

const genreColors: Record<string, string> = {
  "Science Fiction": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Fantasy": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Romance": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "Mystery": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  "Thriller": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Horror": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Self-Help": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Technology": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

const getGenreIcon = (genre: string) => {
  const icons: Record<string, string> = {
    "Science Fiction": "fas fa-rocket",
    "Fantasy": "fas fa-dragon",
    "Romance": "fas fa-heart",
    "Mystery": "fas fa-search",
    "Thriller": "fas fa-bolt",
    "Horror": "fas fa-ghost",
    "Self-Help": "fas fa-lightbulb",
    "Technology": "fas fa-microchip",
  };
  return icons[genre] || "fas fa-book";
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const genreColor = genreColors[project.genre || ""] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  const genreIcon = getGenreIcon(project.genre || "");

  return (
    <Card className="transition-all hover:shadow-md hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className={`${genreIcon} text-white`}></i>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-semibold text-slate-800 dark:text-white">{project.title}</h4>
                {project.genre && (
                  <Badge className={genreColor}>
                    {project.genre}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {project.wordCount.toLocaleString()} words
                {project.status && ` • ${project.status}`}
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                Updated {formatDistanceToNow(new Date(project.updatedAt))} ago
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/editor/${project.id}`}>
              <Button variant="ghost" size="sm">
                <i className="fas fa-edit mr-2"></i>
                Edit
              </Button>
            </Link>
            <Link href={`/analysis/${project.id}`}>
              <Button variant="ghost" size="sm">
                <i className="fas fa-chart-line mr-2"></i>
                Analyze
              </Button>
            </Link>
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(project.id)}
                className="text-red-500 hover:text-red-700"
              >
                <i className="fas fa-trash"></i>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
