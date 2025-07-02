import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Web3Marketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState("storefront");
  const [nftPrice, setNftPrice] = useState("0.1");
  const [merchandiseItems, setMerchandiseItems] = useState([
    { name: "", description: "", price: "", quantity: 1 }
  ]);

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: () => api.getProjects(),
  });

  const { data: walletData } = useQuery({
    queryKey: ["/api/web3/wallet"],
    queryFn: () => fetch("/api/web3/wallet", { credentials: "include" }).then(res => res.json()),
  });

  const { data: platformTokens } = useQuery({
    queryKey: ["/api/web3/tokens"],
    queryFn: () => fetch("/api/web3/tokens", { credentials: "include" }).then(res => res.json()),
  });

  const createNFTMutation = useMutation({
    mutationFn: (data: { projectId: number; metadata: any }) =>
      fetch("/api/web3/create-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "NFT Created", description: "Your book NFT has been successfully created!" });
      queryClient.invalidateQueries({ queryKey: ["/api/web3/wallet"] });
    },
  });

  const createStorefrontMutation = useMutation({
    mutationFn: (books: any[]) =>
      fetch("/api/web3/create-storefront", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ books }),
        credentials: "include",
      }).then(res => res.json()),
    onSuccess: (data) => {
      toast({ title: "Storefront Created", description: `Your storefront is live at: ${data.url}` });
    },
  });

  const addMerchandiseItem = () => {
    setMerchandiseItems([...merchandiseItems, { name: "", description: "", price: "", quantity: 1 }]);
  };

  const updateMerchandiseItem = (index: number, field: string, value: any) => {
    const updated = [...merchandiseItems];
    updated[index] = { ...updated[index], [field]: value };
    setMerchandiseItems(updated);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Web3 Marketplace"
          subtitle="Monetize your content with blockchain technology"
        />

        <div className="p-6 space-y-6">
          {/* Wallet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <i className="fas fa-wallet text-blue-600 mr-2"></i>
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{walletData?.balance || "0"} ETH</div>
                <div className="text-xs text-gray-500 mt-1">
                  {walletData?.address?.slice(0, 8)}...{walletData?.address?.slice(-6)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <i className="fas fa-coins text-purple-600 mr-2"></i>
                  OMNI Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformTokens?.balance || "0"}</div>
                <div className="text-xs text-green-600 mt-1">Platform Currency</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <i className="fas fa-image text-green-600 mr-2"></i>
                  NFTs Owned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{walletData?.nfts?.length || "0"}</div>
                <div className="text-xs text-gray-500 mt-1">Books & Merchandise</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="storefront">Book Store</TabsTrigger>
              <TabsTrigger value="nft">NFT Creator</TabsTrigger>
              <TabsTrigger value="merchandise">Merchandise</TabsTrigger>
              <TabsTrigger value="tokens">Token Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="storefront" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-store text-blue-600 mr-2"></i>
                    Create Book Storefront
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects?.map((project) => (
                      <Card key={project.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{project.title}</h3>
                            <p className="text-sm text-gray-500">{project.wordCount?.toLocaleString()} words</p>
                          </div>
                          <Badge variant="outline">{project.genre}</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Price (ETH)"
                              defaultValue="0.01"
                              className="flex-1"
                            />
                            <Select defaultValue="ETH">
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ETH">ETH</SelectItem>
                                <SelectItem value="OMNI">OMNI</SelectItem>
                                <SelectItem value="USDC">USDC</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {["PDF", "EPUB", "MOBI", "Audiobook"].map((format) => (
                              <Badge key={format} variant="secondary" className="text-xs">
                                {format}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button 
                    onClick={() => createStorefrontMutation.mutate(projects || [])}
                    disabled={!projects?.length || createStorefrontMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {createStorefrontMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Creating Storefront...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-store mr-2"></i>
                        Create Storefront
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nft" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-palette text-purple-600 mr-2"></i>
                    NFT Creator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Select Book</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a project to mint as NFT" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>NFT Price (ETH)</Label>
                        <Input
                          value={nftPrice}
                          onChange={(e) => setNftPrice(e.target.value)}
                          placeholder="0.1"
                        />
                      </div>

                      <div>
                        <Label>Rarity Attributes</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="First Edition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="first">First Edition</SelectItem>
                              <SelectItem value="limited">Limited Edition</SelectItem>
                              <SelectItem value="special">Special Edition</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Author Signed" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="signed">Author Signed</SelectItem>
                              <SelectItem value="exclusive">Exclusive Content</SelectItem>
                              <SelectItem value="early">Early Access</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button 
                        onClick={() => createNFTMutation.mutate({
                          projectId: 1,
                          metadata: {
                            name: "Digital Book NFT",
                            description: "Exclusive digital book ownership",
                            price: nftPrice
                          }
                        })}
                        disabled={createNFTMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {createNFTMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Minting NFT...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-hammer mr-2"></i>
                            Mint Book NFT
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">NFT Preview</h3>
                      <div className="aspect-square bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg mb-4 flex items-center justify-center">
                        <i className="fas fa-book text-white text-6xl"></i>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Price:</span>
                          <span className="font-semibold">{nftPrice} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Royalty:</span>
                          <span className="font-semibold">10%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Network:</span>
                          <span className="font-semibold">Base</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="merchandise" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-tshirt text-green-600 mr-2"></i>
                    Merchandise Creator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {merchandiseItems.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Item Name</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updateMerchandiseItem(index, "name", e.target.value)}
                              placeholder="Book T-Shirt"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateMerchandiseItem(index, "description", e.target.value)}
                              placeholder="Official book merchandise"
                            />
                          </div>
                          <div>
                            <Label>Price (ETH)</Label>
                            <Input
                              value={item.price}
                              onChange={(e) => updateMerchandiseItem(index, "price", e.target.value)}
                              placeholder="0.05"
                            />
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateMerchandiseItem(index, "quantity", parseInt(e.target.value))}
                              min="1"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}

                    <div className="flex space-x-2">
                      <Button onClick={addMerchandiseItem} variant="outline">
                        <i className="fas fa-plus mr-2"></i>
                        Add Item
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <i className="fas fa-rocket mr-2"></i>
                        Launch Collection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tokens" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-coins text-yellow-600 mr-2"></i>
                      OMNI Token Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Token Utility</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Pay for premium subscriptions</li>
                        <li>• Purchase books and NFTs</li>
                        <li>• Receive royalty payments</li>
                        <li>• Governance voting rights</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline">
                        <i className="fas fa-exchange-alt mr-2"></i>
                        Trade Tokens
                      </Button>
                      <Button variant="outline">
                        <i className="fas fa-chart-line mr-2"></i>
                        Price Chart
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-robot text-cyan-600 mr-2"></i>
                      AI Trading Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Agent Features</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Automated token trading</li>
                        <li>• NFT collection management</li>
                        <li>• Royalty optimization</li>
                        <li>• Market analysis</li>
                      </ul>
                    </div>

                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <i className="fas fa-robot mr-2"></i>
                      Activate Trading Agent
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Market Performance */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <i className="fas fa-chart-line text-green-400 mr-3"></i>
                    Market Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">OMNI Token Price</span>
                      <span className="text-green-400 font-semibold">$0.045 (+12%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">24h Volume</span>
                      <span className="text-blue-400 font-semibold">15,432 OMNI</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Market Cap</span>
                      <span className="text-purple-400 font-semibold">$450K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cross-Chain Liquidity */}
              <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <i className="fas fa-network-wired text-purple-400 mr-3"></i>
                    AggLayer Liquidity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-purple-400">5 Networks</div>
                      <div className="text-sm text-gray-400">Cross-chain enabled</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                        <div className="text-blue-400 font-medium">Ethereum</div>
                        <div className="text-white">456K OMNI</div>
                      </div>
                      <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                        <div className="text-purple-400 font-medium">Polygon</div>
                        <div className="text-white">345K OMNI</div>
                      </div>
                      <div className="bg-orange-500/10 p-2 rounded border border-orange-500/20">
                        <div className="text-orange-400 font-medium">Base</div>
                        <div className="text-white">234K OMNI</div>
                      </div>
                      <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
                        <div className="text-green-400 font-medium">Arbitrum</div>
                        <div className="text-white">123K OMNI</div>
                      </div>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      <i className="fas fa-bridge mr-2"></i>
                      Bridge Liquidity
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Activity */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <i className="fas fa-exchange-alt text-blue-400 mr-3"></i>
                    Recent Trading
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { type: "BUY", amount: "1,250 OMNI", price: "$0.044", time: "2m ago" },
                      { type: "SELL", amount: "800 OMNI", price: "$0.046", time: "5m ago" },
                      { type: "BUY", amount: "2,100 OMNI", price: "$0.043", time: "8m ago" }
                    ].map((trade, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                        <div className="flex items-center space-x-2">
                          <Badge variant={trade.type === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                            {trade.type}
                          </Badge>
                          <span className="text-gray-300 text-sm">{trade.amount}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-white">{trade.price}</div>
                          <div className="text-gray-400 text-xs">{trade.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cross-Chain Bridge Interface */}
            <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <i className="fas fa-globe text-purple-400 mr-3"></i>
                  Polygon AggLayer Bridge
                  <Badge className="ml-3 bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Multi-Chain
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <Label className="text-gray-300">From Network</Label>
                    <select className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded text-white">
                      <option value="ethereum">Ethereum</option>
                      <option value="polygon">Polygon</option>
                      <option value="base">Base</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="optimism">Optimism</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-gray-300">To Network</Label>
                    <select className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded text-white">
                      <option value="polygon">Polygon</option>
                      <option value="ethereum">Ethereum</option>
                      <option value="base">Base</option>
                      <option value="arbitrum">Arbitrum</option>
                      <option value="optimism">Optimism</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-gray-300">Amount</Label>
                    <Input 
                      placeholder="1000 OMNI"
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-400">Bridge Fee</div>
                      <div className="text-green-400 font-semibold">0.1%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Est. Time</div>
                      <div className="text-blue-400 font-semibold">~3 mins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Success Rate</div>
                      <div className="text-purple-400 font-semibold">99.7%</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3">
                  <i className="fas fa-rocket mr-2"></i>
                  Initialize Cross-Chain Bridge
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}