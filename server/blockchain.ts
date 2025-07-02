
import crypto from 'crypto';
import { db } from './db';
import { ipAssets, ipTransactions } from '@/shared/schema';

export interface IPAsset {
  id: string;
  userId: number;
  projectId: number;
  assetType: 'copyright' | 'trademark' | 'patent' | 'trade_secret';
  title: string;
  description: string;
  contentHash: string;
  blockchainAddress: string;
  transactionHash: string;
  registrationDate: Date;
  expirationDate?: Date;
  metadata: any;
}

export interface IPTransaction {
  id: string;
  assetId: string;
  fromUserId?: number;
  toUserId?: number;
  transactionType: 'register' | 'transfer' | 'license' | 'verify';
  amount?: number;
  royaltyPercentage?: number;
  metadata: any;
  blockchainHash: string;
  timestamp: Date;
}

export interface LicenseAgreement {
  id: string;
  assetId: string;
  licensorId: number;
  licenseeId: number;
  licenseType: 'exclusive' | 'non_exclusive' | 'creative_commons';
  duration: number; // in days
  royaltyRate: number;
  territory: string[];
  restrictions: string[];
  active: boolean;
}

class SmartContract {
  private contractAddress: string;
  private abi: any[];

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
    // Simplified ABI for IP management
    this.abi = [
      {
        name: 'registerIP',
        inputs: [
          { name: 'contentHash', type: 'string' },
          { name: 'metadata', type: 'string' }
        ],
        outputs: [{ name: 'tokenId', type: 'uint256' }]
      },
      {
        name: 'transferIP',
        inputs: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'to', type: 'address' }
        ]
      },
      {
        name: 'createLicense',
        inputs: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'licensee', type: 'address' },
          { name: 'royaltyRate', type: 'uint256' },
          { name: 'duration', type: 'uint256' }
        ]
      }
    ];
  }

  // Simulate blockchain interaction
  async registerIP(contentHash: string, metadata: any): Promise<string> {
    // Generate a mock transaction hash
    const txHash = crypto.createHash('sha256')
      .update(`register_${contentHash}_${Date.now()}`)
      .digest('hex');
    
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return txHash;
  }

  async transferIP(tokenId: string, fromAddress: string, toAddress: string): Promise<string> {
    const txHash = crypto.createHash('sha256')
      .update(`transfer_${tokenId}_${fromAddress}_${toAddress}_${Date.now()}`)
      .digest('hex');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    return txHash;
  }

  async verifyOwnership(tokenId: string, ownerAddress: string): Promise<boolean> {
    // Simulate blockchain verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true; // Mock verification
  }
}

export class BlockchainIPManager {
  private smartContract: SmartContract;
  private ipfsGateway: string = 'https://ipfs.io/ipfs/';

  constructor() {
    // Mock contract address for development
    this.smartContract = new SmartContract('0x742d35Cc6640C1e7e3B8a37B87d3F9C68b9f13D1');
  }

  async registerIntellectualProperty(
    userId: number,
    projectId: number,
    assetType: IPAsset['assetType'],
    title: string,
    description: string,
    content: string,
    metadata: any = {}
  ): Promise<IPAsset> {
    // Generate content hash
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Upload to IPFS (simulated)
    const ipfsHash = await this.uploadToIPFS(content, metadata);
    
    // Register on blockchain
    const transactionHash = await this.smartContract.registerIP(contentHash, JSON.stringify(metadata));
    
    // Generate blockchain address (mock)
    const blockchainAddress = crypto.createHash('sha256')
      .update(`${userId}_${projectId}_${Date.now()}`)
      .digest('hex')
      .substring(0, 42);

    const ipAsset: IPAsset = {
      id: crypto.randomUUID(),
      userId,
      projectId,
      assetType,
      title,
      description,
      contentHash,
      blockchainAddress,
      transactionHash,
      registrationDate: new Date(),
      expirationDate: assetType === 'copyright' ? new Date(Date.now() + 70 * 365 * 24 * 60 * 60 * 1000) : undefined,
      metadata: {
        ...metadata,
        ipfsHash,
        blockchainNetwork: 'ethereum',
        gasUsed: Math.floor(Math.random() * 100000) + 50000
      }
    };

    // Store in database
    await db.insert(ipAssets).values(ipAsset);

    // Record transaction
    await this.recordTransaction({
      id: crypto.randomUUID(),
      assetId: ipAsset.id,
      toUserId: userId,
      transactionType: 'register',
      metadata: {
        registrationFee: 0.01, // ETH
        gasPrice: '20 gwei'
      },
      blockchainHash: transactionHash,
      timestamp: new Date()
    });

    return ipAsset;
  }

  async transferOwnership(assetId: string, fromUserId: number, toUserId: number): Promise<IPTransaction> {
    const asset = await db.select().from(ipAssets).where(eq(ipAssets.id, assetId)).get();
    if (!asset) throw new Error('Asset not found');
    if (asset.userId !== fromUserId) throw new Error('Unauthorized transfer');

    // Generate addresses (mock)
    const fromAddress = crypto.createHash('sha256').update(`user_${fromUserId}`).digest('hex').substring(0, 42);
    const toAddress = crypto.createHash('sha256').update(`user_${toUserId}`).digest('hex').substring(0, 42);

    // Execute blockchain transfer
    const transactionHash = await this.smartContract.transferIP(assetId, fromAddress, toAddress);

    // Update ownership in database
    await db.update(ipAssets)
      .set({ userId: toUserId })
      .where(eq(ipAssets.id, assetId));

    // Record transaction
    const transaction: IPTransaction = {
      id: crypto.randomUUID(),
      assetId,
      fromUserId,
      toUserId,
      transactionType: 'transfer',
      metadata: {
        transferFee: 0.005,
        gasUsed: Math.floor(Math.random() * 50000) + 25000
      },
      blockchainHash: transactionHash,
      timestamp: new Date()
    };

    await this.recordTransaction(transaction);
    return transaction;
  }

  async createLicenseAgreement(
    assetId: string,
    licensorId: number,
    licenseeId: number,
    terms: Partial<LicenseAgreement>
  ): Promise<LicenseAgreement> {
    const asset = await db.select().from(ipAssets).where(eq(ipAssets.id, assetId)).get();
    if (!asset) throw new Error('Asset not found');
    if (asset.userId !== licensorId) throw new Error('Unauthorized licensing');

    const agreement: LicenseAgreement = {
      id: crypto.randomUUID(),
      assetId,
      licensorId,
      licenseeId,
      licenseType: terms.licenseType || 'non_exclusive',
      duration: terms.duration || 365,
      royaltyRate: terms.royaltyRate || 0.1,
      territory: terms.territory || ['worldwide'],
      restrictions: terms.restrictions || [],
      active: true
    };

    // Record licensing transaction
    await this.recordTransaction({
      id: crypto.randomUUID(),
      assetId,
      fromUserId: licensorId,
      toUserId: licenseeId,
      transactionType: 'license',
      royaltyPercentage: agreement.royaltyRate,
      metadata: {
        licenseId: agreement.id,
        duration: agreement.duration,
        territory: agreement.territory
      },
      blockchainHash: crypto.createHash('sha256')
        .update(`license_${agreement.id}_${Date.now()}`)
        .digest('hex'),
      timestamp: new Date()
    });

    return agreement;
  }

  async verifyOwnership(assetId: string, userId: number): Promise<boolean> {
    const asset = await db.select().from(ipAssets).where(eq(ipAssets.id, assetId)).get();
    if (!asset) return false;

    // Verify on blockchain
    const userAddress = crypto.createHash('sha256').update(`user_${userId}`).digest('hex').substring(0, 42);
    const isValid = await this.smartContract.verifyOwnership(assetId, userAddress);

    return isValid && asset.userId === userId;
  }

  private async uploadToIPFS(content: string, metadata: any): Promise<string> {
    // Simulate IPFS upload
    const hash = crypto.createHash('sha256')
      .update(content + JSON.stringify(metadata))
      .digest('hex');
    
    // Mock IPFS hash format
    return `Qm${hash.substring(0, 44)}`;
  }

  private async recordTransaction(transaction: IPTransaction): Promise<void> {
    await db.insert(ipTransactions).values(transaction);
  }

  async getRoyaltyDistribution(assetId: string, revenue: number): Promise<any> {
    // Get all license agreements for this asset
    const licenses = await db.select()
      .from(ipTransactions)
      .where(and(
        eq(ipTransactions.assetId, assetId),
        eq(ipTransactions.transactionType, 'license')
      ));

    const distribution = licenses.map(license => ({
      licenseeId: license.toUserId,
      royaltyAmount: revenue * (license.royaltyPercentage || 0),
      percentage: license.royaltyPercentage || 0
    }));

    return {
      totalRevenue: revenue,
      distributions: distribution,
      ownerShare: revenue - distribution.reduce((sum, d) => sum + d.royaltyAmount, 0)
    };
  }
}
