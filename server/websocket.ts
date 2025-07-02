
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';

export interface CollaborationSession {
  sessionId: string;
  projectId: number;
  users: Map<string, UserSession>;
  document: CollaborativeDocument;
  conflictResolver: ConflictResolver;
}

export interface UserSession {
  userId: number;
  username: string;
  ws: any;
  cursor: { line: number; column: number };
  selection: { start: number; end: number };
  lastActivity: Date;
}

export interface CollaborativeDocument {
  content: string;
  version: number;
  operations: Operation[];
  checkpoints: DocumentCheckpoint[];
}

export interface Operation {
  id: string;
  userId: number;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  timestamp: Date;
  applied: boolean;
}

export interface DocumentCheckpoint {
  version: number;
  content: string;
  timestamp: Date;
  operations: Operation[];
}

class ConflictResolver {
  private pendingOperations: Map<string, Operation[]> = new Map();

  resolveConflicts(operations: Operation[]): Operation[] {
    // Operational Transform algorithm for conflict resolution
    const resolved: Operation[] = [];
    
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      let transformedOp = { ...op };
      
      // Transform against all previous operations
      for (let j = 0; j < i; j++) {
        transformedOp = this.transformOperation(transformedOp, operations[j]);
      }
      
      resolved.push(transformedOp);
    }
    
    return resolved;
  }

  private transformOperation(op1: Operation, op2: Operation): Operation {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return { ...op1, position: op1.position };
      } else {
        return { ...op1, position: op1.position + (op2.content?.length || 0) };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return { ...op1, position: op1.position + (op2.content?.length || 0) };
      }
    }
    
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return { ...op1, position: Math.max(op1.position - (op2.length || 0), op2.position) };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return { ...op1, position: Math.max(op1.position - (op2.length || 0), op2.position) };
      }
    }
    
    return op1;
  }
}

export class CollaborationManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private wss: WebSocketServer;

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/collaboration'
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });
  }

  private handleConnection(ws: any, request: IncomingMessage) {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const userId = parseInt(url.searchParams.get('userId') || '0');
    const username = url.searchParams.get('username') || 'Anonymous';

    if (!sessionId || !userId) {
      ws.close(1008, 'Missing required parameters');
      return;
    }

    const userSession: UserSession = {
      userId,
      username,
      ws,
      cursor: { line: 0, column: 0 },
      selection: { start: 0, end: 0 },
      lastActivity: new Date()
    };

    // Join or create collaboration session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        projectId: parseInt(url.searchParams.get('projectId') || '0'),
        users: new Map(),
        document: {
          content: '',
          version: 0,
          operations: [],
          checkpoints: []
        },
        conflictResolver: new ConflictResolver()
      };
      this.sessions.set(sessionId, session);
    }

    session.users.set(userId.toString(), userSession);

    // Send initial state
    ws.send(JSON.stringify({
      type: 'session_joined',
      sessionId,
      document: session.document,
      users: Array.from(session.users.values()).map(u => ({
        userId: u.userId,
        username: u.username,
        cursor: u.cursor,
        selection: u.selection
      }))
    }));

    // Broadcast user joined
    this.broadcastToSession(session, {
      type: 'user_joined',
      user: { userId, username, cursor: userSession.cursor, selection: userSession.selection }
    }, [userId]);

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(session!, userSession, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      session?.users.delete(userId.toString());
      this.broadcastToSession(session!, {
        type: 'user_left',
        userId
      });

      // Clean up empty sessions
      if (session?.users.size === 0) {
        this.sessions.delete(sessionId);
      }
    });
  }

  private handleMessage(session: CollaborationSession, user: UserSession, message: any) {
    user.lastActivity = new Date();

    switch (message.type) {
      case 'operation':
        this.handleOperation(session, user, message.operation);
        break;
      case 'cursor_update':
        user.cursor = message.cursor;
        this.broadcastToSession(session, {
          type: 'cursor_update',
          userId: user.userId,
          cursor: message.cursor
        }, [user.userId]);
        break;
      case 'selection_update':
        user.selection = message.selection;
        this.broadcastToSession(session, {
          type: 'selection_update',
          userId: user.userId,
          selection: message.selection
        }, [user.userId]);
        break;
    }
  }

  private handleOperation(session: CollaborationSession, user: UserSession, operation: Operation) {
    // Add metadata to operation
    operation.id = `${user.userId}_${Date.now()}_${Math.random().toString(36)}`;
    operation.userId = user.userId;
    operation.timestamp = new Date();
    operation.applied = false;

    // Add to pending operations
    session.document.operations.push(operation);

    // Resolve conflicts
    const unresolvedOps = session.document.operations.filter(op => !op.applied);
    const resolvedOps = session.conflictResolver.resolveConflicts(unresolvedOps);

    // Apply operations in order
    for (const op of resolvedOps) {
      this.applyOperation(session.document, op);
      op.applied = true;
    }

    session.document.version++;

    // Create checkpoint every 50 operations
    if (session.document.operations.length % 50 === 0) {
      session.document.checkpoints.push({
        version: session.document.version,
        content: session.document.content,
        timestamp: new Date(),
        operations: [...session.document.operations]
      });
    }

    // Broadcast the resolved operation
    this.broadcastToSession(session, {
      type: 'operation_applied',
      operation,
      document: {
        content: session.document.content,
        version: session.document.version
      }
    });
  }

  private applyOperation(document: CollaborativeDocument, operation: Operation) {
    switch (operation.type) {
      case 'insert':
        document.content = 
          document.content.slice(0, operation.position) +
          (operation.content || '') +
          document.content.slice(operation.position);
        break;
      case 'delete':
        document.content = 
          document.content.slice(0, operation.position) +
          document.content.slice(operation.position + (operation.length || 0));
        break;
    }
  }

  private broadcastToSession(session: CollaborationSession, message: any, excludeUsers: number[] = []) {
    const messageStr = JSON.stringify(message);
    session.users.forEach((user) => {
      if (!excludeUsers.includes(user.userId) && user.ws.readyState === 1) {
        user.ws.send(messageStr);
      }
    });
  }
}
