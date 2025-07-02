import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  plan: text("plan").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").default(""),
  genre: text("genre"),
  wordCount: integer("word_count").default(0),
  status: text("status").default("draft"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  neuralCoherence: integer("neural_coherence"),
  marketViability: integer("market_viability"),
  voiceSignature: integer("voice_signature"),
  engagementScore: integer("engagement_score"),
  technicalAccuracy: integer("technical_accuracy"),
  overallScore: integer("overall_score"),
  recommendations: jsonb("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const royaltyCalculations = pgTable("royalty_calculations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  platform: text("platform").notNull(),
  royaltyRate: decimal("royalty_rate", { precision: 5, scale: 2 }),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }),
  projectedSales: integer("projected_sales"),
  calculatedRoyalty: decimal("calculated_royalty", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const collaborations = pgTable("collaborations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  collaboratorId: integer("collaborator_id").notNull(),
  role: text("role").notNull(), // editor, co-writer, beta-reader
  status: text("status").default("pending"), // pending, active, completed
  permissions: jsonb("permissions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blockchainAssets = pgTable("blockchain_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  contractAddress: text("contract_address"),
  tokenId: text("token_id"),
  network: text("network").default("ethereum"),
  transactionHash: text("transaction_hash"),
  status: text("status").default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  collaborations: many(collaborations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  analyses: many(analyses),
  royaltyCalculations: many(royaltyCalculations),
  collaborations: many(collaborations),
  blockchainAssets: many(blockchainAssets),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  project: one(projects, {
    fields: [analyses.projectId],
    references: [projects.id],
  }),
}));

export const royaltyCalculationsRelations = relations(royaltyCalculations, ({ one }) => ({
  project: one(projects, {
    fields: [royaltyCalculations.projectId],
    references: [projects.id],
  }),
}));

export const collaborationsRelations = relations(collaborations, ({ one }) => ({
  project: one(projects, {
    fields: [collaborations.projectId],
    references: [projects.id],
  }),
  collaborator: one(users, {
    fields: [collaborations.collaboratorId],
    references: [users.id],
  }),
}));

export const blockchainAssetsRelations = relations(blockchainAssets, ({ one }) => ({
  project: one(projects, {
    fields: [blockchainAssets.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const insertRoyaltyCalculationSchema = createInsertSchema(royaltyCalculations).omit({
  id: true,
  createdAt: true,
});

export const insertCollaborationSchema = createInsertSchema(collaborations).omit({
  id: true,
  createdAt: true,
});

export const insertBlockchainAssetSchema = createInsertSchema(blockchainAssets).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export type RoyaltyCalculation = typeof royaltyCalculations.$inferSelect;
export type InsertRoyaltyCalculation = z.infer<typeof insertRoyaltyCalculationSchema>;

export type Collaboration = typeof collaborations.$inferSelect;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;

export type BlockchainAsset = typeof blockchainAssets.$inferSelect;
export type InsertBlockchainAsset = z.infer<typeof insertBlockchainAssetSchema>;
