import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { rustEngine } from '../client/src/lib/rust-engine';

export interface CollaborationUser {
  userId: number;
  username: string;
  cursor: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  color: string;
  lastActivity: number;
}

export interface DocumentChange {
  changeId: string;
  userId: number;
  timestamp: number;
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  length?: number;
  version: number;
}

export interface ConflictResolution {
  conflictId: string;
  changes: DocumentChange[];
  resolution: 'auto' | 'manual';
  resolvedContent: string;
  timestamp: number;
}

class CollaborationManager {
  private wss: WebSocketServer | null = null;
  private activeDocuments = new Map<string, {
    content: string;
    version: number;
    users: Map<number, CollaborationUser>;
    changes: DocumentChange[];
    lastSaved: number;
  }>();
  private userConnections = new Map<number, WebSocket>();
  private documentUsers = new Map<string, Set<number>>();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/collaboration' 
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New collaboration WebSocket connection');
      
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'join_document':
        await this.handleJoinDocument(ws, message);
        break;
      case 'document_change':
        await this.handleDocumentChange(ws, message);
        break;
      case 'cursor_update':
        this.handleCursorUpdate(ws, message);
        break;
      case 'save_document':
        await this.handleSaveDocument(ws, message);
        break;
      case 'request_suggestions':
        await this.handleSuggestionRequest(ws, message);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private async handleJoinDocument(ws: WebSocket, message: any): Promise<void> {
    const { documentId, userId, username } = message;
    
    if (!this.activeDocuments.has(documentId)) {
      this.activeDocuments.set(documentId, {
        content: '',
        version: 1,
        users: new Map(),
        changes: [],
        lastSaved: Date.now()
      });
      this.documentUsers.set(documentId, new Set());
    }

    const document = this.activeDocuments.get(documentId)!;
    const documentUserSet = this.documentUsers.get(documentId)!;

    // Add user to document
    const userColor = this.generateUserColor(userId);
    const collaborationUser: CollaborationUser = {
      userId,
      username,
      cursor: { line: 0, column: 0 },
      color: userColor,
      lastActivity: Date.now()
    };

    document.users.set(userId, collaborationUser);
    documentUserSet.add(userId);
    this.userConnections.set(userId, ws);

    // Send current document state to new user
    ws.send(JSON.stringify({
      type: 'document_joined',
      documentId,
      content: document.content,
      version: document.version,
      users: Array.from(document.users.values()),
      recentChanges: document.changes.slice(-10)
    }));

    // Notify other users
    this.broadcastToDocument(documentId, {
      type: 'user_joined',
      user: collaborationUser
    }, userId);
  }

  private async handleDocumentChange(ws: WebSocket, message: any): Promise<void> {
    const { documentId, change } = message;
    const document = this.activeDocuments.get(documentId);
    
    if (!document) {
      ws.send(JSON.stringify({ type: 'error', message: 'Document not found' }));
      return;
    }

    // Validate change version
    if (change.version !== document.version) {
      // Handle version conflict
      const conflictResolution = await this.resolveVersionConflict(documentId, change);
      ws.send(JSON.stringify({
        type: 'conflict_resolution',
        resolution: conflictResolution
      }));
      return;
    }

    // Apply change to document
    const newContent = this.applyChange(document.content, change);
    const changeRecord: DocumentChange = {
      changeId: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: change.userId,
      timestamp: Date.now(),
      operation: change.operation,
      position: change.position,
      content: change.content,
      length: change.length,
      version: document.version + 1
    };

    document.content = newContent;
    document.version += 1;
    document.changes.push(changeRecord);

    // Keep only last 100 changes for memory management
    if (document.changes.length > 100) {
      document.changes = document.changes.slice(-100);
    }

    // Update user activity
    const user = document.users.get(change.userId);
    if (user) {
      user.lastActivity = Date.now();
    }

    // Broadcast change to all users except sender
    this.broadcastToDocument(documentId, {
      type: 'document_updated',
      change: changeRecord,
      newContent: newContent,
      version: document.version
    }, change.userId);

    // Send confirmation to sender
    ws.send(JSON.stringify({
      type: 'change_applied',
      changeId: changeRecord.changeId,
      version: document.version
    }));
  }

  private handleCursorUpdate(ws: WebSocket, message: any): void {
    const { documentId, userId, cursor, selection } = message;
    const document = this.activeDocuments.get(documentId);
    
    if (!document) return;

    const user = document.users.get(userId);
    if (user) {
      user.cursor = cursor;
      user.selection = selection;
      user.lastActivity = Date.now();

      this.broadcastToDocument(documentId, {
        type: 'cursor_updated',
        userId,
        cursor,
        selection
      }, userId);
    }
  }

  private async handleSaveDocument(ws: WebSocket, message: any): Promise<void> {
    const { documentId } = message;
    const document = this.activeDocuments.get(documentId);
    
    if (!document) {
      ws.send(JSON.stringify({ type: 'error', message: 'Document not found' }));
      return;
    }

    try {
      // Here you would save to your database
      // For now, we'll just update the lastSaved timestamp
      document.lastSaved = Date.now();

      this.broadcastToDocument(documentId, {
        type: 'document_saved',
        timestamp: document.lastSaved,
        version: document.version
      });
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to save document: ' + (error as Error).message 
      }));
    }
  }

  private async handleSuggestionRequest(ws: WebSocket, message: any): Promise<void> {
    const { documentId, cursorPosition, context } = message;
    const document = this.activeDocuments.get(documentId);
    
    if (!document) {
      ws.send(JSON.stringify({ type: 'error', message: 'Document not found' }));
      return;
    }

    try {
      // Use Rust engine for performance optimization
      const suggestions = await rustEngine.optimizeText(document.content);
      
      ws.send(JSON.stringify({
        type: 'suggestions_generated',
        suggestions,
        documentVersion: document.version
      }));
    } catch (error) {
      console.error('Error generating suggestions:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to generate suggestions' 
      }));
    }
  }

  private applyChange(content: string, change: DocumentChange): string {
    switch (change.operation) {
      case 'insert':
        return content.slice(0, change.position) + change.content + content.slice(change.position);
      case 'delete':
        return content.slice(0, change.position) + content.slice(change.position + (change.length || 0));
      case 'replace':
        return content.slice(0, change.position) + change.content + content.slice(change.position + (change.length || 0));
      default:
        return content;
    }
  }

  private async resolveVersionConflict(documentId: string, incomingChange: DocumentChange): Promise<ConflictResolution> {
    const document = this.activeDocuments.get(documentId)!;
    const conflictingChanges = document.changes.filter(c => 
      c.version > incomingChange.version && 
      this.changesOverlap(c, incomingChange)
    );

    try {
      // Use Rust engine for conflict resolution
      const conflicts = conflictingChanges.map(c => ({
        conflict_id: c.changeId,
        conflict_type: 'text_modification',
        start_pos: c.position,
        end_pos: c.position + (c.length || c.content.length),
        user_a_change: c.content,
        user_b_change: incomingChange.content,
        timestamp: new Date(c.timestamp).toISOString(),
        resolution_suggestion: ''
      }));

      const resolvedConflicts = await rustEngine.resolveConflicts(conflicts);
      const resolvedContent = this.applyResolution(document.content, resolvedConflicts[0]);

      return {
        conflictId: `conflict_${Date.now()}`,
        changes: [incomingChange, ...conflictingChanges],
        resolution: 'auto',
        resolvedContent,
        timestamp: Date.now()
      };
    } catch (error) {
      // Fallback to manual resolution
      return {
        conflictId: `conflict_${Date.now()}`,
        changes: [incomingChange, ...conflictingChanges],
        resolution: 'manual',
        resolvedContent: document.content,
        timestamp: Date.now()
      };
    }
  }

  private changesOverlap(change1: DocumentChange, change2: DocumentChange): boolean {
    const end1 = change1.position + (change1.length || change1.content.length);
    const end2 = change2.position + (change2.length || change2.content.length);
    
    return !(end1 <= change2.position || end2 <= change1.position);
  }

  private applyResolution(content: string, resolution: any): string {
    // Apply the resolved conflict back to the content
    return content; // Simplified for now
  }

  private broadcastToDocument(documentId: string, message: any, excludeUserId?: number): void {
    const documentUserSet = this.documentUsers.get(documentId);
    if (!documentUserSet) return;

    documentUserSet.forEach(userId => {
      if (userId !== excludeUserId) {
        const ws = this.userConnections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
    });
  }

  private handleDisconnection(ws: WebSocket): void {
    // Find and remove user from all documents
    for (const [userId, connection] of this.userConnections.entries()) {
      if (connection === ws) {
        this.userConnections.delete(userId);
        
        // Remove from all documents
        for (const [documentId, document] of this.activeDocuments.entries()) {
          if (document.users.has(userId)) {
            const user = document.users.get(userId)!;
            document.users.delete(userId);
            this.documentUsers.get(documentId)?.delete(userId);
            
            this.broadcastToDocument(documentId, {
              type: 'user_left',
              userId,
              username: user.username
            });
          }
        }
        break;
      }
    }
  }

  private generateUserColor(userId: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[userId % colors.length];
  }

  // Clean up inactive documents periodically
  public cleanupInactiveDocuments(): void {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30 minutes

    for (const [documentId, document] of this.activeDocuments.entries()) {
      if (document.users.size === 0 && (now - document.lastSaved) > INACTIVE_THRESHOLD) {
        this.activeDocuments.delete(documentId);
        this.documentUsers.delete(documentId);
        console.log(`Cleaned up inactive document: ${documentId}`);
      }
    }
  }
}

export const collaborationManager = new CollaborationManager();

// Clean up inactive documents every 10 minutes
setInterval(() => {
  collaborationManager.cleanupInactiveDocuments();
}, 10 * 60 * 1000);