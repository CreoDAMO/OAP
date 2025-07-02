
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from "@/lib/api";

interface MarketInsight {
  genre: string;
  marketSize: number;
  growth: number;
  competition: 'low' | 'medium' | 'high';
  avgRoyalty: number;
  topPlatforms: string[];
  seasonalTrends: any[];
}

interface WritingMetrics {
  dailyWordCount: any[];
  productivityScore: number;
  writingStreak: number;
  avgSessionLength: number;
  peakHours: string[];
  weeklyGoalProgress: number;
}

interface ReaderEngagement {
  totalReads: number;
  avgRating: number;
  completionRate: number;
  shareRate: number;
  commentSentiment: number;
  demographicBreakdown: any[];
}

interface CompetitorAnalysis {
  competitors: Array<{
    name: string;
    marketShare: number;
    avgPrice: number;
    rating: number;
    uniqueFeatures: string[];
  }>;
  positioningMap: any[];
  marketGaps: string[];
}

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedGenre, setSelectedGenre] = useState("all");
  
  const { data: marketInsights } = useQuery({
    queryKey: ["/api/analytics/market-insights", selectedGenre],
    queryFn: () => api.getMarketInsights(selectedGenre),
  });

  const { data: writingMetrics } = useQuery({
    queryKey: ["/api/analytics/writing-metrics", timeRange],
    queryFn: () => api.getWritingMetrics(timeRange),
  });

  const { data: readerEngagement } = useQuery({
    queryKey: ["/api/analytics/reader-engagement", timeRange],
    queryFn: () => api.getReaderEngagement(timeRange),
  });

  const { data: competitorAnalysis } = useQuery({
    queryKey: ["/api/analytics/competitor-analysis", selectedGenre],
    queryFn: () => api.getCompetitorAnalysis(selectedGenre),
  });

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">Deep insights into your writing performance and market opportunities</p>
          </div>
          <div className="flex space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="fiction">Fiction</SelectItem>
                <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                <SelectItem value="sci-fi">Science Fiction</SelectItem>
                <SelectItem value="romance">Romance</SelectItem>
                <SelectItem value="mystery">Mystery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <i className="fas fa-dollar-sign text-green-600"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,847</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+23%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Readers</CardTitle>
              <i className="fas fa-users text-blue-600"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Writing Streak</CardTitle>
              <i className="fas fa-fire text-orange-600"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{writingMetrics?.writingStreak || 0} days</div>
              <p className="text-xs text-muted-foreground">
                Personal best: 47 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Position</CardTitle>
              <i className="fas fa-chart-line text-purple-600"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Top 15%</div>
              <p className="text-xs text-muted-foreground">
                In your genre category
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="market" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="market">Market Intelligence</TabsTrigger>
            <TabsTrigger value="writing">Writing Performance</TabsTrigger>
            <TabsTrigger value="engagement">Reader Engagement</TabsTrigger>
            <TabsTrigger value="competition">Competitive Analysis</TabsTrigger>
          </TabsList>

          {/* Market Intelligence Tab */}
          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Size & Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={marketInsights?.seasonalTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="marketSize" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="growth" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Genre Competition Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Fiction', 'Romance', 'Mystery', 'Sci-Fi', 'Non-Fiction'].map((genre, index) => (
                      <div key={genre} className="flex items-center justify-between">
                        <span className="font-medium">{genre}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                index % 3 === 0 ? 'bg-red-500' : 
                                index % 3 === 1 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.random() * 100}%` }}
                            ></div>
                          </div>
                          <Badge variant={index % 3 === 0 ? 'destructive' : index % 3 === 1 ? 'default' : 'secondary'}>
                            {index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Amazon KDP', value: 45, color: '#8884d8' },
                          { name: 'Apple Books', value: 25, color: '#82ca9d' },
                          { name: 'Google Play', value: 15, color: '#ffc658' },
                          { name: 'Kobo', value: 10, color: '#ff7300' },
                          { name: 'Other', value: 5, color: '#8dd1e1' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Amazon KDP', value: 45, color: '#8884d8' },
                          { name: 'Apple Books', value: 25, color: '#82ca9d' },
                          { name: 'Google Play', value: 15, color: '#ffc658' },
                          { name: 'Kobo', value: 10, color: '#ff7300' },
                          { name: 'Other', value: 5, color: '#8dd1e1' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-700">Emerging Trend</h4>
                      <p className="text-sm text-gray-600">Climate fiction (Cli-Fi) showing 300% growth</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-700">Underserved Market</h4>
                      <p className="text-sm text-gray-600">Tech thrillers for 25-35 demographic</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-purple-700">Seasonal Opportunity</h4>
                      <p className="text-sm text-gray-600">Horror/thriller demand peaks in October</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Writing Performance Tab */}
          <TabsContent value="writing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Writing Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={writingMetrics?.dailyWordCount || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="wordCount" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="goal" stroke="#82ca9d" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productivity Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Productivity Score</span>
                        <span className="text-2xl font-bold text-blue-600">{writingMetrics?.productivityScore || 85}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${writingMetrics?.productivityScore || 85}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Peak Writing Hours</h4>
                      <div className="flex flex-wrap gap-2">
                        {(writingMetrics?.peakHours || ['9 AM', '2 PM', '8 PM']).map((hour) => (
                          <Badge key={hour} variant="secondary">{hour}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Average Session</h4>
                      <p className="text-2xl font-bold text-green-600">{writingMetrics?.avgSessionLength || 47} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Writing Streak Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 49 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-sm ${
                          Math.random() > 0.3 ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                        title={`Day ${i + 1}`}
                      ></div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-sm text-gray-600">
                    <span>7 weeks ago</span>
                    <span>Today</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Goal Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Words Written</span>
                      <span className="font-bold">8,400 / 10,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                    <p className="text-sm text-gray-600">1,600 words to reach your weekly goal</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reader Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reader Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={readerEngagement?.demographicBreakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ageGroup" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">{readerEngagement?.avgRating || 4.2}</div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                      <div className="flex justify-center mt-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <i key={i} className={`fas fa-star ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{readerEngagement?.completionRate || 78}%</div>
                        <div className="text-sm text-gray-600">Completion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{readerEngagement?.shareRate || 23}%</div>
                        <div className="text-sm text-gray-600">Share Rate</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comment Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Positive', value: 65, color: '#10b981' },
                          { name: 'Neutral', value: 25, color: '#6b7280' },
                          { name: 'Negative', value: 10, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: 'Positive', value: 65, color: '#10b981' },
                          { name: 'Neutral', value: 25, color: '#6b7280' },
                          { name: 'Negative', value: 10, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reading Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Peak Reading Times</h4>
                      <div className="flex space-x-2">
                        <Badge>Evening (7-10 PM)</Badge>
                        <Badge>Weekend Mornings</Badge>
                        <Badge>Lunch Break</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Popular Devices</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Mobile</span>
                          <span className="font-semibold">65%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>E-Reader</span>
                          <span className="font-semibold">25%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Desktop</span>
                          <span className="font-semibold">10%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Competitive Analysis Tab */}
          <TabsContent value="competition" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Position Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm font-medium">High Quality</div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-medium">Low Quality</div>
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium">Low Price</div>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-sm font-medium">High Price</div>
                    
                    {/* Your position */}
                    <div className="absolute top-20 right-24 w-4 h-4 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-blue-600">You</div>
                    </div>
                    
                    {/* Competitors */}
                    {['A', 'B', 'C', 'D'].map((comp, i) => (
                      <div 
                        key={comp}
                        className="absolute w-3 h-3 bg-gray-400 rounded-full"
                        style={{
                          top: `${Math.random() * 60 + 10}%`,
                          left: `${Math.random() * 60 + 10}%`
                        }}
                      >
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs">{comp}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitor Benchmarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(competitorAnalysis?.competitors || []).slice(0, 4).map((competitor, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{competitor.name}</h4>
                          <Badge variant={competitor.marketShare > 20 ? 'destructive' : 'secondary'}>
                            {competitor.marketShare}% market share
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Avg Price:</span>
                            <span className="font-semibold ml-2">${competitor.avgPrice}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Rating:</span>
                            <span className="font-semibold ml-2">{competitor.rating}/5</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Gaps & Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(competitorAnalysis?.marketGaps || [
                      'Interactive fiction for mobile platforms',
                      'AI-assisted personalized narratives', 
                      'Multi-language romance novels',
                      'Podcast-first storytelling formats'
                    ]).map((gap, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="font-medium">{gap}</p>
                          <p className="text-sm text-gray-600">Estimated market size: ${Math.floor(Math.random() * 500 + 100)}K</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitive Advantages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>AI-powered writing assistance</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>Real-time collaboration features</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>Blockchain IP protection</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-check-circle text-green-500"></i>
                      <span>Advanced analytics dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                      <span>Need: Better mobile experience</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
