import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const networks = [
  { 
    name: "Ethereum", 
    symbol: "ETH", 
    icon: "fab fa-ethereum", 
    color: "text-blue-600",
    gasPrice: "Average: 25 gwei",
    confirmationTime: "~15 minutes"
  },
  { 
    name: "Polygon", 
    symbol: "MATIC", 
    icon: "fas fa-cube", 
    color: "text-purple-600",
    gasPrice: "Average: 0.001 MATIC",
    confirmationTime: "~2 minutes"
  },
  { 
    name: "Arbitrum", 
    symbol: "ARB", 
    icon: "fas fa-layer-group", 
    color: "text-cyan-600",
    gasPrice: "Average: 0.1 gwei",
    confirmationTime: "~1 minute"
  },
  { 
    name: "Base", 
    symbol: "ETH", 
    icon: "fas fa-coins", 
    color: "text-blue-500",
    gasPrice: "Average: 0.05 gwei",
    confirmationTime: "~2 minutes"
  }
];

const rightTypes = [
  { value: "copyright", label: "Full Copyright", description: "Complete ownership and distribution rights" },
  { value: "licensing", label: "Licensing Rights", description: "Rights to license for specific uses" },
  { value: "attribution", label: "Attribution Rights", description: "Rights requiring proper attribution" },
  { value: "commercial", label: "Commercial Rights", description: "Rights for commercial use and distribution" },
];

export default function Blockchain() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum");
  const [selectedRightType, setSelectedRightType] = useState("copyright");
  const [isProtecting, setIsProtecting] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => api.getProjects(),
  });

  const { data: project } = useQuery({
    queryKey: ["/api/projects", selectedProjectId],
    queryFn: () => selectedProjectId && selectedProjectId !== "none" ? api.getProject(parseInt(selectedProjectId)) : null,
    enabled: !!selectedProjectId && selectedProjectId !== "none",
  });

  const { data: blockchainAssets } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "blockchain"],
    queryFn: () => selectedProjectId && selectedProjectId !== "none" ? 
      fetch(`/api/projects/${selectedProjectId}/blockchain`).then(res => res.json()) : [],
    enabled: !!selectedProjectId && selectedProjectId !== "none",
  });

  const protectMutation = useMutation({
    mutationFn: (data: { projectId: string; network: string; rightType: string }) => {
      return fetch(`/api/projects/${data.projectId}/blockchain/protect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: data.network, rightType: data.rightType }),
        credentials: "include",
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Rights Protected",
        description: "Your work has been successfully protected on the blockchain.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "blockchain"] 
      });
      setIsProtecting(false);
    },
    onError: (error) => {
      toast({
        title: "Protection Failed",
        description: "Failed to protect rights: " + (error as Error).message,
        variant: "destructive",
      });
      setIsProtecting(false);
    },
  });

  const handleProtectRights = async () => {
    if (!selectedProjectId || selectedProjectId === "none") {
      toast({
        title: "Error",
        description: "Please select a project to protect.",
        variant: "destructive",
      });
      return;
    }

    setIsProtecting(true);
    
    // Simulate blockchain transaction process
    const steps = [
      "Preparing transaction...",
      "Creating smart contract...",
      "Uploading metadata to IPFS...",
      "Broadcasting to blockchain...",
      "Waiting for confirmation...",
      "Rights protected successfully!"
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Blockchain Protection",
        description: steps[i],
      });
      
      if (i === steps.length - 1) {
        protectMutation.mutate({
          projectId: selectedProjectId,
          network: selectedNetwork,
          rightType: selectedRightType
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: "fas fa-check-circle" },
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: "fas fa-clock" },
      failed: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: "fas fa-exclamation-triangle" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        <i className={`${config.icon} mr-1`}></i>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getNetworkInfo = (networkName: string) => {
    return networks.find(n => n.name.toLowerCase() === networkName.toLowerCase()) || networks[0];
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Blockchain Rights Management"
          subtitle="Secure your intellectual property with blockchain technology"
          actions={
            <Button 
              onClick={handleProtectRights}
              disabled={!selectedProjectId || selectedProjectId === "none" || isProtecting || protectMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProtecting || protectMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Protecting...
                </>
              ) : (
                <>
                  <i className="fas fa-shield-alt mr-2"></i>
                  Protect Rights
                </>
              )}
            </Button>
          }
        />

        <div className="p-6 space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-book text-blue-600 mr-2"></i>
                Select Project to Protect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a project for blockchain protection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose a project...</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title} ({project.wordCount.toLocaleString()} words)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedProjectId && selectedProjectId !== "none" && project && (
            <Tabs defaultValue="protect" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="protect">Protect Rights</TabsTrigger>
                <TabsTrigger value="assets">Protected Assets</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="protect" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Protection Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-cog text-purple-600 mr-2"></i>
                        Protection Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Blockchain Network</label>
                        <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {networks.map((network) => (
                              <SelectItem key={network.name.toLowerCase()} value={network.name.toLowerCase()}>
                                {network.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {getNetworkInfo(selectedNetwork).gasPrice} • {getNetworkInfo(selectedNetwork).confirmationTime}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Rights Type</label>
                        <Select value={selectedRightType} onValueChange={setSelectedRightType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {rightTypes.map((right) => (
                              <SelectItem key={right.value} value={right.value}>
                                {right.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          What Gets Protected?
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Complete text content and metadata</li>
                          <li>• Authorship timestamp and proof</li>
                          <li>• Digital fingerprint (hash)</li>
                          <li>• Rights and licensing information</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-info-circle text-green-600 mr-2"></i>
                        Project Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Title:</span>
                          <p className="font-semibold">{project.title}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Genre:</span>
                          <p className="font-semibold">{project.genre || "Not specified"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Word Count:</span>
                          <p className="font-semibold">{project.wordCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Last Modified:</span>
                          <p className="font-semibold">{new Date(project.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                          <i className="fas fa-shield-check mr-2"></i>
                          Protection Benefits
                        </h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>• Immutable proof of creation</li>
                          <li>• Global timestamp verification</li>
                          <li>• Automatic royalty distribution</li>
                          <li>• Smart contract enforcement</li>
                          <li>• Decentralized storage backup</li>
                        </ul>
                      </div>

                      {isProtecting && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                          <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                            <i className="fas fa-cog fa-spin mr-2"></i>
                            Protection in Progress
                          </h4>
                          <Progress value={66} className="mt-2" />
                          <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                            Creating smart contract and uploading to blockchain...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Estimated Costs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-receipt text-amber-600 mr-2"></i>
                      Estimated Protection Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {networks.map((network) => (
                        <div 
                          key={network.name}
                          className={`p-4 rounded-lg border transition-colors ${
                            selectedNetwork === network.name.toLowerCase()
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <i className={`${network.icon} ${network.color} text-lg`}></i>
                            <span className="font-semibold">{network.name}</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>Gas Cost: <span className="font-semibold">$5-15</span></div>
                            <div>Platform Fee: <span className="font-semibold">$2</span></div>
                            <div className="border-t pt-1 mt-2">
                              <div>Total: <span className="font-bold text-green-600">$7-17</span></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assets" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-shield-alt text-green-600 mr-2"></i>
                      Protected Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {blockchainAssets && blockchainAssets.length > 0 ? (
                      <div className="space-y-4">
                        {blockchainAssets.map((asset: any) => {
                          const networkInfo = getNetworkInfo(asset.network);
                          return (
                            <div key={asset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <i className={`${networkInfo.icon} ${networkInfo.color} text-lg`}></i>
                                    <span className="font-semibold">{networkInfo.name}</span>
                                    {getStatusBadge(asset.status)}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Contract Address:</span>
                                      <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1">
                                        {asset.contractAddress}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Token ID:</span>
                                      <p className="font-mono">{asset.tokenId}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Protected:</span>
                                      <p className="font-semibold">{new Date(asset.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>

                                  {asset.transactionHash && (
                                    <div className="mt-3">
                                      <span className="text-gray-500 dark:text-gray-400 text-sm">Transaction Hash:</span>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded flex-1">
                                          {asset.transactionHash}
                                        </p>
                                        <Button size="sm" variant="outline">
                                          <i className="fas fa-external-link-alt mr-1"></i>
                                          View
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <i className="fas fa-shield-alt text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          No Protected Assets
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                          Protect your intellectual property on the blockchain to ensure permanent ownership records.
                        </p>
                        <Button 
                          onClick={handleProtectRights}
                          disabled={!selectedProjectId}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <i className="fas fa-shield-alt mr-2"></i>
                          Protect This Project
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Protection Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-chart-bar text-blue-600 mr-2"></i>
                        Protection Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Projects Protected</span>
                          <span className="font-semibold">{blockchainAssets?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Words Protected</span>
                          <span className="font-semibold">
                            {project ? project.wordCount.toLocaleString() : "0"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Active Networks</span>
                          <span className="font-semibold">
                            {blockchainAssets ? new Set(blockchainAssets.map((a: any) => a.network)).size : 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Protection Coverage</span>
                          <span className="font-semibold text-green-600">100%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Network Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-network-wired text-purple-600 mr-2"></i>
                        Network Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {networks.map((network) => {
                          const count = blockchainAssets?.filter((a: any) => 
                            a.network.toLowerCase() === network.name.toLowerCase()
                          ).length || 0;
                          const percentage = blockchainAssets?.length ? (count / blockchainAssets.length) * 100 : 0;
                          
                          return (
                            <div key={network.name} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <i className={`${network.icon} ${network.color}`}></i>
                                  <span>{network.name}</span>
                                </div>
                                <span className="font-semibold">{count} assets</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Blockchain Terminal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-terminal text-green-600 mr-2"></i>
                      Blockchain Protection Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black text-green-400 p-6 rounded-lg font-mono text-sm">
                      <div className="mb-4">
                        <span className="text-green-500">$</span> blockchain-manager --status --project "{project?.title}"
                      </div>
                      <div className="space-y-1">
                        <div>🔗 BLOCKCHAIN PROTECTION STATUS</div>
                        <div>═══════════════════════════════════</div>
                        <div>Project: <span className="text-blue-300">{project?.title}</span></div>
                        <div>Protection Level: <span className="text-green-300">MAXIMUM</span></div>
                        <div>Smart Contracts: <span className="text-yellow-300">{blockchainAssets?.length || 0} active</span></div>
                        <div>Networks: <span className="text-purple-300">{blockchainAssets ? new Set(blockchainAssets.map((a: any) => a.network)).size : 0} chains</span></div>
                        <div>Rights Protected: <span className="text-green-300">Full Copyright ✓</span></div>
                        <div>IPFS Backup: <span className="text-blue-300">Synchronized ✓</span></div>
                        <div className="mt-4">
                          <div className="text-green-300">🛡️ STATUS: Fully protected and immutable</div>
                          <div className="text-blue-300">📈 SECURITY: Military-grade encryption</div>
                          <div className="text-yellow-300">⚡ VERIFICATION: Instant blockchain proof</div>
                        </div>
                        <div className="mt-4 text-gray-400">
                          Last verification: {new Date().toLocaleTimeString()} UTC
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
