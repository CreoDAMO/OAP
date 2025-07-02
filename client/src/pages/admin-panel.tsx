
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface AdminAuth {
  token: string;
  user: {
    email: string;
    username: string;
    role: string;
  };
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState<AdminAuth | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [distributionAmount, setDistributionAmount] = useState("1.0");
  const [distributionType, setDistributionType] = useState("platform_fee");

  // Check for existing auth
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth) {
      setAuth(JSON.parse(savedAuth));
    }
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAuth(data);
      localStorage.setItem('admin_auth', JSON.stringify(data));
      toast({
        title: "🚀 Access Granted",
        description: `Welcome back, ${data.user.username}! Supreme control is now active.`,
      });
    },
    onError: () => {
      toast({
        title: "❌ Access Denied",
        description: "Invalid credentials. Founder access only.",
        variant: "destructive",
      });
    }
  });

  // Fetch admin data with auth headers
  const fetchWithAuth = (url: string) => 
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${auth?.token}`,
        'Content-Type': 'application/json'
      }
    }).then(res => {
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    });

  // Platform overview query
  const { data: overview } = useQuery({
    queryKey: ['/api/admin/overview'],
    queryFn: () => fetchWithAuth('/api/admin/overview'),
    enabled: !!auth?.token
  });

  // Financial data query
  const { data: finances } = useQuery({
    queryKey: ['/api/admin/finances'],
    queryFn: () => fetchWithAuth('/api/admin/finances'),
    enabled: !!auth?.token
  });

  // System logs query
  const { data: logs } = useQuery({
    queryKey: ['/api/admin/logs'],
    queryFn: () => fetchWithAuth('/api/admin/logs'),
    enabled: !!auth?.token
  });

  // Manual distribution mutation
  const distributeMutation = useMutation({
    mutationFn: async (data: { amount: string; type: string }) => {
      const response = await fetch('/api/admin/distribute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "💰 Distribution Complete",
        description: "Revenue has been distributed across all vaults",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/finances'] });
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await loginMutation.mutateAsync(loginForm);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('admin_auth');
    toast({
      title: "🔒 Session Terminated",
      description: "Secure logout complete",
    });
  };

  const handleDistribution = () => {
    distributeMutation.mutate({
      amount: distributionAmount,
      type: distributionType
    });
  };

  // Login screen with modern design
  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md mx-4">
          <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-700 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <i className="fas fa-crown text-white text-2xl"></i>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                FOUNDER PORTAL
              </CardTitle>
              <p className="text-gray-400">Exclusive Access • Jacque Antoine DeGraff</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-500/20 bg-red-500/10">
                <i className="fas fa-shield-alt text-red-400"></i>
                <AlertDescription className="text-red-300 ml-2">
                  <strong>RESTRICTED ZONE:</strong> Supreme admin access only
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Admin Identity</Label>
                  <Input
                    id="email"
                    type="text"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="jacque@omniauthor.pro"
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Security Key</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••••••"
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-unlock mr-2"></i>
                      Access Control Center
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Enhanced admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header with glass morphism */}
      <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <i className="fas fa-crown text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">FOUNDER COMMAND CENTER</h1>
                <p className="text-gray-400">Complete platform control • Jacque Antoine DeGraff</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <i className="fas fa-check-circle mr-2"></i>
                AUTHENTICATED
              </Badge>
              <Button onClick={handleLogout} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              <i className="fas fa-chart-line mr-2"></i>Overview
            </TabsTrigger>
            <TabsTrigger value="paymaster" className="data-[state=active]:bg-green-600">
              <i className="fas fa-wallet mr-2"></i>Paymaster
            </TabsTrigger>
            <TabsTrigger value="tokenomics" className="data-[state=active]:bg-purple-600">
              <i className="fas fa-coins mr-2"></i>Tokenomics
            </TabsTrigger>
            <TabsTrigger value="operations" className="data-[state=active]:bg-orange-600">
              <i className="fas fa-cogs mr-2"></i>Operations
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-red-600">
              <i className="fas fa-list mr-2"></i>System Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-sm">
                      <i className="fas fa-users text-blue-400 mr-2"></i>
                      Platform Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-2">{overview.platform.totalUsers}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Active:</span>
                        <span className="text-green-400">{overview.platform.activeUsers}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Pro:</span>
                        <span className="text-purple-400">{overview.platform.proUsers}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-sm">
                      <i className="fas fa-server text-orange-400 mr-2"></i>
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400 mb-2">ONLINE</div>
                    <div className="space-y-1 text-sm text-gray-400">
                      <div>Uptime: {Math.floor(overview.system.uptime / 3600)}h</div>
                      <div>Node: {overview.system.nodeVersion}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-sm">
                      <i className="fas fa-wallet text-green-400 mr-2"></i>
                      Platform Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white mb-2">{overview.wallet?.balance || "0"} ETH</div>
                    <div className="text-xs text-gray-400 break-all mb-2">
                      {overview.wallet?.address || "Not connected"}
                    </div>
                    <div className="text-sm text-purple-400">
                      {overview.wallet?.platformTokens || "0"} OMNI
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center text-sm">
                      <i className="fas fa-chart-bar text-yellow-400 mr-2"></i>
                      Revenue Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-400 mb-2">2.4 ETH</div>
                    <div className="text-sm text-green-400">+12% vs yesterday</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="paymaster" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Paymaster Vault Status */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <i className="fas fa-vault text-green-400 mr-3"></i>
                    Paymaster Vault Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/20">
                      <div className="text-green-400 text-sm font-medium">Vault Balance</div>
                      <div className="text-2xl font-bold text-white">45.7 ETH</div>
                      <div className="text-xs text-gray-400">≈ $127,430 USD</div>
                    </div>
                    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/20">
                      <div className="text-blue-400 text-sm font-medium">Reserved Funds</div>
                      <div className="text-2xl font-bold text-white">15.2 ETH</div>
                      <div className="text-xs text-gray-400">For gas & operations</div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Liquidity Pool Allocation</span>
                      <span className="text-green-400 font-semibold">50%</span>
                    </div>
                    <Progress value={50} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Operational Reserve</span>
                      <span className="text-blue-400 font-semibold">30%</span>
                    </div>
                    <Progress value={30} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Founder Allocation</span>
                      <span className="text-yellow-400 font-semibold">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Paymaster Controls */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <i className="fas fa-sliders-h text-orange-400 mr-3"></i>
                    Paymaster Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <i className="fas fa-plus mr-2"></i>
                      Add Funds
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <i className="fas fa-exchange-alt mr-2"></i>
                      Rebalance
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <i className="fas fa-shield-alt mr-2"></i>
                      Secure Mode
                    </Button>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <i className="fas fa-history mr-2"></i>
                      View History
                    </Button>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="space-y-3">
                    <Label className="text-gray-300">Emergency Distribution</Label>
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="Amount (ETH)"
                        value={distributionAmount}
                        onChange={(e) => setDistributionAmount(e.target.value)}
                        className="bg-gray-700/50 border-gray-600 text-white"
                      />
                      <select 
                        value={distributionType}
                        onChange={(e) => setDistributionType(e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      >
                        <option value="platform_fee">Platform Fee</option>
                        <option value="nft_royalty">NFT Royalty</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <Button 
                      onClick={handleDistribution}
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={distributeMutation.isPending}
                    >
                      {distributeMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane mr-2"></i>
                          Execute Distribution
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <i className="fas fa-receipt text-purple-400 mr-3"></i>
                  Recent Paymaster Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "LP Allocation", amount: "5.2 ETH", time: "2 mins ago", status: "confirmed" },
                    { type: "Payroll Transfer", amount: "3.1 ETH", time: "15 mins ago", status: "confirmed" },
                    { type: "Founder Distribution", amount: "2.1 ETH", time: "1 hour ago", status: "confirmed" },
                    { type: "Gas Refill", amount: "0.5 ETH", time: "3 hours ago", status: "confirmed" }
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${tx.status === 'confirmed' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <div>
                          <div className="text-white font-medium">{tx.type}</div>
                          <div className="text-gray-400 text-sm">{tx.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{tx.amount}</div>
                        <Badge variant="outline" className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokenomics" className="space-y-6">
            {finances && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/20 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center">
                      <i className="fas fa-swimming-pool mr-2"></i>
                      Liquidity Pool (50%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-2">{finances.distribution.liquidityPool.amount} ETH</div>
                    <p className="text-green-300 text-sm">{finances.distribution.liquidityPool.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Pool Health:</span>
                        <span className="text-green-400">Excellent</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">APY:</span>
                        <span className="text-green-400">12.4%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-500/20 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center">
                      <i className="fas fa-briefcase mr-2"></i>
                      Operations (30%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-2">{finances.distribution.payroll.amount} ETH</div>
                    <p className="text-blue-300 text-sm">{finances.distribution.payroll.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Monthly Burn:</span>
                        <span className="text-blue-400">2.1 ETH</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Runway:</span>
                        <span className="text-blue-400">18 months</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-800/20 border-yellow-500/20 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 flex items-center">
                      <i className="fas fa-crown mr-2"></i>
                      Founder (20%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-2">{finances.distribution.founder.amount} ETH</div>
                    <p className="text-yellow-300 text-sm">{finances.distribution.founder.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">This Month:</span>
                        <span className="text-yellow-400">+15.2%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-yellow-400">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Database Backup", icon: "database", color: "blue", desc: "Secure platform data" },
                { title: "Blockchain Sync", icon: "sync", color: "green", desc: "Update chain data" },
                { title: "Generate Reports", icon: "chart-line", color: "purple", desc: "Analytics export" },
                { title: "Emergency Lock", icon: "lock", color: "red", desc: "Platform lockdown" },
                { title: "Security Audit", icon: "shield-alt", color: "orange", desc: "System scan" },
                { title: "Cache Clear", icon: "trash", color: "gray", desc: "Clear all caches" }
              ].map((op, i) => (
                <Card key={i} className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-${op.color}-500/20 rounded-full flex items-center justify-center`}>
                      <i className={`fas fa-${op.icon} text-${op.color}-400 text-2xl`}></i>
                    </div>
                    <h3 className="text-white font-semibold mb-2">{op.title}</h3>
                    <p className="text-gray-400 text-sm">{op.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <i className="fas fa-terminal text-green-400 mr-3"></i>
                  Live System Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs && (
                  <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
                    {logs.map((log: any, index: number) => (
                      <div key={index} className="bg-gray-900/50 p-3 rounded border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={log.level === 'warning' ? 'destructive' : 'secondary'} className="text-xs">
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-gray-400 text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-green-400">{log.message}</p>
                        {log.data && (
                          <pre className="text-gray-400 text-xs mt-2 bg-black/30 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
