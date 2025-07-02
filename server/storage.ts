import {
  users,
  projects,
  analyses,
  royaltyCalculations,
  collaborations,
  blockchainAssets,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Analysis,
  type InsertAnalysis,
  type RoyaltyCalculation,
  type InsertRoyaltyCalculation,
  type Collaboration,
  type InsertCollaboration,
  type BlockchainAsset,
  type InsertBlockchainAsset,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Analysis operations
  getAnalysis(projectId: number): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis>;

  // Royalty calculations
  getRoyaltyCalculations(projectId: number): Promise<RoyaltyCalculation[]>;
  createRoyaltyCalculation(calculation: InsertRoyaltyCalculation): Promise<RoyaltyCalculation>;
  updateRoyaltyCalculation(id: number, updates: Partial<RoyaltyCalculation>): Promise<RoyaltyCalculation>;

  // Collaboration operations
  getCollaborations(projectId: number): Promise<Collaboration[]>;
  getUserCollaborations(userId: number): Promise<Collaboration[]>;
  createCollaboration(collaboration: InsertCollaboration): Promise<Collaboration>;
  updateCollaboration(id: number, updates: Partial<Collaboration>): Promise<Collaboration>;

  // Blockchain operations
  getBlockchainAssets(projectId: number): Promise<BlockchainAsset[]>;
  createBlockchainAsset(asset: InsertBlockchainAsset): Promise<BlockchainAsset>;
  updateBlockchainAsset(id: number, updates: Partial<BlockchainAsset>): Promise<BlockchainAsset>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Analysis operations
  async getAnalysis(projectId: number): Promise<Analysis | undefined> {
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.projectId, projectId))
      .orderBy(desc(analyses.createdAt));
    return analysis || undefined;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis> {
    const [analysis] = await db
      .update(analyses)
      .set(updates)
      .where(eq(analyses.id, id))
      .returning();
    return analysis;
  }

  // Royalty calculations
  async getRoyaltyCalculations(projectId: number): Promise<RoyaltyCalculation[]> {
    return await db
      .select()
      .from(royaltyCalculations)
      .where(eq(royaltyCalculations.projectId, projectId))
      .orderBy(desc(royaltyCalculations.createdAt));
  }

  async createRoyaltyCalculation(insertCalculation: InsertRoyaltyCalculation): Promise<RoyaltyCalculation> {
    const [calculation] = await db
      .insert(royaltyCalculations)
      .values(insertCalculation)
      .returning();
    return calculation;
  }

  async updateRoyaltyCalculation(id: number, updates: Partial<RoyaltyCalculation>): Promise<RoyaltyCalculation> {
    const [calculation] = await db
      .update(royaltyCalculations)
      .set(updates)
      .where(eq(royaltyCalculations.id, id))
      .returning();
    return calculation;
  }

  // Collaboration operations
  async getCollaborations(projectId: number): Promise<Collaboration[]> {
    return await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.projectId, projectId))
      .orderBy(desc(collaborations.createdAt));
  }

  async getUserCollaborations(userId: number): Promise<Collaboration[]> {
    return await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.collaboratorId, userId))
      .orderBy(desc(collaborations.createdAt));
  }

  async createCollaboration(insertCollaboration: InsertCollaboration): Promise<Collaboration> {
    const [collaboration] = await db
      .insert(collaborations)
      .values(insertCollaboration)
      .returning();
    return collaboration;
  }

  async updateCollaboration(id: number, updates: Partial<Collaboration>): Promise<Collaboration> {
    const [collaboration] = await db
      .update(collaborations)
      .set(updates)
      .where(eq(collaborations.id, id))
      .returning();
    return collaboration;
  }

  // Blockchain operations
  async getBlockchainAssets(projectId: number): Promise<BlockchainAsset[]> {
    return await db
      .select()
      .from(blockchainAssets)
      .where(eq(blockchainAssets.projectId, projectId))
      .orderBy(desc(blockchainAssets.createdAt));
  }

  async createBlockchainAsset(insertAsset: InsertBlockchainAsset): Promise<BlockchainAsset> {
    const [asset] = await db
      .insert(blockchainAssets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateBlockchainAsset(id: number, updates: Partial<BlockchainAsset>): Promise<BlockchainAsset> {
    const [asset] = await db
      .update(blockchainAssets)
      .set(updates)
      .where(eq(blockchainAssets.id, id))
      .returning();
    return asset;
  }
}

export const storage = new DatabaseStorage();
