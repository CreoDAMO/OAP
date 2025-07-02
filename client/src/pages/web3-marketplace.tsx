
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12.5 ETH</div>
                    <div className="text-xs text-green-600">+15% this month</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">NFTs Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">47</div>
                    <div className="text-xs text-blue-600">8 this week</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Collectors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">128</div>
                    <div className="text-xs text-purple-600">Growing community</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
