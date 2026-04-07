import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface HealthAdvice {
  role: 'user' | 'model';
  text: string;
}

export async function getHealthTrackingAdvice(history: any[], profile: any, biometrics: any, userMessage: string) {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are Aura AI, a sophisticated health intelligence agent for AuraNutrics. 
  Your goal is to track and analyze pediatric/adolescent nutrition and health data.
  
  User Profile: ${JSON.stringify(profile)}
  Recent Meals: ${JSON.stringify(history)}
  Current Biometrics: ${JSON.stringify(biometrics)}
  
  Provide predictive health intelligence, detect latent micronutrient deficiencies, and offer precision micro-interventions.
  Be professional, clinical yet approachable, and focused on data-driven storytelling.
  Always respond in Markdown.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: userMessage }
        ]
      }
    ],
    config: {
      systemInstruction,
    }
  });

  return response.text;
}
