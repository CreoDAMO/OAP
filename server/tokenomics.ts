
import Stripe from 'stripe';
import { coinbaseIntegration } from './coinbase-integration';
import { db } from './db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export interface TokenomicsConfig {
  lpPercentage: number; // 50%
  payrollPercentage: number; // 30%
  founderPercentage: number; // 20%
  founderWallet: string;
  paymasterWallet: string;
  lpPoolAddress: string;
}

export interface RevenueStream {
  type: 'platform_fee' | 'nft_royalty' | 'subscription' | 'book_sale';
  amount: string;
  currency: string;
  userId: number;
  projectId?: number;
  metadata?: any;
}

export class TokenomicsEngine {
  private config: TokenomicsConfig;
  private founderAddress = "0x742d35Cc6640C1e7e3B8a37B87d3F9C68b9f13D1"; // Jacque's wallet
  
  constructor() {
    this.config = {
      lpPercentage: 50,
      payrollPercentage: 30,
      founderPercentage: 20,
      founderWallet: this.founderAddress,
      paymasterWallet: "0x123456789012345678901234567890123456789a", // Platform payroll wallet
      lpPoolAddress: "0x234567890123456789012345678901234567890b" // LP pool address
    };
  }

  // Process revenue distribution
  async distributeRevenue(revenue: RevenueStream): Promise<{
    lpAllocation: string;
    payrollAllocation: string;
    founderAllocation: string;
    subscriptionToStripe?: string;
    transactionHashes: string[];
  }> {
    const amount = parseFloat(revenue.amount);
    const transactions: string[] = [];

    // Handle subscription payments - goes directly to Stripe
    if (revenue.type === 'subscription') {
      const stripePayment = await this.processStripeSubscription(revenue);
      return {
        lpAllocation: "0",
        payrollAllocation: "0",
        founderAllocation: "0",
        subscriptionToStripe: stripePayment.id,
        transactionHashes: []
      };
    }

    // Calculate allocations for platform fees and NFT royalties
    const lpAmount = (amount * this.config.lpPercentage / 100).toString();
    const payrollAmount = (amount * this.config.payrollPercentage / 100).toString();
    const founderAmount = (amount * this.config.founderPercentage / 100).toString();

    // Execute distributions
    try {
      // 1. Send 50% to LP Pool
      const lpTx = await this.sendToLPPool(lpAmount, revenue.currency);
      transactions.push(lpTx);

      // 2. Send 30% to Paymaster Wallet
      const payrollTx = await this.sendToPaymaster(payrollAmount, revenue.currency);
      transactions.push(payrollTx);

      // 3. Send 20% to Founder Wallet
      const founderTx = await this.sendToFounder(founderAmount, revenue.currency);
      transactions.push(founderTx);

      // Log the distribution
      await this.logDistribution({
        revenueType: revenue.type,
        totalAmount: amount.toString(),
        lpAmount,
        payrollAmount,
        founderAmount,
        userId: revenue.userId,
        projectId: revenue.projectId,
        transactionHashes: transactions
      });

      return {
        lpAllocation: lpAmount,
        payrollAllocation: payrollAmount,
        founderAllocation: founderAmount,
        transactionHashes: transactions
      };

    } catch (error) {
      console.error("Revenue distribution failed:", error);
      throw error;
    }
  }

  // Process Stripe subscription payment
  private async processStripeSubscription(revenue: RevenueStream): Promise<any> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(revenue.amount) * 100), // Convert to cents
        currency: revenue.currency.toLowerCase(),
        description: `OmniAuthor Subscription - User ${revenue.userId}`,
        metadata: {
          userId: revenue.userId.toString(),
          subscriptionType: revenue.metadata?.plan || 'pro'
        }
      });

      return paymentIntent;
    } catch (error) {
      console.error("Stripe payment failed:", error);
      throw error;
    }
  }

  // Send funds to LP Pool
  private async sendToLPPool(amount: string, currency: string): Promise<string> {
    const wallet = await coinbaseIntegration.getOrCreateWallet(1); // Platform wallet
    
    const transfer = await wallet.createTransfer({
      amount,
      assetId: currency === 'ETH' ? 'eth' : coinbaseIntegration['platformTokenAddress'],
      destination: this.config.lpPoolAddress
    });
    
    await transfer.wait();
    return transfer.getTransactionHash();
  }

  // Send funds to Paymaster Wallet
  private async sendToPaymaster(amount: string, currency: string): Promise<string> {
    const wallet = await coinbaseIntegration.getOrCreateWallet(1);
    
    const transfer = await wallet.createTransfer({
      amount,
      assetId: currency === 'ETH' ? 'eth' : coinbaseIntegration['platformTokenAddress'],
      destination: this.config.paymasterWallet
    });
    
    await transfer.wait();
    return transfer.getTransactionHash();
  }

  // Send funds to Founder Wallet
  private async sendToFounder(amount: string, currency: string): Promise<string> {
    const wallet = await coinbaseIntegration.getOrCreateWallet(1);
    
    const transfer = await wallet.createTransfer({
      amount,
      assetId: currency === 'ETH' ? 'eth' : coinbaseIntegration['platformTokenAddress'],
      destination: this.config.founderWallet
    });
    
    await transfer.wait();
    return transfer.getTransactionHash();
  }

  // Log distribution for audit trail
  private async logDistribution(distribution: any): Promise<void> {
    // Store in database for audit purposes
    console.log("Revenue Distribution Logged:", distribution);
  }

  // Get tokenomics stats for admin panel
  async getTokenomicsStats(): Promise<{
    totalRevenue: string;
    lpAllocation: string;
    payrollAllocation: string;
    founderAllocation: string;
    subscriptionRevenue: string;
  }> {
    // Mock data - in production, this would come from database
    return {
      totalRevenue: "125.5",
      lpAllocation: "62.75",
      payrollAllocation: "37.65",
      founderAllocation: "25.1",
      subscriptionRevenue: "89.2"
    };
  }

  // Create subscription with Stripe
  async createStripeSubscription(userId: number, plan: 'pro' | 'enterprise'): Promise<any> {
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    
    const prices = {
      pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
    };

    try {
      const subscription = await stripe.subscriptions.create({
        customer: user?.metadata?.stripeCustomerId || await this.createStripeCustomer(user),
        items: [{ price: prices[plan] }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      console.error("Stripe subscription creation failed:", error);
      throw error;
    }
  }

  private async createStripeCustomer(user: any): Promise<string> {
    const customer = await stripe.customers.create({
      email: user?.email,
      name: `${user?.firstName} ${user?.lastName}`,
      metadata: {
        userId: user?.id?.toString()
      }
    });

    // Update user with Stripe customer ID
    await db.update(users)
      .set({
        metadata: {
          ...user?.metadata,
          stripeCustomerId: customer.id
        }
      })
      .where(eq(users.id, user.id));

    return customer.id;
  }
}

export const tokenomicsEngine = new TokenomicsEngine();
