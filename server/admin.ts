
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { tokenomicsEngine } from './tokenomics';
import { coinbaseIntegration } from './coinbase-integration';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'ultra_secure_admin_key_change_in_production';
const FOUNDER_EMAIL = 'jacquedegraff81@gmail.com';
const BACKUP_EMAIL = 'omniauthor@outlook.com';
const FOUNDER_USERNAME = 'jacque_degraff';

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: 'founder' | 'admin';
  permissions: string[];
}

export class AdminSystem {
  private adminSessions: Map<string, AdminUser> = new Map();

  // Authenticate admin user
  async authenticateAdmin(email: string, password: string): Promise<{ token: string; user: AdminUser } | null> {
    try {
      // Check if it's the founder
      if (email === FOUNDER_EMAIL || email === BACKUP_EMAIL || email === FOUNDER_USERNAME) {
        // Verify against admin secret (in production, use proper password hashing)
        const isValid = await bcrypt.compare(password, await bcrypt.hash(ADMIN_SECRET, 10)) || password === ADMIN_SECRET;
        
        if (isValid) {
          const adminUser: AdminUser = {
            id: 1,
            email: FOUNDER_EMAIL,
            username: FOUNDER_USERNAME,
            role: 'founder',
            permissions: ['all']
          };

          const token = jwt.sign(
            { 
              id: adminUser.id, 
              email: adminUser.email, 
              role: adminUser.role 
            },
            ADMIN_SECRET,
            { expiresIn: '24h' }
          );

          this.adminSessions.set(token, adminUser);
          return { token, user: adminUser };
        }
      }

      return null;
    } catch (error) {
      console.error("Admin authentication failed:", error);
      return null;
    }
  }

  // Middleware to verify admin access
  verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    try {
      const decoded = jwt.verify(token, ADMIN_SECRET) as any;
      const adminUser = this.adminSessions.get(token);

      if (!adminUser || adminUser.role !== 'founder') {
        return res.status(403).json({ message: 'Founder access required' });
      }

      (req as any).admin = adminUser;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid admin token' });
    }
  };

  // Get platform overview
  async getPlatformOverview(): Promise<any> {
    const tokenomicsStats = await tokenomicsEngine.getTokenomicsStats();
    const walletPortfolio = await coinbaseIntegration.getWalletPortfolio(1);
    
    // Get user statistics
    const allUsers = await db.select().from(users);
    const activeUsers = allUsers.filter(user => 
      user.metadata?.lastLogin && 
      new Date(user.metadata.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    return {
      platform: {
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        proUsers: allUsers.filter(u => u.plan === 'pro').length,
        enterpriseUsers: allUsers.filter(u => u.plan === 'enterprise').length
      },
      revenue: tokenomicsStats,
      wallet: {
        address: walletPortfolio.address,
        balance: walletPortfolio.balance,
        platformTokens: walletPortfolio.platformTokens
      },
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }

  // Get financial breakdown
  async getFinancialBreakdown(): Promise<any> {
    const stats = await tokenomicsEngine.getTokenomicsStats();
    
    return {
      revenue: {
        total: stats.totalRevenue,
        breakdown: {
          subscriptions: stats.subscriptionRevenue,
          platformFees: (parseFloat(stats.totalRevenue) - parseFloat(stats.subscriptionRevenue)).toString(),
          nftRoyalties: "15.3" // Mock data
        }
      },
      distribution: {
        liquidityPool: {
          amount: stats.lpAllocation,
          percentage: 50,
          description: "Funds sent to LP pools for token stability"
        },
        payroll: {
          amount: stats.payrollAllocation,
          percentage: 30,
          description: "Platform operational expenses"
        },
        founder: {
          amount: stats.founderAllocation,
          percentage: 20,
          description: "Founder & Developer allocation"
        }
      },
      wallets: {
        founderWallet: "0x742d35Cc6640C1e7e3B8a37B87d3F9C68b9f13D1",
        paymasterWallet: "0x123456789012345678901234567890123456789a",
        lpPoolWallet: "0x234567890123456789012345678901234567890b"
      }
    };
  }

  // Manual revenue distribution (emergency/testing)
  async manualDistribution(amount: string, type: 'platform_fee' | 'nft_royalty'): Promise<any> {
    return await tokenomicsEngine.distributeRevenue({
      type,
      amount,
      currency: 'ETH',
      userId: 1, // System user
      metadata: { manual: true, timestamp: new Date().toISOString() }
    });
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<{ success: boolean; message: string }> {
    if (email !== FOUNDER_EMAIL && email !== BACKUP_EMAIL) {
      return { success: false, message: "Email not authorized for admin access" };
    }

    // In production, implement proper email sending
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetUrl = `https://omniauthor.pro/admin/reset-password?token=${resetToken}`;
    
    console.log(`Password reset for ${email}: ${resetUrl}`);
    
    return { 
      success: true, 
      message: "Password reset instructions sent to your email" 
    };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // In production, validate token properly
    if (!token || !newPassword) {
      return { success: false, message: "Invalid reset request" };
    }

    // Update admin secret (in production, use proper password hashing)
    process.env.ADMIN_SECRET_KEY = await bcrypt.hash(newPassword, 12);
    
    return { 
      success: true, 
      message: "Password updated successfully" 
    };
  }

  // Get system logs
  async getSystemLogs(): Promise<any[]> {
    // Mock system logs - in production, integrate with logging system
    return [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Revenue distribution completed',
        data: { amount: '5.2 ETH', type: 'platform_fee' }
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: 'info',
        message: 'Subscription payment processed',
        data: { userId: 2, plan: 'pro' }
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: 'warning',
        message: 'LP pool balance low',
        data: { balance: '100 OMNI' }
      }
    ];
  }
}

export const adminSystem = new AdminSystem();
