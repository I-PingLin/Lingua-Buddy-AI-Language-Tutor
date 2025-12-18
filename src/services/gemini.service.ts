import { Injectable } from '@angular/core';
import { GoogleGenAI, Chat } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not set.");
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  startChat(language: string): Chat {
    const chat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a friendly and patient language tutor for ${language}. 
        Your goal is to help me practice my conversational skills. 
        Keep your responses concise and natural, as if in a real conversation.
        If I make a mistake, gently correct it and briefly explain why. 
        Encourage me to continue the conversation. Start by greeting me in ${language}.`,
      }
    });
    return chat;
  }
}
