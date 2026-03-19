import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface NutritionalAnalysis {
  foodName: string;
  calories: number;
  macronutrients: {
    protein: number;
    carbs: number;
    fat: number;
  };
  micronutrients: {
    name: string;
    amount: number;
    unit: string;
    percentageOfRDA: number;
  }[];
  healthInsights: string;
  predictiveRisk: string;
}

export async function analyzeFoodImage(base64Image: string): Promise<NutritionalAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this food image for a pediatric/adolescent nutrition platform. Provide detailed nutritional data including micronutrients and predictive health insights regarding latent deficiencies. Return the response in JSON format.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          macronutrients: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
            },
            required: ["protein", "carbs", "fat"],
          },
          micronutrients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                percentageOfRDA: { type: Type.NUMBER },
              },
              required: ["name", "amount", "unit", "percentageOfRDA"],
            },
          },
          healthInsights: { type: Type.STRING },
          predictiveRisk: { type: Type.STRING },
        },
        required: ["foodName", "calories", "macronutrients", "micronutrients", "healthInsights", "predictiveRisk"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function getPredictiveInsights(history: any[], biometrics: any) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Based on the following nutritional history: ${JSON.stringify(history)} and current biometrics: ${JSON.stringify(biometrics)}, provide a predictive health analysis for a pediatric user. Focus on latent micronutrient deficiencies and precision micro-interventions. Return as Markdown.`,
  });
  return response.text;
}
