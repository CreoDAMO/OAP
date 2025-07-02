import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  plan?: string;
}

export interface Project {
  id: number;
  userId: number;
  title: string;
  content: string;
  genre?: string;
  wordCount: number;
  status: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Analysis {
  id: number;
  projectId: number;
  neuralCoherence?: number;
  marketViability?: number;
  voiceSignature?: number;
  engagementScore?: number;
  technicalAccuracy?: number;
  overallScore?: number;
  recommendations?: any;
  createdAt: string;
}

export interface RoyaltyCalculation {
  id: number;
  projectId: number;
  platform: string;
  royaltyRate: string;
  pricePerUnit: string;
  projectedSales: number;
  calculatedRoyalty: string;
  createdAt: string;
}

export interface DashboardStats {
  neuralCoherence: number;
  marketViability: number;
  voiceSignature: number;
  engagementScore: number;
  totalProjects: number;
  totalWords: number;
}

// API functions
export const api = {
  // User
  getUser: (): Promise<User> =>
    apiRequest("GET", "/api/user").then(res => res.json()),

  // Projects
  getProjects: (): Promise<Project[]> =>
    apiRequest("GET", "/api/projects").then(res => res.json()),

  getProject: (id: number): Promise<Project> =>
    apiRequest("GET", `/api/projects/${id}`).then(res => res.json()),

  createProject: (data: Partial<Project>): Promise<Project> =>
    apiRequest("POST", "/api/projects", data).then(res => res.json()),

  updateProject: (id: number, data: Partial<Project>): Promise<Project> =>
    apiRequest("PUT", `/api/projects/${id}`, data).then(res => res.json()),

  deleteProject: (id: number): Promise<void> =>
    apiRequest("DELETE", `/api/projects/${id}`).then(() => {}),

  // Analysis
  analyzeProject: (id: number): Promise<Analysis> =>
    apiRequest("POST", `/api/projects/${id}/analyze`).then(res => res.json()),

  getAnalysis: (projectId: number): Promise<Analysis | null> =>
    apiRequest("GET", `/api/projects/${projectId}/analysis`).then(res => res.json()),

  // AI
  generateText: (prompt: string, style?: string): Promise<{ text: string }> =>
    apiRequest("POST", "/api/ai/generate", { prompt, style }).then(res => res.json()),

  improveText: (text: string, improvementType: string): Promise<{ text: string }> =>
    apiRequest("POST", "/api/ai/improve", { text, improvementType }).then(res => res.json()),

  // Royalties
  getRoyaltyCalculations: (projectId: number): Promise<RoyaltyCalculation[]> =>
    apiRequest("GET", `/api/projects/${projectId}/royalties`).then(res => res.json()),

  calculateRoyalties: (projectId: number, data: any): Promise<RoyaltyCalculation[]> =>
    apiRequest("POST", `/api/projects/${projectId}/royalties/calculate`, data).then(res => res.json()),

  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    apiRequest("GET", "/api/dashboard/stats").then(res => res.json()),
};
