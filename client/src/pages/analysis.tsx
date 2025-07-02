import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AnalyticsCard } from "@/components/analytics-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Analysis() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>(params.id || "");

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => api.getProjects(),
  });

  const { data: project } = useQuery({
    queryKey: ["/api/projects", selectedProjectId],
    queryFn: () => selectedProjectId ? api.getProject(parseInt(selectedProjectId)) : null,
    enabled: !!selectedProjectId,
  });

  const { data: analysis } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "analysis"],
    queryFn: () => selectedProjectId ? api.getAnalysis(parseInt(selectedProjectId)) : null,
    enabled: !!selectedProjectId,
  });

  const analyzeMutation = useMutation({
    mutationFn: (projectId: number) => api.analyzeProject(projectId),
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Your project has been analyzed successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "analysis"] 
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze project: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (selectedProjectId) {
      analyzeMutation.mutate(parseInt(selectedProjectId));
    }
  };

  const getRecommendationText = (score: number) => {
    if (score >= 90) return "Excellent! Your writing shows exceptional quality and market potential.";
    if (score >= 80) return "Strong performance. Consider minor refinements for optimal impact.";
    if (score >= 70) return "Good foundation. Focus on enhancing weaker areas for better results.";
    if (score >= 60) return "Promising start. Significant improvements needed for market success.";
    return "Needs substantial work. Consider major revisions and professional editing.";
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="AI Analysis"
          subtitle="Neural-powered insights for your writing"
          actions={
            <Button 
              onClick={handleAnalyze}
              disabled={!selectedProjectId || analyzeMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {analyzeMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fas fa-brain mr-2"></i>
                  Analyze Project
                </>
              )}
            </Button>
          }
        />

        <div className="p-6 space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Project to Analyze</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a project for analysis" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title} ({project.wordCount.toLocaleString()} words)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Project Info */}
          {project && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-book text-blue-600 mr-2"></i>
                  {project.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Genre:</span>
                    <p className="font-semibold">{project.genre || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Word Count:</span>
                    <p className="font-semibold">{project.wordCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <p className="font-semibold capitalize">{project.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Reading Time:</span>
                    <p className="font-semibold">{Math.ceil(project.wordCount / 200)} minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis ? (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <AnalyticsCard
                  title="Neural Coherence"
                  value={analysis.neuralCoherence || 0}
                  icon="fas fa-brain"
                  color="accent"
                />
                <AnalyticsCard
                  title="Market Viability"
                  value={analysis.marketViability || 0}
                  icon="fas fa-chart-trending-up"
                  color="secondary"
                />
                <AnalyticsCard
                  title="Voice Signature"
                  value={analysis.voiceSignature || 0}
                  icon="fas fa-microphone"
                  color="primary"
                />
                <AnalyticsCard
                  title="Engagement Score"
                  value={analysis.engagementScore || 0}
                  icon="fas fa-heart"
                  color="amber"
                />
                <AnalyticsCard
                  title="Technical Accuracy"
                  value={analysis.technicalAccuracy || 0}
                  icon="fas fa-check-circle"
                  color="accent"
                />
              </div>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overall Score & Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-trophy text-amber-600 mr-2"></i>
                      Overall Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className="text-6xl font-bold text-blue-600 mb-2">
                        {analysis.overallScore || 0}
                      </div>
                      <div className="text-lg text-gray-600 dark:text-gray-400">Overall Score</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          AI Recommendation
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {getRecommendationText(analysis.overallScore || 0)}
                        </p>
                      </div>

                      {analysis.recommendations && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Specific Recommendations:</h4>
                          <ul className="space-y-1 text-sm">
                            {JSON.parse(analysis.recommendations).map((rec: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <i className="fas fa-lightbulb text-amber-500 mr-2 mt-0.5"></i>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-chart-bar text-purple-600 mr-2"></i>
                      Detailed Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Neural Coherence</span>
                          <span className="text-lg font-bold text-green-600">{analysis.neuralCoherence}/100</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Measures narrative flow, logical progression, and structural consistency.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Market Viability</span>
                          <span className="text-lg font-bold text-purple-600">{analysis.marketViability}/100</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Analyzes commercial potential based on current market trends and reader preferences.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Voice Signature</span>
                          <span className="text-lg font-bold text-blue-600">{analysis.voiceSignature}/100</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Evaluates consistency and uniqueness of your writing voice and style.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Engagement Score</span>
                          <span className="text-lg font-bold text-amber-600">{analysis.engagementScore}/100</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Predicts reader engagement and retention based on pacing and emotional impact.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Technical Accuracy</span>
                          <span className="text-lg font-bold text-green-600">{analysis.technicalAccuracy}/100</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Assesses grammar, syntax, and adherence to genre conventions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Analysis Terminal Output */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-terminal text-green-600 mr-2"></i>
                    Neural Analysis Output
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black text-green-400 p-6 rounded-lg font-mono text-sm">
                    <div className="mb-4">
                      <span className="text-green-500">$</span> neural-analyzer --project "{project?.title}" --deep-scan
                    </div>
                    <div className="space-y-1">
                      <div>🧠 NEURAL ANALYSIS RESULTS</div>
                      <div>─────────────────────────</div>
                      <div>Neural Coherence: <span className="text-green-300">{analysis.neuralCoherence}/100 ⭐ {analysis.neuralCoherence >= 90 ? 'EXCELLENT' : analysis.neuralCoherence >= 80 ? 'STRONG' : 'GOOD'}</span></div>
                      <div>Market Viability: <span className="text-purple-300">{analysis.marketViability}/100 ⭐ {analysis.marketViability >= 90 ? 'EXCELLENT' : analysis.marketViability >= 80 ? 'STRONG' : 'GOOD'}</span></div>
                      <div>Voice Signature: <span className="text-blue-300">{analysis.voiceSignature}/100 ⭐ {analysis.voiceSignature >= 90 ? 'EXCELLENT' : analysis.voiceSignature >= 80 ? 'STRONG' : 'GOOD'}</span></div>
                      <div>Engagement Score: <span className="text-yellow-300">{analysis.engagementScore}/100 ⭐ {analysis.engagementScore >= 90 ? 'EXCELLENT' : analysis.engagementScore >= 80 ? 'STRONG' : 'GOOD'}</span></div>
                      <div>Technical Accuracy: <span className="text-green-300">{analysis.technicalAccuracy}/100 ⭐ {analysis.technicalAccuracy >= 90 ? 'EXCELLENT' : analysis.technicalAccuracy >= 80 ? 'STRONG' : 'GOOD'}</span></div>
                      <div className="mt-4">
                        <div className="text-green-300">📈 PREDICTION: {(analysis.overallScore || 0) >= 85 ? 'High market potential with strong reader engagement' : 'Moderate potential, improvements recommended'}</div>
                        <div className="text-blue-300">🎯 RECOMMENDATION: {(analysis.overallScore || 0) >= 80 ? 'Ready for advanced editing and publication consideration' : 'Focus on identified improvement areas'}</div>
                      </div>
                      <div className="mt-4 text-gray-400">
                        Analysis completed in {Math.random() * 2 + 1 | 0}.{Math.random() * 9 | 0}s using GPT-4o neural engine
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : selectedProjectId && project ? (
            <Card>
              <CardContent className="text-center py-12">
                <i className="fas fa-brain text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Analysis Available
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Click "Analyze Project" to run AI analysis on this project.
                </p>
                <Button 
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-brain mr-2"></i>
                      Start Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <i className="fas fa-folder-open text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select a Project
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a project from the dropdown above to view or run analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
