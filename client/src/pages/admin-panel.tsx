
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
        title: "Login Successful",
        description: `Welcome back, ${data.user.username}!`,
      });
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
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
        title: "Distribution Complete",
        description: "Revenue has been distributed successfully",
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
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  // Login screen
  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">
              <i className="fas fa-shield-alt mr-2"></i>
              ADMIN ACCESS ONLY
            </CardTitle>
            <p className="text-sm text-gray-600">Founder & Developer Portal</p>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                <strong>RESTRICTED AREA:</strong> This panel is exclusively for Jacque Antoine DeGraff, Founder & Developer of OmniAuthor Pro.
              </AlertDescription>
            </Alert>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email / Username</Label>
                <Input
                  id="email"
                  type="text"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jacque@omniauthor.pro"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Admin Secret</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter admin secret key"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key mr-2"></i>
                    Secure Login
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <i className="fas fa-crown text-yellow-500 mr-3"></i>
              FOUNDER CONTROL PANEL
            </h1>
            <p className="text-gray-300">Exclusive access for Jacque Antoine DeGraff</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <i className="fas fa-check-circle mr-2"></i>
              AUTHENTICATED
            </Badge>
            <Button onClick={handleLogout} variant="outline">
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800 text-white">
            <TabsTrigger value="overview">Platform Overview</TabsTrigger>
            <TabsTrigger value="tokenomics">Tokenomics & Revenue</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <i className="fas fa-users text-blue-400 mr-2"></i>
                      User Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-white">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="font-bold">{overview.platform.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Users:</span>
                        <span className="font-bold text-green-400">{overview.platform.activeUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pro Users:</span>
                        <span className="font-bold text-purple-400">{overview.platform.proUsers}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <i className="fas fa-wallet text-green-400 mr-2"></i>
                      Platform Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-white">
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 break-all">
                        {overview.wallet.address}
                      </div>
                      <div className="flex justify-between">
                        <span>ETH Balance:</span>
                        <span className="font-bold">{overview.wallet.balance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OMNI Tokens:</span>
                        <span className="font-bold">{overview.wallet.platformTokens}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <i className="fas fa-server text-orange-400 mr-2"></i>
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-white">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span className="font-bold">{Math.floor(overview.system.uptime / 3600)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Node:</span>
                        <span className="font-bold">{overview.system.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="font-bold">{overview.system.platform}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tokenomics" className="space-y-6">
            {finances && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <i className="fas fa-chart-pie text-green-400 mr-2"></i>
                      Revenue Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-white">
                      <div className="bg-green-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-400 mb-2">Liquidity Pool (50%)</h4>
                        <p className="text-2xl font-bold">{finances.distribution.liquidityPool.amount} ETH</p>
                        <p className="text-sm text-gray-400">{finances.distribution.liquidityPool.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-white">
                      <div className="bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-400 mb-2">Payroll (30%)</h4>
                        <p className="text-2xl font-bold">{finances.distribution.payroll.amount} ETH</p>
                        <p className="text-sm text-gray-400">{finances.distribution.payroll.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-white">
                      <div className="bg-yellow-900/20 p-4 rounded-lg border-2 border-yellow-500">
                        <h4 className="font-semibold text-yellow-400 mb-2">👑 Founder Share (20%)</h4>
                        <p className="text-2xl font-bold">{finances.distribution.founder.amount} ETH</p>
                        <p className="text-sm text-gray-400">{finances.distribution.founder.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <i className="fas fa-hand-holding-usd text-purple-400 mr-2"></i>
                      Manual Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Amount (ETH)</Label>
                      <Input 
                        placeholder="0.5"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">Revenue Type</Label>
                      <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white">
                        <option value="platform_fee">Platform Fee</option>
                        <option value="nft_royalty">NFT Royalty</option>
                      </select>
                    </div>
                    
                    <Button 
                      onClick={() => distributeMutation.mutate({ amount: "1.0", type: "platform_fee" })}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={distributeMutation.isPending}
                    >
                      {distributeMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Distributing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-coins mr-2"></i>
                          Execute Distribution
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <i className="fas fa-cogs text-blue-400 mr-2"></i>
                    Platform Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <i className="fas fa-database mr-2"></i>
                    Database Backup
                  </Button>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <i className="fas fa-sync mr-2"></i>
                    Sync Blockchain Data
                  </Button>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <i className="fas fa-chart-line mr-2"></i>
                    Generate Reports
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <i className="fas fa-shield-alt text-red-400 mr-2"></i>
                    Security Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    <i className="fas fa-lock mr-2"></i>
                    Emergency Lockdown
                  </Button>
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                    <i className="fas fa-eye mr-2"></i>
                    Audit Trail
                  </Button>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <i className="fas fa-key mr-2"></i>
                    Rotate Keys
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <i className="fas fa-list text-gray-400 mr-2"></i>
                  System Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log: any, index: number) => (
                      <div key={index} className="bg-gray-700 p-3 rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={log.level === 'warning' ? 'destructive' : 'secondary'}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-gray-400 text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white">{log.message}</p>
                        {log.data && (
                          <pre className="text-gray-300 text-xs mt-2 bg-gray-900 p-2 rounded">
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
