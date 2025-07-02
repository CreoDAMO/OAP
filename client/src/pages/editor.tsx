import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, Project } from "@/lib/api";

const genres = [
  "Science Fiction",
  "Fantasy", 
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Self-Help",
  "Technology",
  "Biography",
  "History",
  "Other"
];

export default function Editor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const projectId = params.id ? parseInt(params.id) : null;
  const isEditing = projectId !== null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [genre, setGenre] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [improvementType, setImprovementType] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId],
    queryFn: () => projectId ? api.getProject(projectId) : null,
    enabled: isEditing,
  });

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setContent(project.content);
      setGenre(project.genre || "");
    }
  }, [project]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Project>) => api.createProject(data),
    onSuccess: (newProject) => {
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });
      setLocation(`/editor/${newProject.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Project>) => 
      projectId ? api.updateProject(projectId, data) : Promise.reject("No project ID"),
    onSuccess: () => {
      toast({
        title: "Project Saved",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save project: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({ prompt, style }: { prompt: string; style?: string }) => 
      api.generateText(prompt, style),
    onSuccess: (result) => {
      setContent(prev => prev + "\n\n" + result.text);
      toast({
        title: "Content Generated",
        description: "AI-generated content has been added to your project.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate content: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const improveMutation = useMutation({
    mutationFn: ({ text, type }: { text: string; type: string }) => 
      api.improveText(text, type),
    onSuccess: (result) => {
      setContent(result.text);
      toast({
        title: "Content Improved",
        description: "Your content has been enhanced by AI.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to improve content: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const projectData = { title, content, genre };
    
    if (isEditing) {
      updateMutation.mutate(projectData);
    } else {
      createMutation.mutate(projectData);
    }
  };

  const handleGenerate = () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for AI generation.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({ prompt: aiPrompt, style: genre });
  };

  const handleImprove = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content before improving it.",
        variant: "destructive",
      });
      return;
    }
    if (!improvementType) {
      toast({
        title: "Error",
        description: "Please select an improvement type.",
        variant: "destructive",
      });
      return;
    }
    improveMutation.mutate({ text: content, type: improvementType });
  };

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title={isEditing ? "Edit Project" : "New Project"}
          subtitle={isEditing ? `Editing: ${project?.title}` : "Create your next masterpiece"}
          actions={
            <div className="flex space-x-2">
              <Button 
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <i className="fas fa-save mr-2"></i>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
              {isEditing && (
                <Button 
                  onClick={() => setLocation(`/analysis/${projectId}`)}
                  variant="outline"
                >
                  <i className="fas fa-chart-line mr-2"></i>
                  Analyze
                </Button>
              )}
            </div>
          }
        />

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Editor */}
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter your project title..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="content">Content</Label>
                      <span className="text-sm text-gray-500">
                        {wordCount.toLocaleString()} words
                      </span>
                    </div>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Start writing your masterpiece..."
                      className="min-h-[400px] font-mono text-sm leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Tools Sidebar */}
            <div className="space-y-6">
              {/* AI Generator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-robot text-blue-600 mr-2"></i>
                    AI Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-prompt">Prompt</Label>
                    <Textarea
                      id="ai-prompt"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe what you want to generate..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button 
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic mr-2"></i>
                        Generate
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* AI Improver */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-wand-magic-sparkles text-purple-600 mr-2"></i>
                    AI Improver
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="improvement-type">Improvement Type</Label>
                    <Select value={improvementType} onValueChange={setImprovementType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select improvement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clarity">Clarity & Flow</SelectItem>
                        <SelectItem value="engagement">Reader Engagement</SelectItem>
                        <SelectItem value="dialogue">Dialogue</SelectItem>
                        <SelectItem value="description">Descriptions</SelectItem>
                        <SelectItem value="pacing">Pacing</SelectItem>
                        <SelectItem value="grammar">Grammar & Style</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleImprove}
                    disabled={improveMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {improveMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Improving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sparkles mr-2"></i>
                        Improve
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-chart-bar text-green-600 mr-2"></i>
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Words</span>
                    <span className="font-semibold">{wordCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Characters</span>
                    <span className="font-semibold">{content.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Paragraphs</span>
                    <span className="font-semibold">{content.split('\n\n').filter(p => p.trim()).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reading Time</span>
                    <span className="font-semibold">{Math.ceil(wordCount / 200)} min</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
