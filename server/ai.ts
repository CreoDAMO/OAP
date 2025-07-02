import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_SECRET_KEY || "default_key" 
});

export interface AnalysisResult {
  neuralCoherence: number;
  marketViability: number;
  voiceSignature: number;
  engagementScore: number;
  technicalAccuracy: number;
  overallScore: number;
  recommendations: string[];
  prediction: string;
}

export async function analyzeText(text: string, genre?: string): Promise<AnalysisResult> {
  try {
    const prompt = `Analyze the following text for writing quality and market potential. Consider the genre: ${genre || 'general'}.

Text to analyze:
${text}

Provide a detailed analysis with scores from 1-100 for each metric. Return your response as JSON with this exact format:
{
  "neuralCoherence": number,
  "marketViability": number,
  "voiceSignature": number,
  "engagementScore": number,
  "technicalAccuracy": number,
  "overallScore": number,
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "prediction": "detailed prediction about market potential and reader engagement"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert writing analyst with deep knowledge of publishing markets, reader psychology, and narrative structure. Provide detailed, actionable analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    // Ensure all scores are within 1-100 range
    return {
      neuralCoherence: Math.max(1, Math.min(100, Math.round(result.neuralCoherence))),
      marketViability: Math.max(1, Math.min(100, Math.round(result.marketViability))),
      voiceSignature: Math.max(1, Math.min(100, Math.round(result.voiceSignature))),
      engagementScore: Math.max(1, Math.min(100, Math.round(result.engagementScore))),
      technicalAccuracy: Math.max(1, Math.min(100, Math.round(result.technicalAccuracy))),
      overallScore: Math.max(1, Math.min(100, Math.round(result.overallScore))),
      recommendations: result.recommendations || [],
      prediction: result.prediction || "Analysis pending additional data"
    };
  } catch (error) {
    throw new Error("Failed to analyze text: " + (error as Error).message);
  }
}

export async function generateText(prompt: string, style?: string): Promise<string> {
  try {
    const systemPrompt = style 
      ? `You are a creative writing assistant specializing in ${style} style. Generate compelling, original content that matches the requested style and tone.`
      : "You are a creative writing assistant. Generate compelling, original content based on the user's prompt.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error("Failed to generate text: " + (error as Error).message);
  }
}

export async function improveText(text: string, improvementType: string): Promise<string> {
  try {
    const prompt = `Improve the following text by focusing on ${improvementType}:

Original text:
${text}

Please provide an improved version that enhances ${improvementType} while maintaining the original meaning and style.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert editor and writing coach. Provide constructive improvements while preserving the author's voice and intent."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    throw new Error("Failed to improve text: " + (error as Error).message);
  }
}
