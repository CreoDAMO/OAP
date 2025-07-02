
import { FastifyRequest, FastifyReply } from 'fastify';
import { analyzeText, generateText, improveText } from './ai';
import { db } from './db';
import { projects } from '@/shared/schema';

export interface PoeMessage {
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface PoeSession {
  sessionId: string;
  userId: number;
  context: 'writing' | 'analysis' | 'publishing' | 'collaboration';
  messages: PoeMessage[];
  activeProject?: number;
  preferences: {
    aiModel: string;
    writingStyle: string;
    responseLength: 'short' | 'medium' | 'long';
  };
}

export class PoeBotHandler {
  private sessions: Map<string, PoeSession> = new Map();

  async handlePoeWebhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { type, message, user_id, conversation_id } = request.body as any;
      
      switch (type) {
        case 'query':
          return await this.handleQuery(message, user_id, conversation_id);
        case 'settings':
          return await this.handleSettings(request.body);
        case 'report_feedback':
          return await this.handleFeedback(request.body);
        default:
          return { error: 'Unknown request type' };
      }
    } catch (error) {
      console.error('Poe webhook error:', error);
      return { error: 'Internal server error' };
    }
  }

  private async handleQuery(message: string, userId: string, conversationId: string) {
    const sessionId = `${userId}_${conversationId}`;
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        userId: parseInt(userId),
        context: 'writing',
        messages: [],
        preferences: {
          aiModel: 'gpt-4o',
          writingStyle: 'professional',
          responseLength: 'medium'
        }
      };
      this.sessions.set(sessionId, session);
    }

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Detect intent and context
    const intent = await this.detectIntent(message);
    const response = await this.generateResponse(session, intent, message);

    // Add bot response to session
    session.messages.push({
      role: 'bot',
      content: response,
      timestamp: new Date(),
      metadata: { intent }
    });

    return {
      text: response,
      data: {
        intent,
        suggestions: await this.generateSuggestions(session, intent)
      }
    };
  }

  private async detectIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Writing intents
    if (lowerMessage.includes('write') || lowerMessage.includes('generate') || lowerMessage.includes('create story')) {
      return 'write';
    }
    
    // Analysis intents
    if (lowerMessage.includes('analyze') || lowerMessage.includes('review') || lowerMessage.includes('feedback')) {
      return 'analyze';
    }
    
    // Improvement intents
    if (lowerMessage.includes('improve') || lowerMessage.includes('enhance') || lowerMessage.includes('better')) {
      return 'improve';
    }
    
    // Project management
    if (lowerMessage.includes('project') || lowerMessage.includes('save') || lowerMessage.includes('open')) {
      return 'project';
    }
    
    // Publishing
    if (lowerMessage.includes('publish') || lowerMessage.includes('royalty') || lowerMessage.includes('market')) {
      return 'publish';
    }
    
    // Collaboration
    if (lowerMessage.includes('collaborate') || lowerMessage.includes('share') || lowerMessage.includes('team')) {
      return 'collaborate';
    }
    
    return 'general';
  }

  private async generateResponse(session: PoeSession, intent: string, message: string): Promise<string> {
    switch (intent) {
      case 'write':
        return await this.handleWritingIntent(session, message);
      case 'analyze':
        return await this.handleAnalysisIntent(session, message);
      case 'improve':
        return await this.handleImprovementIntent(session, message);
      case 'project':
        return await this.handleProjectIntent(session, message);
      case 'publish':
        return await this.handlePublishingIntent(session, message);
      case 'collaborate':
        return await this.handleCollaborationIntent(session, message);
      default:
        return await this.handleGeneralIntent(session, message);
    }
  }

  private async handleWritingIntent(session: PoeSession, message: string): Promise<string> {
    try {
      // Extract writing prompt from message
      const prompt = message.replace(/^(write|generate|create)/i, '').trim();
      
      if (!prompt) {
        return "I'd love to help you write! Please tell me what you'd like me to write about. For example:\n• A short story about...\n• A character description for...\n• Dialogue between...\n• A scene where...";
      }

      const generatedText = await generateText(prompt, session.preferences.writingStyle);
      
      // Optionally save to active project
      if (session.activeProject) {
        await this.appendToProject(session.activeProject, generatedText);
        return `Here's what I wrote for you:\n\n${generatedText}\n\n✅ I've also added this to your active project.`;
      }
      
      return `Here's what I wrote for you:\n\n${generatedText}\n\n💡 Tip: Set an active project to automatically save generated content!`;
    } catch (error) {
      return "I had trouble generating that content. Could you try rephrasing your request?";
    }
  }

  private async handleAnalysisIntent(session: PoeSession, message: string): Promise<string> {
    // Extract text to analyze from message or use recent project content
    let textToAnalyze = '';
    
    if (session.activeProject) {
      const project = await db.select().from(projects)
        .where(eq(projects.id, session.activeProject))
        .get();
      textToAnalyze = project?.content || '';
    }
    
    if (!textToAnalyze) {
      return "I can analyze your writing! Please either:\n• Set an active project\n• Include the text you want analyzed in your message\n• Upload a document to analyze";
    }

    try {
      const analysis = await analyzeText(textToAnalyze);
      
      return `📊 **Writing Analysis Results:**

**Overall Score:** ${analysis.overallScore}/100

**Detailed Metrics:**
• Neural Coherence: ${analysis.neuralCoherence}/100
• Market Viability: ${analysis.marketViability}/100  
• Voice Signature: ${analysis.voiceSignature}/100
• Engagement Score: ${analysis.engagementScore}/100
• Technical Accuracy: ${analysis.technicalAccuracy}/100

**Key Recommendations:**
${analysis.recommendations.map(r => `• ${r}`).join('\n')}

**Market Prediction:**
${analysis.prediction}

*Analysis powered by ${analysis.aiModel} in ${analysis.processingTime}ms*`;
    } catch (error) {
      return "I couldn't analyze that text right now. Please try again or check if your text is properly formatted.";
    }
  }

  private async handleImprovementIntent(session: PoeSession, message: string): Promise<string> {
    if (!session.activeProject) {
      return "To improve your writing, please set an active project first. I can then enhance your content for clarity, engagement, dialogue, or pacing.";
    }

    const project = await db.select().from(projects)
      .where(eq(projects.id, session.activeProject))
      .get();
    
    if (!project?.content) {
      return "Your active project doesn't have any content to improve yet. Add some text first!";
    }

    // Detect improvement type from message
    const improvementType = this.detectImprovementType(message);
    
    try {
      const improvedText = await improveText(project.content, improvementType);
      
      return `✨ **Content Improved (${improvementType}):**

${improvedText}

Would you like me to save this improved version to your project?`;
    } catch (error) {
      return `I couldn't improve your text right now. Please try specifying what you'd like me to improve (clarity, engagement, dialogue, pacing, etc.)`;
    }
  }

  private async handleProjectIntent(session: PoeSession, message: string): Promise<string> {
    const userProjects = await db.select()
      .from(projects)
      .where(eq(projects.userId, session.userId))
      .limit(10);

    if (message.toLowerCase().includes('list') || message.toLowerCase().includes('show')) {
      if (userProjects.length === 0) {
        return "You don't have any projects yet. Would you like me to help you create one?";
      }
      
      const projectList = userProjects.map((p, i) => 
        `${i + 1}. **${p.title}** (${p.genre || 'No genre'}) - ${p.content.split(' ').length} words`
      ).join('\n');
      
      return `📚 **Your Projects:**\n\n${projectList}\n\nSay "open project [number]" to set one as active.`;
    }

    if (message.toLowerCase().includes('open') || message.toLowerCase().includes('active')) {
      const match = message.match(/\d+/);
      if (match) {
        const projectIndex = parseInt(match[0]) - 1;
        if (projectIndex < userProjects.length) {
          session.activeProject = userProjects[projectIndex].id;
          return `✅ Set "${userProjects[projectIndex].title}" as your active project. I can now help you write, analyze, and improve this project!`;
        }
      }
      return "Please specify which project number you'd like to open (e.g., 'open project 2').";
    }

    return "I can help you manage your projects! Try:\n• 'list projects' - show all projects\n• 'open project [number]' - set active project\n• 'create new project' - start a new project";
  }

  private async handlePublishingIntent(session: PoeSession, message: string): Promise<string> {
    return `📖 **Publishing Assistant**

I can help you with:
• **Royalty calculations** for different platforms
• **Market analysis** for your genre
• **Publishing workflow** automation
• **Metadata optimization** for discoverability

What would you like to know about publishing your work?`;
  }

  private async handleCollaborationIntent(session: PoeSession, message: string): Promise<string> {
    return `👥 **Collaboration Features**

I can help you:
• Start **real-time collaboration** sessions
• Manage **co-writing** with other authors  
• Handle **version control** and conflict resolution
• Set up **shared workspaces**

Would you like to start a collaboration session or learn more about these features?`;
  }

  private async handleGeneralIntent(session: PoeSession, message: string): Promise<string> {
    const helpText = `🤖 **OmniAuthor Assistant**

I'm here to help with your writing journey! I can:

**✍️ Writing**
• Generate content from prompts
• Continue your stories
• Create characters and dialogue

**📊 Analysis** 
• Analyze your writing quality
• Provide market insights
• Give improvement suggestions

**🔧 Tools**
• Manage your projects
• Calculate royalties
• Handle collaboration

**🚀 Publishing**
• Automate publishing workflows
• Optimize for different platforms
• Protect intellectual property

What would you like to work on today?`;

    return helpText;
  }

  private detectImprovementType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('clarity') || lowerMessage.includes('clear')) return 'clarity';
    if (lowerMessage.includes('engagement') || lowerMessage.includes('engaging')) return 'engagement';
    if (lowerMessage.includes('dialogue') || lowerMessage.includes('conversation')) return 'dialogue';
    if (lowerMessage.includes('description') || lowerMessage.includes('detail')) return 'description';
    if (lowerMessage.includes('pacing') || lowerMessage.includes('flow')) return 'pacing';
    if (lowerMessage.includes('grammar') || lowerMessage.includes('style')) return 'grammar';
    
    return 'clarity'; // default
  }

  private async generateSuggestions(session: PoeSession, intent: string): Promise<string[]> {
    switch (intent) {
      case 'write':
        return [
          "Generate a character backstory",
          "Create a dramatic scene",
          "Write compelling dialogue",
          "Develop a plot twist"
        ];
      case 'analyze':
        return [
          "Analyze writing style",
          "Check market viability", 
          "Review engagement level",
          "Assess readability"
        ];
      case 'improve':
        return [
          "Enhance clarity",
          "Improve dialogue",
          "Strengthen descriptions",
          "Fix pacing issues"
        ];
      default:
        return [
          "Start writing project",
          "Analyze my work",
          "Get publishing help",
          "Setup collaboration"
        ];
    }
  }

  private async appendToProject(projectId: number, content: string): Promise<void> {
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
    if (project) {
      const updatedContent = project.content + '\n\n' + content;
      await db.update(projects)
        .set({ content: updatedContent, updatedAt: new Date() })
        .where(eq(projects.id, projectId));
    }
  }

  private async handleSettings(body: any) {
    return {
      server_bot_dependencies: {
        "OmniAuthor": 1
      },
      allow_without_cookie: true,
      introduction_message: "🤖 Hi! I'm your OmniAuthor writing assistant. I can help you write, analyze, and publish your work. What would you like to create today?"
    };
  }

  private async handleFeedback(body: any) {
    // Log feedback for improvement
    console.log('Poe bot feedback:', body);
    return { success: true };
  }
}
