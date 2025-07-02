The code integrates Polygon AggLayer for cross-chain liquidity and adds functions to manage cross-chain token distribution.
```

```replit_final_file
import { Coinbase, Wallet, WalletData } from "@coinbase/coinbase-sdk";
import crypto from 'crypto';
import { db } from './db';
import { users, projects, blockchainAssets } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { polygonAggLayer } from './polygon-agglayer';

// Initialize Coinbase SDK
const coinbase = Coinbase.configureFromJson({
  filePath: process.env.CDP_API_KEY_PATH || "./coinbase_cloud_api_key.json"
});

export interface PlatformToken {
  symbol: string;
  name: string;
  totalSupply: string;
  contractAddress: string;
  network: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
}

export interface CommerceOrder {
  id: string;
  userId: number;
  productType: 'book' | 'nft' | 'subscription' | 'merchandise';
  productId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  walletAddress?: string;
  transactionHash?: string;
}

export class CoinbaseIntegration {
  private walletCache: Map<number, Wallet> = new Map();
  private platformTokenAddress: string = "";

  constructor() {
    this.initializePlatformToken();
  }

  // Initialize OmniAuthor Platform Token (OMNI)
  async initializePlatformToken(): Promise<void> {
    try {
      // Deploy platform token contract if not exists
      if (!this.platformTokenAddress) {
        const wallet = await this.getOrCreateWallet(1); // Admin wallet

        const deployedContract = await wallet.deployToken({
          name: "OmniAuthor Token",
          symbol: "OMNI",
          totalSupply: "1000000000" // 1 billion tokens
        });

        await deployedContract.wait();
        this.platformTokenAddress = deployedContract.getContractAddress();

        console.log(`Platform token deployed at: ${this.platformTokenAddress}`);
      }
    } catch (error) {
      console.error("Error initializing platform token:", error);
    }
  }

  // Get or create user wallet
  async getOrCreateWallet(userId: number): Promise<Wallet> {
    if (this.walletCache.has(userId)) {
      return this.walletCache.get(userId)!;
    }

    try {
      // Try to load existing wallet
      const user = await db.select().from(users).where(eq(users.id, userId)).get();

      let wallet: Wallet;

      if (user?.metadata?.walletData) {
        // Import existing wallet
        wallet = await Wallet.import(user.metadata.walletData as WalletData);
      } else {
        // Create new wallet
        wallet = await Wallet.create();

        // Save wallet data to user
        await db.update(users)
          .set({
            metadata: {
              ...user?.metadata,
              walletData: wallet.export(),
              walletAddress: wallet.getDefaultAddress()?.toString()
            }
          })
          .where(eq(users.id, userId));
      }

      this.walletCache.set(userId, wallet);
      return wallet;
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  }

  // Create NFT for published book
  async createBookNFT(
    userId: number,
    projectId: number,
    metadata: NFTMetadata
  ): Promise<string> {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Deploy NFT contract for the book
      const nftContract = await wallet.deployNFT({
        name: `${metadata.name} - OmniAuthor Edition`,
        symbol: "OMNI-BOOK",
        baseURI: "https://api.omniauthor.pro/nft/"
      });

      await nftContract.wait();
      const contractAddress = nftContract.getContractAddress();

      // Mint the NFT
      const mintTx = await nftContract.mint({
        to: wallet.getDefaultAddress()!.toString(),
        quantity: 1
      });

      await mintTx.wait();

      // Store NFT info in database
      await db.insert(blockchainAssets).values({
        projectId,
        contractAddress,
        tokenId: "1",
        network: "base",
        transactionHash: mintTx.getTransactionHash(),
        status: "confirmed",
        metadata: {
          type: "book_nft",
          nftMetadata: metadata,
          mintedAt: new Date().toISOString()
        }
      });

      return contractAddress;
    } catch (error) {
      console.error("Error creating book NFT:", error);
      throw error;
    }
  }

  // Create merchandise NFT collection
  async createMerchandiseCollection(
    userId: number,
    collectionName: string,
    items: Array<{
      name: string;
      description: string;
      image: string;
      price: string;
      quantity: number;
    }>
  ): Promise<string> {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      const nftContract = await wallet.deployNFT({
        name: `${collectionName} - OmniAuthor Merch`,
        symbol: "OMNI-MERCH",
        baseURI: "https://api.omniauthor.pro/merch/"
      });

      await nftContract.wait();
      const contractAddress = nftContract.getContractAddress();

      // Mint merchandise NFTs
      for (const item of items) {
        const mintTx = await nftContract.mint({
          to: wallet.getDefaultAddress()!.toString(),
          quantity: item.quantity
        });
        await mintTx.wait();
      }

      return contractAddress;
    } catch (error) {
      console.error("Error creating merchandise collection:", error);
      throw error;
    }
  }

  // Handle subscription payments with platform tokens
  async processSubscriptionPayment(
    userId: number,
    plan: 'pro' | 'enterprise',
    duration: number // months
  ): Promise<string> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      const tokenPrices = { pro: "100", enterprise: "250" }; // OMNI tokens
      const totalAmount = (parseInt(tokenPrices[plan]) * duration).toString();

      // Transfer platform tokens for subscription
      const transfer = await wallet.createTransfer({
        amount: totalAmount,
        assetId: this.platformTokenAddress,
        destination: "0x742d35Cc6640C1e7e3B8a37B87d3F9C68b9f13D1" // Platform treasury
      });

      await transfer.wait();

      // Update user subscription
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + duration);

      await db.update(users)
        .set({
          plan,
          metadata: {
            subscriptionExpiry: expirationDate.toISOString(),
            lastPaymentTx: transfer.getTransactionHash()
          }
        })
        .where(eq(users.id, userId));

      return transfer.getTransactionHash();
    } catch (error) {
      console.error("Error processing subscription payment:", error);
      throw error;
    }
  }

  // Create e-commerce storefront for books
  async createBookStorefront(
    userId: number,
    books: Array<{
      projectId: number;
      title: string;
      price: string;
      currency: string;
      formats: string[];
    }>
  ): Promise<string> {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Create commerce charge for book sales
      const charges = await Promise.all(books.map(async (book) => {
        const charge = await wallet.createPayment({
          amount: book.price,
          currency: book.currency,
          description: `Purchase of "${book.title}" by OmniAuthor`,
          metadata: {
            projectId: book.projectId.toString(),
            userId: userId.toString(),
            formats: book.formats.join(',')
          }
        });

        return {
          projectId: book.projectId,
          chargeId: charge.id,
          paymentUrl: charge.hosted_url
        };
      }));

      // Generate storefront URL
      const storefrontId = crypto.randomUUID();
      const storefrontUrl = `https://store.omniauthor.pro/${userId}/${storefrontId}`;

      // Store storefront data
      await db.update(users)
        .set({
          metadata: {
            storefront: {
              id: storefrontId,
              url: storefrontUrl,
              charges: charges,
              createdAt: new Date().toISOString()
            }
          }
        })
        .where(eq(users.id, userId));

      return storefrontUrl;
    } catch (error) {
      console.error("Error creating book storefront:", error);
      throw error;
    }
  }

  // Distribute royalties automatically
  async distributeRoyalties(
    projectId: number,
    totalRevenue: string,
    collaborators: Array<{
      userId: number;
      percentage: number;
    }>
  ): Promise<string[]> {
    try {
      const transactions: string[] = [];

      for (const collaborator of collaborators) {
        const wallet = await this.getOrCreateWallet(1); // Platform wallet
        const collaboratorWallet = await this.getOrCreateWallet(collaborator.userId);

        const amount = (parseFloat(totalRevenue) * collaborator.percentage / 100).toString();

        const transfer = await wallet.createTransfer({
          amount,
          assetId: this.platformTokenAddress,
          destination: collaboratorWallet.getDefaultAddress()!.toString()
        });

        await transfer.wait();
        transactions.push(transfer.getTransactionHash());
      }

      return transactions;
    } catch (error) {
      console.error("Error distributing royalties:", error);
      throw error;
    }
  }

  // Create AI agent for automated trading
  async createTradingAgent(userId: number): Promise<void> {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      // Agent configuration for automated trading
      const agentConfig = {
        name: "OmniAuthor Trading Agent",
        description: "Automated trading agent for platform tokens and NFTs",
        instructions: [
          "Monitor platform token price movements",
          "Execute trades based on market conditions",
          "Manage NFT collections and sales",
          "Optimize royalty distributions"
        ],
        functions: [
          "trade_tokens",
          "mint_nfts",
          "manage_royalties",
          "create_liquidity_pools"
        ]
      };

      // Store agent configuration
      await db.update(users)
        .set({
          metadata: {
            tradingAgent: agentConfig,
            agentWallet: wallet.getDefaultAddress()?.toString()
          }
        })
        .where(eq(users.id, userId));

    } catch (error) {
      console.error("Error creating trading agent:", error);
      throw error;
    }
  }

  // Get wallet balance and portfolio
  async getWalletPortfolio(userId: number): Promise<any> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      const balance = await wallet.getBalance();

      return {
        address: wallet.getDefaultAddress()?.toString(),
        balance: balance.toString(),
        platformTokens: await this.getPlatformTokenBalance(userId),
        nfts: await this.getUserNFTs(userId),
        transactions: await wallet.listTransactions()
      };
    } catch (error) {
      console.error("Error getting wallet portfolio:", error);
      throw error;
    }
  }

  private async getPlatformTokenBalance(userId: number): Promise<string> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      const balance = await wallet.getBalance(this.platformTokenAddress);
      return balance.toString();
    } catch (error) {
      return "0";
    }
  }

  private async getUserNFTs(userId: number): Promise<any[]> {
    try {
      const assets = await db.select()
        .from(blockchainAssets)
        .where(eq(blockchainAssets.projectId, userId));

      return assets.filter(asset => 
        asset.metadata?.type === 'book_nft' || 
        asset.metadata?.type === 'merchandise_nft'
      );
    } catch (error) {
      return [];
    }
  }

  // Initialize cross-chain liquidity pools
  async initializeCrossChainLiquidity(
    userId: number,
    networks: string[] = ['ethereum', 'polygon', 'base'],
    initialLiquidity: string = "10000"
  ): Promise<{ pools: any[]; coordinator: string }> {
    try {
      const result = await polygonAggLayer.initializeCrossChainPools(userId, {
        networks,
        tokens: ['OMNI', 'ETH'],
        minLiquidity: initialLiquidity,
        slippage: 0.5
      });

      console.log("Cross-chain liquidity initialized:", result);
      return result;
    } catch (error) {
      console.error("Cross-chain initialization failed:", error);
      throw error;
    }
  }

  // Provide liquidity across chains
  async provideCrossChainLiquidity(
    userId: number,
    sourceNetwork: string,
    targetNetwork: string,
    amount: string
  ): Promise<{ txHash: string; bridgeId: string; estimatedTime: number }> {
    try {
      return await polygonAggLayer.provideCrossChainLiquidity(
        userId,
        sourceNetwork,
        targetNetwork,
        amount,
        ['OMNI', 'ETH']
      );
    } catch (error) {
      console.error("Cross-chain liquidity provision failed:", error);
      throw error;
    }
  }

  // Get cross-chain liquidity health
  async getCrossChainLiquidityHealth() {
    try {
      return await polygonAggLayer.getLiquidityHealth();
    } catch (error) {
      console.error("Failed to get liquidity health:", error);
      return {
        totalLiquidity: "0 OMNI",
        networkDistribution: {},
        bridgeVolume24h: "0 OMNI",
        avgBridgeTime: 0,
        successRate: 0
      };
    }
  }

  // Enhanced token distribution with cross-chain support
  async distributePlatformTokens(
    recipients: Array<{
      userId: number;
      amount: string;
      network?: string;
    }>
  ): Promise<string[]> {
    try {
      const transactions: string[] = [];

      for (const recipient of recipients) {
        const wallet = await this.getOrCreateWallet(1); // Platform wallet
        const recipientWallet = await this.getOrCreateWallet(recipient.userId);

        const transfer = await wallet.createTransfer({
          amount: recipient.amount,
          assetId: this.platformTokenAddress,
          destination: recipientWallet.getDefaultAddress()!.toString()
        });

        await transfer.wait();
        transactions.push(transfer.getTransactionHash());
      }

      return transactions;
    } catch (error) {
      console.error("Error distributing platform tokens:", error);
      throw error;
    }
  }
}

export const coinbaseIntegration = new CoinbaseIntegration();