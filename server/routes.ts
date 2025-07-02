import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeText, generateText, improveText } from "./ai";
import { insertProjectSchema, insertAnalysisSchema, insertRoyaltyCalculationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user for development - in production this would come from authentication
  const MOCK_USER_ID = 1;

  // User routes
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(MOCK_USER_ID);
      if (!user) {
        // Create a default user for development
        const newUser = await storage.createUser({
          username: "jacque_degraff",
          email: "jacque@omniauthor.pro",
          firstName: "Jacque",
          lastName: "DeGraff",
          plan: "pro"
        });
        return res.json(newUser);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjectsByUser(MOCK_USER_ID);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        userId: MOCK_USER_ID
      });
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;
      
      // Calculate word count if content is updated
      if (updates.content) {
        updates.wordCount = updates.content.split(/\s+/).filter((word: string) => word.length > 0).length;
      }

      const project = await storage.updateProject(projectId, updates);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      await storage.deleteProject(projectId);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // AI Analysis routes
  app.post("/api/projects/:id/analyze", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!project.content || project.content.trim().length === 0) {
        return res.status(400).json({ message: "Project content is empty. Please add content before analyzing." });
      }

      const analysisResult = await analyzeText(project.content, project.genre || undefined);
      
      const analysis = await storage.createAnalysis({
        projectId,
        ...analysisResult,
        recommendations: JSON.stringify(analysisResult.recommendations)
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing project:", error);
      res.status(500).json({ message: "Failed to analyze project: " + (error as Error).message });
    }
  });

  app.get("/api/projects/:id/analysis", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(projectId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // AI Text Generation routes
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const generatedText = await generateText(prompt, style);
      res.json({ text: generatedText });
    } catch (error) {
      console.error("Error generating text:", error);
      res.status(500).json({ message: "Failed to generate text: " + (error as Error).message });
    }
  });

  app.post("/api/ai/improve", async (req, res) => {
    try {
      const { text, improvementType } = req.body;
      if (!text || !improvementType) {
        return res.status(400).json({ message: "Text and improvement type are required" });
      }
      
      const improvedText = await improveText(text, improvementType);
      res.json({ text: improvedText });
    } catch (error) {
      console.error("Error improving text:", error);
      res.status(500).json({ message: "Failed to improve text: " + (error as Error).message });
    }
  });

  // Royalty Calculator routes
  app.get("/api/projects/:id/royalties", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const calculations = await storage.getRoyaltyCalculations(projectId);
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching royalty calculations:", error);
      res.status(500).json({ message: "Failed to fetch royalty calculations" });
    }
  });

  app.post("/api/projects/:id/royalties/calculate", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { platforms, bookPrice } = req.body;
      
      const defaultPlatforms = [
        { name: "Amazon KDP", royaltyRate: 70 },
        { name: "Neural Books", royaltyRate: 85 },
        { name: "Apple Books", royaltyRate: 70 },
        { name: "Kobo 2025", royaltyRate: 72 },
        { name: "Audible", royaltyRate: 75 },
        { name: "Neural Audio", royaltyRate: 88 }
      ];

      const platformsToCalculate = platforms || defaultPlatforms;
      const price = parseFloat(bookPrice) || 7.00;

      const calculations = [];
      for (const platform of platformsToCalculate) {
        const royaltyRate = platform.royaltyRate / 100;
        const royaltyPerUnit = price * royaltyRate;
        
        const calculation = await storage.createRoyaltyCalculation({
          projectId,
          platform: platform.name,
          royaltyRate: platform.royaltyRate.toString(),
          pricePerUnit: price.toString(),
          projectedSales: 1000, // Default projection
          calculatedRoyalty: (royaltyPerUnit * 1000).toString()
        });
        
        calculations.push(calculation);
      }

      res.json(calculations);
    } catch (error) {
      console.error("Error calculating royalties:", error);
      res.status(500).json({ message: "Failed to calculate royalties" });
    }
  });

  // Collaboration routes
  app.get("/api/projects/:id/collaborations", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const collaborations = await storage.getCollaborations(projectId);
      res.json(collaborations);
    } catch (error) {
      console.error("Error fetching collaborations:", error);
      res.status(500).json({ message: "Failed to fetch collaborations" });
    }
  });

  app.get("/api/user/collaborations", async (req, res) => {
    try {
      const collaborations = await storage.getUserCollaborations(MOCK_USER_ID);
      res.json(collaborations);
    } catch (error) {
      console.error("Error fetching user collaborations:", error);
      res.status(500).json({ message: "Failed to fetch user collaborations" });
    }
  });

  // Blockchain routes
  app.get("/api/projects/:id/blockchain", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const assets = await storage.getBlockchainAssets(projectId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching blockchain assets:", error);
      res.status(500).json({ message: "Failed to fetch blockchain assets" });
    }
  });

  app.post("/api/projects/:id/blockchain/protect", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { network = "ethereum" } = req.body;
      
      // Simulate blockchain asset creation
      const asset = await storage.createBlockchainAsset({
        projectId,
        contractAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        tokenId: Math.floor(Math.random() * 10000).toString(),
        network,
        transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        status: "confirmed",
        metadata: {
          protected_at: new Date().toISOString(),
          rights_type: "copyright",
          scope: "full_rights"
        }
      });
      
      res.json(asset);
    } catch (error) {
      console.error("Error protecting on blockchain:", error);
      res.status(500).json({ message: "Failed to protect on blockchain" });
    }
  });

  // Web3 Marketplace Routes
  app.get("/api/web3/wallet", async (req, res) => {
    try {
      const { coinbaseIntegration } = await import('./coinbase-integration');
      const portfolio = await coinbaseIntegration.getWalletPortfolio(MOCK_USER_ID);
      res.json(portfolio);
    } catch (error) {
      console.error("Error getting wallet:", error);
      res.status(500).json({ message: "Failed to get wallet data" });
    }
  });

  app.get("/api/web3/tokens", async (req, res) => {
    try {
      const { coinbaseIntegration } = await import('./coinbase-integration');
      const balance = await coinbaseIntegration.getPlatformTokenBalance(MOCK_USER_ID);
      res.json({ balance, symbol: "OMNI" });
    } catch (error) {
      res.json({ balance: "0", symbol: "OMNI" });
    }
  });

  app.post("/api/web3/create-nft", async (req, res) => {
    try {
      const { projectId, metadata } = req.body;
      const { coinbaseIntegration } = await import('./coinbase-integration');
      
      const contractAddress = await coinbaseIntegration.createBookNFT(
        MOCK_USER_ID,
        projectId,
        {
          name: metadata.name,
          description: metadata.description,
          image: `https://api.omniauthor.pro/projects/${projectId}/cover`,
          attributes: [
            { trait_type: "Author", value: "OmniAuthor User" },
            { trait_type: "Edition", value: "First Edition" },
            { trait_type: "Format", value: "Digital Book NFT" }
          ]
        }
      );
      
      res.json({ contractAddress, message: "NFT created successfully" });
    } catch (error) {
      console.error("Error creating NFT:", error);
      res.status(500).json({ message: "Failed to create NFT" });
    }
  });

  app.post("/api/web3/create-storefront", async (req, res) => {
    try {
      const { books } = req.body;
      const { coinbaseIntegration } = await import('./coinbase-integration');
      
      const storefrontUrl = await coinbaseIntegration.createBookStorefront(
        MOCK_USER_ID,
        books.map((book: any) => ({
          projectId: book.id,
          title: book.title,
          price: "0.01",
          currency: "ETH",
          formats: ["PDF", "EPUB", "MOBI"]
        }))
      );
      
      res.json({ url: storefrontUrl, message: "Storefront created successfully" });
    } catch (error) {
      console.error("Error creating storefront:", error);
      res.status(500).json({ message: "Failed to create storefront" });
    }
  });

  app.post("/api/web3/subscribe", async (req, res) => {
    try {
      const { plan, duration } = req.body;
      const { coinbaseIntegration } = await import('./coinbase-integration');
      
      const txHash = await coinbaseIntegration.processSubscriptionPayment(
        MOCK_USER_ID,
        plan,
        duration
      );
      
      res.json({ transactionHash: txHash, message: "Subscription processed" });
    } catch (error) {
      console.error("Error processing subscription:", error);
      res.status(500).json({ message: "Failed to process subscription" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const projects = await storage.getProjectsByUser(MOCK_USER_ID);
      const recentProject = projects[0];
      
      let stats = {
        neuralCoherence: 92,
        marketViability: 85,
        voiceSignature: 95,
        engagementScore: 90,
        totalProjects: projects.length,
        totalWords: projects.reduce((sum, p) => sum + (p.wordCount || 0), 0)
      };

      if (recentProject) {
        const analysis = await storage.getAnalysis(recentProject.id);
        if (analysis) {
          stats = {
            ...stats,
            neuralCoherence: analysis.neuralCoherence || 92,
            marketViability: analysis.marketViability || 85,
            voiceSignature: analysis.voiceSignature || 95,
            engagementScore: analysis.engagementScore || 90
          };
        }
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
