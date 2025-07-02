import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const platforms = [
  { name: "Amazon KDP", royaltyRate: 70, category: "ebook", isAiOptimized: false },
  { name: "Neural Books", royaltyRate: 85, category: "ebook", isAiOptimized: true },
  { name: "Apple Books", royaltyRate: 70, category: "ebook", isAiOptimized: false },
  { name: "Kobo 2025", royaltyRate: 72, category: "ebook", isAiOptimized: false },
  { name: "Google Play Books", royaltyRate: 70, category: "ebook", isAiOptimized: false },
  { name: "Barnes & Noble", royaltyRate: 65, category: "ebook", isAiOptimized: false },
  { name: "Audible", royaltyRate: 75, category: "audiobook", isAiOptimized: false },
  { name: "Neural Audio", royaltyRate: 88, category: "audiobook", isAiOptimized: true },
  { name: "Spotify Audiobooks", royaltyRate: 70, category: "audiobook", isAiOptimized: false },
  { name: "Apple Audiobooks", royaltyRate: 75, category: "audiobook", isAiOptimized: false },
];

const salesProjections = [1000, 5000, 10000, 25000, 50000, 100000];

export default function RoyaltyCalculator() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>(params.id || "");
  const [ebookPrice, setEbookPrice] = useState("7.99");
  const [audiobookPrice, setAudiobookPrice] = useState("24.99");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(platforms.map(p => p.name));

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => api.getProjects(),
  });

  const { data: project } = useQuery({
    queryKey: ["/api/projects", selectedProjectId],
    queryFn: () => selectedProjectId ? api.getProject(parseInt(selectedProjectId)) : null,
    enabled: !!selectedProjectId,
  });

  const { data: calculations } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "royalties"],
    queryFn: () => selectedProjectId ? api.getRoyaltyCalculations(parseInt(selectedProjectId)) : [],
    enabled: !!selectedProjectId,
  });

  const calculateMutation = useMutation({
    mutationFn: (data: { platforms: any[], bookPrice: string }) => 
      selectedProjectId ? api.calculateRoyalties(parseInt(selectedProjectId), data) : Promise.reject("No project"),
    onSuccess: () => {
      toast({
        title: "Calculations Updated",
        description: "Royalty calculations have been updated successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "royalties"] 
      });
    },
    onError: (error) => {
      toast({
        title: "Calculation Failed",
        description: "Failed to calculate royalties: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleCalculate = () => {
    const activePlatforms = platforms.filter(p => selectedPlatforms.includes(p.name));
    const price = parseFloat(ebookPrice) || 7.99;
    
    calculateMutation.mutate({
      platforms: activePlatforms.map(p => ({
        name: p.name,
        royaltyRate: p.royaltyRate
      })),
      bookPrice: price.toString()
    });
  };

  const togglePlatform = (platformName: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformName) 
        ? prev.filter(p => p !== platformName)
        : [...prev, platformName]
    );
  };

  const getRoyaltyForPlatform = (platformName: string, price: number) => {
    const platform = platforms.find(p => p.name === platformName);
    if (!platform) return 0;
    return (price * platform.royaltyRate) / 100;
  };

  const getTotalProjectedEarnings = (sales: number) => {
    const ebookPlatforms = platforms.filter(p => p.category === "ebook" && selectedPlatforms.includes(p.name));
    const audiobookPlatforms = platforms.filter(p => p.category === "audiobook" && selectedPlatforms.includes(p.name));
    
    const ebookTotal = ebookPlatforms.reduce((sum, platform) => {
      return sum + (getRoyaltyForPlatform(platform.name, parseFloat(ebookPrice) || 7.99) * sales * 0.7); // 70% ebook, 30% audiobook split
    }, 0);
    
    const audiobookTotal = audiobookPlatforms.reduce((sum, platform) => {
      return sum + (getRoyaltyForPlatform(platform.name, parseFloat(audiobookPrice) || 24.99) * sales * 0.3);
    }, 0);
    
    return ebookTotal + audiobookTotal;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Royalty Calculator"
          subtitle="Calculate earnings across publishing platforms"
          actions={
            <Button 
              onClick={handleCalculate}
              disabled={!selectedProjectId || calculateMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {calculateMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Calculating...
                </>
              ) : (
                <>
                  <i className="fas fa-calculator mr-2"></i>
                  Calculate Royalties
                </>
              )}
            </Button>
          }
        />

        <div className="p-6 space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a project for royalty calculations" />
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

          {selectedProjectId && project && (
            <>
              {/* Pricing Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-tag text-blue-600 mr-2"></i>
                      Pricing Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="ebook-price">Ebook Price ($)</Label>
                      <Input
                        id="ebook-price"
                        type="number"
                        step="0.01"
                        value={ebookPrice}
                        onChange={(e) => setEbookPrice(e.target.value)}
                        placeholder="7.99"
                      />
                    </div>
                    <div>
                      <Label htmlFor="audiobook-price">Audiobook Price ($)</Label>
                      <Input
                        id="audiobook-price"
                        type="number"
                        step="0.01"
                        value={audiobookPrice}
                        onChange={(e) => setAudiobookPrice(e.target.value)}
                        placeholder="24.99"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-store text-purple-600 mr-2"></i>
                      Publishing Platforms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {platforms.map((platform) => (
                        <div 
                          key={platform.name}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedPlatforms.includes(platform.name)
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750"
                          }`}
                          onClick={() => togglePlatform(platform.name)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 border-2 rounded ${
                              selectedPlatforms.includes(platform.name)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {selectedPlatforms.includes(platform.name) && (
                                <i className="fas fa-check text-white text-xs"></i>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{platform.name}</span>
                                {platform.isAiOptimized && (
                                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                                    ⚡ AI-Optimized
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {platform.royaltyRate}% • {platform.category}
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            ${getRoyaltyForPlatform(platform.name, 
                              platform.category === "ebook" 
                                ? parseFloat(ebookPrice) || 7.99
                                : parseFloat(audiobookPrice) || 24.99
                            ).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Royalty Breakdown */}
              <Tabs defaultValue="platforms" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="platforms">Platform Breakdown</TabsTrigger>
                  <TabsTrigger value="projections">Sales Projections</TabsTrigger>
                  <TabsTrigger value="terminal">Terminal Output</TabsTrigger>
                </TabsList>

                <TabsContent value="platforms" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Digital Platforms */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <i className="fas fa-mobile-alt text-blue-600 mr-2"></i>
                          📱 Digital Platforms
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {platforms.filter(p => p.category === "ebook" && selectedPlatforms.includes(p.name)).map((platform) => (
                            <div key={platform.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{platform.name}</span>
                                {platform.isAiOptimized && <span className="text-xs">⚡</span>}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500 dark:text-gray-400">{platform.royaltyRate}%</div>
                                <div className="font-semibold text-green-600">
                                  ${getRoyaltyForPlatform(platform.name, parseFloat(ebookPrice) || 7.99).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Audiobook Platforms */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <i className="fas fa-headphones text-purple-600 mr-2"></i>
                          🎧 Audiobook Platforms
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {platforms.filter(p => p.category === "audiobook" && selectedPlatforms.includes(p.name)).map((platform) => (
                            <div key={platform.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{platform.name}</span>
                                {platform.isAiOptimized && <span className="text-xs">⚡</span>}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500 dark:text-gray-400">{platform.royaltyRate}%</div>
                                <div className="font-semibold text-green-600">
                                  ${getRoyaltyForPlatform(platform.name, parseFloat(audiobookPrice) || 24.99).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="projections" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-chart-line text-green-600 mr-2"></i>
                        Sales Projections & Earnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4 font-semibold">Sales Volume</th>
                              <th className="text-right py-3 px-4 font-semibold">Total Earnings</th>
                              <th className="text-right py-3 px-4 font-semibold">Monthly Income*</th>
                              <th className="text-right py-3 px-4 font-semibold">Yearly Income*</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesProjections.map((sales) => {
                              const totalEarnings = getTotalProjectedEarnings(sales);
                              const monthlyIncome = totalEarnings / 12;
                              const yearlyIncome = totalEarnings;
                              
                              return (
                                <tr key={sales} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="py-3 px-4 font-medium">{sales.toLocaleString()} books</td>
                                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                                    ${totalEarnings.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-blue-600">
                                    ${monthlyIncome.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-purple-600">
                                    ${yearlyIncome.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                          * Assumes sales are distributed evenly over time. Actual income may vary based on marketing, seasonality, and platform algorithms.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Best Platform Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-trophy text-amber-600 mr-2"></i>
                        Platform Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                            🏆 Best Ebook Platform
                          </h4>
                          <p className="text-green-700 dark:text-green-300">
                            Neural Books⚡ - 85% royalty rate
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            AI-optimized platform with highest royalty rates
                          </p>
                        </div>
                        
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                            🎧 Best Audiobook Platform
                          </h4>
                          <p className="text-purple-700 dark:text-purple-300">
                            Neural Audio⚡ - 88% royalty rate
                          </p>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            Next-generation AI-powered audiobook platform
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="terminal" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-terminal text-green-600 mr-2"></i>
                        Royalty Analysis Terminal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-black text-green-400 p-6 rounded-lg font-mono text-sm">
                        <div className="mb-4">
                          <span className="text-green-500">$</span> royalty-calculator --project "{project.title}" --analyze-all-platforms
                        </div>
                        <div className="space-y-1">
                          <div>💰 ROYALTIES BREAKDOWN - {project.title}</div>
                          <div>═══════════════════════════════════════</div>
                          <div className="text-blue-300 mt-2">📱 DIGITAL PLATFORMS</div>
                          <div className="grid grid-cols-3 gap-8 text-xs mt-1">
                            <div className="text-gray-300">Platform</div>
                            <div className="text-gray-300">Royalty</div>
                            <div className="text-gray-300">Per Book</div>
                          </div>
                          <div className="border-t border-gray-600 pt-1 mt-1">
                            {platforms.filter(p => p.category === "ebook" && selectedPlatforms.includes(p.name)).map((platform) => (
                              <div key={platform.name} className="grid grid-cols-3 gap-8 text-xs">
                                <div className="flex items-center">
                                  {platform.name}{platform.isAiOptimized && <span className="text-yellow-400">⚡</span>}
                                </div>
                                <div>{platform.royaltyRate}%</div>
                                <div className="text-green-300 font-semibold">
                                  ${getRoyaltyForPlatform(platform.name, parseFloat(ebookPrice) || 7.99).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="text-purple-300 mt-4">🎧 AUDIOBOOK PLATFORMS</div>
                          <div className="border-t border-gray-600 pt-1 mt-1">
                            {platforms.filter(p => p.category === "audiobook" && selectedPlatforms.includes(p.name)).map((platform) => (
                              <div key={platform.name} className="grid grid-cols-3 gap-8 text-xs">
                                <div className="flex items-center">
                                  {platform.name}{platform.isAiOptimized && <span className="text-yellow-400">⚡</span>}
                                </div>
                                <div>{platform.royaltyRate}%</div>
                                <div className="text-green-300 font-semibold">
                                  ${getRoyaltyForPlatform(platform.name, parseFloat(audiobookPrice) || 24.99).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="text-green-300 mt-4">📊 PROJECTIONS</div>
                          {salesProjections.slice(0, 3).map((sales) => (
                            <div key={sales} className="text-xs">
                              • {sales.toLocaleString()} Sales: <span className="text-green-300 font-bold">${getTotalProjectedEarnings(sales).toFixed(0)}</span>
                            </div>
                          ))}
                          
                          <div className="mt-4 text-yellow-400">
                            ⚡ = AI-Optimized Platforms (higher conversion rates)
                          </div>
                          <div className="mt-2 text-gray-400">
                            Analysis completed using 2025 platform royalty rates
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
