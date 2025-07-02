
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AgentStatus {
  config: {
    enabled: boolean;
    autoTrade: boolean;
    autoDistribute: boolean;
    autoBridge: boolean;
    riskLevel: string;
    maxTradeAmount: string;
  };
  activeActions: Array<{
    id: string;
    type: string;
    status: string;
    timestamp: string;
  }>;
  recentActions: Array<{
    id: string;
    type: string;
    status: string;
    result?: any;
    error?: string;
    timestamp: string;
  }>;
  performance: {
    totalActions: number;
    successRate: number;
    totalValueProcessed: string;
    avgExecutionTime: number;
  };
}

export default function AgentKitPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<any>({});

  // Fetch agent status
  const { data: agentStatus } = useQuery<AgentStatus>({
    queryKey: ['/api/admin/agent/status'],
    queryFn: () => 
      fetch('/api/admin/agent/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_auth') ? JSON.parse(localStorage.getItem('admin_auth')!).token : ''}`,
        }
      }).then(res => res.json()),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await fetch('/api/admin/agent/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_auth') ? JSON.parse(localStorage.getItem('admin_auth')!).token : ''}`,
        },
        body: JSON.stringify(config)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🤖 Agent Updated",
        description: "Agent configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agent/status'] });
    }
  });

  // Execute action mutation
  const executeActionMutation = useMutation({
    mutationFn: async ({ action, params }: { action: string; params?: any }) => {
      const response = await fetch('/api/admin/agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_auth') ? JSON.parse(localStorage.getItem('admin_auth')!).token : ''}`,
        },
        body: JSON.stringify({ action, params })
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "🚀 Action Executed",
        description: `Agent successfully executed ${variables.action} operation`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agent/status'] });
    }
  });

  useEffect(() => {
    if (agentStatus?.config) {
      setLocalConfig(agentStatus.config);
    }
  }, [agentStatus]);

  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = { ...localConfig, [key]: value };
    setLocalConfig(updatedConfig);
    updateConfigMutation.mutate(updatedConfig);
  };

  const executeAction = (action: string, params?: any) => {
    executeActionMutation.mutate({ action, params });
  };

  if (!agentStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-robot text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-400">Loading Agent Kit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-400 flex items-center text-sm">
              <i className="fas fa-robot mr-2"></i>
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${agentStatus.config.enabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white font-semibold">
                {agentStatus.config.enabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-cyan-300 text-sm mt-2">
              Autonomous Operations {agentStatus.config.enabled ? 'Online' : 'Offline'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 flex items-center text-sm">
              <i className="fas fa-chart-line mr-2"></i>
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {agentStatus.performance.successRate.toFixed(1)}%
            </div>
            <Progress value={agentStatus.performance.successRate} className="h-2" />
            <p className="text-green-300 text-sm mt-2">
              {agentStatus.performance.totalActions} total actions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-400 flex items-center text-sm">
              <i className="fas fa-coins mr-2"></i>
              Value Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {agentStatus.performance.totalValueProcessed}
            </div>
            <p className="text-purple-300 text-sm">
              Total platform value managed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-400 flex items-center text-sm">
              <i className="fas fa-clock mr-2"></i>
              Avg Execution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {agentStatus.performance.avgExecutionTime}s
            </div>
            <p className="text-orange-300 text-sm">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Configuration */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-cogs text-cyan-400 mr-3"></i>
            Agent Configuration & Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Autonomous Features</h4>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div>
                  <Label className="text-gray-300">Master Control</Label>
                  <p className="text-sm text-gray-400">Enable/disable all agent operations</p>
                </div>
                <Switch
                  checked={localConfig.enabled}
                  onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div>
                  <Label className="text-gray-300">Auto Trading</Label>
                  <p className="text-sm text-gray-400">Automated market making</p>
                </div>
                <Switch
                  checked={localConfig.autoTrade}
                  onCheckedChange={(checked) => handleConfigChange('autoTrade', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div>
                  <Label className="text-gray-300">Auto Distribution</Label>
                  <p className="text-sm text-gray-400">Revenue distribution (50/30/20)</p>
                </div>
                <Switch
                  checked={localConfig.autoDistribute}
                  onCheckedChange={(checked) => handleConfigChange('autoDistribute', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div>
                  <Label className="text-gray-300">Auto Bridge</Label>
                  <p className="text-sm text-gray-400">Cross-chain liquidity optimization</p>
                </div>
                <Switch
                  checked={localConfig.autoBridge}
                  onCheckedChange={(checked) => handleConfigChange('autoBridge', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-semibold">Manual Operations</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => executeAction('trade')}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={executeActionMutation.isPending}
                >
                  <i className="fas fa-exchange-alt mr-2"></i>
                  Execute Trade
                </Button>
                
                <Button 
                  onClick={() => executeAction('bridge')}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={executeActionMutation.isPending}
                >
                  <i className="fas fa-link mr-2"></i>
                  Bridge Assets
                </Button>
                
                <Button 
                  onClick={() => executeAction('distribute', { amount: '1000' })}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={executeActionMutation.isPending}
                >
                  <i className="fas fa-coins mr-2"></i>
                  Distribute Revenue
                </Button>
                
                <Button 
                  onClick={() => executeAction('audit')}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={executeActionMutation.isPending}
                >
                  <i className="fas fa-shield-alt mr-2"></i>
                  Security Audit
                </Button>
              </div>

              <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-500/20">
                <h5 className="text-yellow-400 font-semibold mb-2">Risk Level: {localConfig.riskLevel}</h5>
                <p className="text-sm text-yellow-300">
                  Max Trade Amount: {localConfig.maxTradeAmount} OMNI
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Actions */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-tasks text-blue-400 mr-3"></i>
            Active Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentStatus.activeActions.length > 0 ? (
            <div className="space-y-3">
              {agentStatus.activeActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-white font-medium capitalize">{action.type}</div>
                      <div className="text-gray-400 text-sm">{new Date(action.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {action.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-robot text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-400">No active operations</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Actions History */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-history text-purple-400 mr-3"></i>
            Recent Agent Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {agentStatus.recentActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    action.status === 'completed' ? 'bg-green-400' : 
                    action.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                  }`}></div>
                  <div>
                    <div className="text-white font-medium capitalize">{action.type}</div>
                    <div className="text-gray-400 text-sm">{new Date(action.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={action.status === 'completed' ? 'default' : action.status === 'failed' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {action.status}
                  </Badge>
                  {action.error && (
                    <p className="text-red-400 text-xs mt-1 max-w-32 truncate">{action.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
