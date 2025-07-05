import { SupabaseClient } from '@supabase/supabase-js';
import { pineconeService } from './pinecone'
import { geminiService } from './gemini'
import { TableName } from '@/helpers/string_const/tables'

interface ProcessMessageParams {
  message: string;
  chatbotId: string;
  sessionId: string;
  chatbotConfig: {
    personality: string;
    welcome_message: string;
    name: string;
    pinecone_namespace: string | null;
  };
}

export class ChatService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async processMessage({ message, chatbotId, sessionId, chatbotConfig }: ProcessMessageParams) {
    const { personality, name, pinecone_namespace } = chatbotConfig;

    if (!pinecone_namespace) {
      return { success: false, error: 'Chatbot not properly configured with Pinecone namespace' };
    }

    // Convert user message to embeddings
    const embeddingResult = await pineconeService.createEmbeddings(message);

    if (!embeddingResult.success || !embeddingResult.embeddings) {
      return { success: false, error: 'Failed to create embeddings' };
    }

    // Search for relevant context in Pinecone
    const searchResult = await pineconeService.searchSimilarWithEmbeddings(
      embeddingResult.embeddings,
      pinecone_namespace,
      40, // Top 40 relevant chunks
      undefined
    );

    if (!searchResult.success) {
      return { success: false, error: 'Failed to search knowledge base' };
    }

    // Extract context from search results
    const context = searchResult.results
      ?.map(result => result.metadata?.text || '')
      .filter(text => text.length > 0)
      .join('\n\n') || 'No specific context found for this query.';

    // Generate system prompt for the chatbot personality
    const systemPrompt = this.getSystemPrompt(personality, name);

    // Generate response using Gemini
    const geminiResult = await geminiService.generateChatResponse({
      message,
      context,
      systemPrompt
    });

    if (!geminiResult.success || !geminiResult.response) {
      return { success: false, error: 'Failed to generate response' };
    }

    // Store assistant message
    const { error: assistantMessageError } = await this.supabase
      .from(TableName.CHAT_MESSAGES)
      .insert({
        session_id: sessionId,
        chatbot_id: chatbotId,
        message_type: 'assistant',
        response: geminiResult.response
      });

    if (assistantMessageError) {
      console.error('⚠️ Failed to store assistant message:', assistantMessageError);
    }

    return { success: true, data: { response: geminiResult.response } };
  }

  // Create a system prompt for the chatbot's personality
  private getSystemPrompt(personality: string, chatbotName: string): string {
    return `You are ${chatbotName}, an AI assistant with a ${personality} personality. Answer the questions based on the information provided.`;
  }
}

export const createChatService = (supabaseClient: SupabaseClient) => {
  return new ChatService(supabaseClient);
};

