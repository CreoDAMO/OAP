import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AnalyticsCard } from "@/components/analytics-card";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => api.getProjects(),
  });

  const recentProjects = projects?.slice(0, 3) || [];

  if (statsLoading || projectsLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header 
            title="Writing Analytics Dashboard"
            subtitle="AI-powered insights for your writing projects"
          />
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
          title="Writing Analytics Dashboard"
          subtitle="AI-powered insights for your writing projects"
          actions={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <i className="fas fa-download mr-2"></i>Export Report
            </Button>
          }
        />

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Neural Coherence"
              value={stats?.neuralCoherence || 92}
              icon="fas fa-brain"
              color="accent"
            />
            <AnalyticsCard
              title="Market Viability"
              value={stats?.marketViability || 85}
              icon="fas fa-chart-trending-up"
              color="secondary"
            />
            <AnalyticsCard
              title="Voice Signature"
              value={stats?.voiceSignature || 95}
              icon="fas fa-microphone"
              color="primary"
            />
            <AnalyticsCard
              title="Engagement Score"
              value={stats?.engagementScore || 90}
              icon="fas fa-heart"
              color="amber"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AI Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-robot text-blue-600 mr-2"></i>
                  AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-slate-800/5 to-blue-600/5 dark:from-slate-700/20 dark:to-blue-600/20 p-4 rounded-lg border-l-4 border-blue-600">
                  <h4 className="font-mono text-sm text-blue-600 mb-2">🧠 NEURAL ANALYSIS RESULTS</h4>
                  <div className="text-sm space-y-1 font-mono">
                    <div className="border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">──────────────────────────</div>
                    <div>Neural Coherence: <span className="text-green-600 font-semibold">{stats?.neuralCoherence || 92}/100 ⭐ EXCELLENT</span></div>
                    <div>Market Viability: <span className="text-purple-600 font-semibold">{stats?.marketViability || 85}/100 ⭐ STRONG</span></div>
                    <div>Voice Signature: <span className="text-blue-600 font-semibold">{stats?.voiceSignature || 95}/100 ⭐ EXCELLENT</span></div>
                    <div>Engagement Score: <span className="text-amber-600 font-semibold">{stats?.engagementScore || 90}/100 ⭐ EXCELLENT</span></div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs">
                    <div className="text-green-600"><strong>📈 PREDICTION:</strong> High market potential with strong reader engagement</div>
                    <div className="text-blue-600 mt-1"><strong>🎯 RECOMMENDATION:</strong> Ready for advanced editing</div>
                  </div>
                </div>
                <Link href="/analysis">
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                    <i className="fas fa-chart-line mr-2"></i>Generate Full Report
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Royalty Calculator Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-dollar-sign text-green-600 mr-2"></i>
                  Royalty Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-green-600/5 to-amber-600/5 dark:from-green-600/20 dark:to-amber-600/20 p-4 rounded-lg border-l-4 border-green-600">
                  <h4 className="font-mono text-sm text-green-600 mb-2">💰 ROYALTIES BREAKDOWN</h4>
                  <div className="text-xs font-mono space-y-2">
                    <div className="border-b border-gray-200 dark:border-gray-600 pb-1">═══════════════════════════</div>
                    <div className="text-blue-600 font-semibold">📱 DIGITAL PLATFORMS</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="font-semibold">Platform</div>
                      <div className="font-semibold">Royalty</div>
                      <div className="font-semibold">Per Book</div>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-1">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>Amazon KDP</div>
                        <div>70%</div>
                        <div className="text-green-600 font-semibold">$4.90</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                        <div>Neural Books⚡</div>
                        <div>85%</div>
                        <div className="text-green-600 font-semibold">$5.95</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs">
                    <div className="text-green-600 font-semibold">📊 PROJECTIONS</div>
                    <div className="mt-1 space-y-1">
                      <div>• 1K Sales: <span className="text-green-600 font-bold">$5,950</span></div>
                      <div>• 10K Sales: <span className="text-green-600 font-bold">$59,500</span></div>
                      <div>• 100K Sales: <span className="text-green-600 font-bold">$595,000</span></div>
                    </div>
                  </div>
                </div>
                <Link href="/royalty-calculator">
                  <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">
                    <i className="fas fa-calculator mr-2"></i>Model Detailed Scenarios
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <i className="fas fa-folder-open text-purple-600 mr-2"></i>
                  Recent Projects
                </CardTitle>
                <Link href="/editor">
                  <Button variant="outline">
                    <i className="fas fa-plus mr-2"></i>New Project
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-book text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet. Start your first writing project!</p>
                  <Link href="/editor">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <i className="fas fa-plus mr-2"></i>Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Actions */}
      <div className="fixed bottom-6 right-6 space-y-3">
        <Link href="/editor">
          <Button 
            size="icon" 
            className="w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white hover:scale-110 transition-all"
            title="Start New Project"
          >
            <i className="fas fa-plus text-xl"></i>
          </Button>
        </Link>
        <Link href="/analysis">
          <Button 
            size="icon" 
            className="w-14 h-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white hover:scale-110 transition-all"
            title="AI Assistant"
          >
            <i className="fas fa-robot text-xl"></i>
          </Button>
        </Link>
      </div>
    </div>
  );
}
