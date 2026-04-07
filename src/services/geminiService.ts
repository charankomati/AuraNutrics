import { GoogleGenAI, Type } from "@google/genai";

const apiKey = (import.meta as ImportMeta & { env: { VITE_GEMINI_API_KEY: string } }).env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

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

export class AnalysisError extends Error {
  constructor(public message: string, public code: 'IMAGE_QUALITY' | 'API_ERROR' | 'PARSING_ERROR' | 'NO_FOOD_DETECTED') {
    super(message);
    this.name = 'AnalysisError';
  }
}

export async function analyzeFoodImage(base64Image: string): Promise<NutritionalAnalysis> {
  const model = "gemini-3-flash-preview";
  
  try {
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
              text: "Analyze this food image for a pediatric/adolescent nutrition platform. If the image does not contain food or is too blurry to analyze, return a JSON object with an 'error' field explaining the issue. Otherwise, provide detailed nutritional data including micronutrients and predictive health insights regarding latent deficiencies. Return the response in JSON format.",
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
            error: { type: Type.STRING, description: "Error message if food detection fails or image quality is poor" },
          },
          required: ["foodName", "calories", "macronutrients", "micronutrients", "healthInsights", "predictiveRisk"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    if (result.error) {
      throw new AnalysisError(result.error, 'IMAGE_QUALITY');
    }

    if (!result.foodName || result.foodName.toLowerCase().includes("unknown") || result.foodName.toLowerCase().includes("none")) {
       throw new AnalysisError("No recognizable food detected in the image. Please ensure the lighting is good and the food is clearly visible.", 'NO_FOOD_DETECTED');
    }

    return result;
  } catch (error) {
    if (error instanceof AnalysisError) throw error;
    
    console.error("Gemini API Error:", error);
    throw new AnalysisError(
      "The health intelligence core is currently experiencing high latency or connectivity issues. Please try again in a moment.",
      'API_ERROR'
    );
  }
}

export async function getPredictiveInsights(history: any[], biometrics: any) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Based on the following nutritional history: ${JSON.stringify(history)} and current biometrics: ${JSON.stringify(biometrics)}, provide a predictive health analysis for a pediatric user. Focus on latent micronutrient deficiencies and precision micro-interventions. Return as Markdown.`,
  });
  return response.text;
}
