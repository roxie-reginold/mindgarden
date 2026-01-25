import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedContent, ThoughtMeta, ThoughtCategory, NextStep, ThoughtCard, GrowthStage } from "../types";

// Removed global 'ai' instance to prevent startup crashes regarding process.env access

const TEXT_MODEL = "gemini-3-flash-preview";
const IMAGE_MODEL = "gemini-3-pro-image-preview"; 

interface AnalysisResponse {
  emotion: string;
  intensity: 'low' | 'medium' | 'high';
  metaphors: string[];
  reflection: string;
  category: ThoughtCategory;
  topic: string;
  hasNextStep: boolean;
  nextStep: NextStep | null;
}

interface WateringResponse {
  acknowledgment: string;
  newStage: GrowthStage;
  hasNextStep: boolean;
  nextStep: NextStep | null;
}

// Helper for retry logic with exponential backoff
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isOverloaded = 
      error?.status === 503 || 
      error?.code === 503 ||
      (error?.message && (error.message.includes('overloaded') || error.message.includes('503')));

    if (retries > 0 && isOverloaded) {
      console.warn(`Model overloaded. Retrying in ${delay}ms... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateMindGardenContent = async (text: string): Promise<GeneratedContent> => {
  try {
    const analysis = await analyzeTextAndReflect(text);
    const imageUrl = await generateSymbolicImage(analysis.metaphors, analysis.emotion);

    return {
      imageUrl,
      reflection: analysis.reflection,
      meta: {
        emotion: analysis.emotion,
        intensity: analysis.intensity,
        metaphors: analysis.metaphors,
        category: analysis.category,
        topic: analysis.topic,
        hasNextStep: analysis.hasNextStep,
        nextStep: analysis.nextStep,
        intent: analysis.hasNextStep ? 'action' : 'rest' // inferred
      },
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('overloaded') || error.status === 503) {
       throw new Error("The garden is very busy right now. Please try again in a moment.");
    }
    throw new Error("The garden is cloudy right now. Please try again later.");
  }
};

export const waterMindGardenThought = async (thought: ThoughtCard, updateText: string): Promise<WateringResponse> => {
  // Instantiate client here to ensure fresh API key and avoid global scope issues
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are the MindGarden AI.
    Original Thought: "${thought.originalText}"
    Current Stage: ${thought.growthStage}
    Previous Step: ${thought.meta.nextStep?.text || "None"}
    User Update: "${updateText}"

    Task:
    1. Analyze if this update represents progress, reflection, or completion.
    2. Determine new stage:
       - seed -> sprout (if 1st update or engagement)
       - sprout -> bloom (if deep reflection or multiple updates)
       - bloom -> fruit (if resolved/completed)
       - fruit (stays fruit)
    3. Write a short acknowledgment (supportive, observational, NOT celebratory "Good job").
    4. Determine if a NEW next step is needed.

    CRITICAL EMOTIONAL SAFETY RULES:
    1. No imperatives ("should", "must").
    2. If intensity is 'high' or user is tired, hasNextStep = false.
    3. Acknowledgments should be gentle.

    Return JSON.
  `;

  const response = await callWithRetry(() => ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          acknowledgment: { type: Type.STRING, description: "Gentle observational sentence." },
          newStage: { type: Type.STRING, enum: ["seed", "sprout", "bloom", "fruit"] },
          hasNextStep: { type: Type.BOOLEAN },
          nextStep: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["do", "clarify", "reflect"] },
              confidence: { type: Type.NUMBER }
            },
            nullable: true
          }
        },
        required: ["acknowledgment", "newStage", "hasNextStep"]
      }
    }
  }));

  if (!response.text) throw new Error("Failed to water plant.");
  
  const result = JSON.parse(response.text) as WateringResponse;
  if (!result.hasNextStep) result.nextStep = null;
  return result;
};

async function analyzeTextAndReflect(userText: string): Promise<AnalysisResponse> {
  // Instantiate client locally
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are the MindGarden AI. Your goal is to be a sanctuary, not a task manager.
    Analyze the user input: "${userText}".

    CRITICAL EMOTIONAL SAFETY RULES:
    1. No imperatives (never use "should", "must", "have to", "need to").
    2. No clinical therapy jargon.
    3. If intensity is 'high', hasNextStep MUST be false.
    4. If action would increase guilt, shame, or pressure, hasNextStep MUST be false.

    TASK 1: DECIDE IF A NEXT STEP EXISTS (hasNextStep)
    - Set FALSE if: 
      * High intensity emotion (panic, grief, rage).
      * User expresses exhaustion or burnout.
      * Input is purely venting or a memory.
    - Set TRUE if:
      * User shows explicit intent to act ("I need to", "I want to").
      * User is looping/stuck (needs CLARITY).
      * Intensity is LOW/MEDIUM and a micro-step feels supportive.

    TASK 2: DEFINE NEXT STEP (if hasNextStep is true)
    Type must be one of:
    1. "do": Smallest possible unit of progress (< 2 min). E.g. "Open the draft."
    2. "clarify": Reduce ambiguity. E.g. "Name one thing that feels heavy."
    3. "reflect": Internal processing. E.g. "Notice where this sits in your body."
    
    Constraint: Steps must be optional invitations ("Maybe...", "If you like...").

    Return STRICT JSON object.
  `;

  const response = await callWithRetry(() => ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ["idea", "todo", "worry", "feeling", "goal", "memory", "other"] },
          topic: { type: Type.STRING, description: "3-6 word neutral summary" },
          emotion: { type: Type.STRING, description: "1-2 words describing mood" },
          intensity: { type: Type.STRING, enum: ["low", "medium", "high"] },
          metaphors: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          reflection: { type: Type.STRING, description: "ONE gentle, validating sentence. No advice." },
          hasNextStep: { type: Type.BOOLEAN },
          nextStep: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "Gentle invitation, max 1 sentence" },
              type: { type: Type.STRING, enum: ["do", "clarify", "reflect"] },
              confidence: { type: Type.NUMBER }
            },
            nullable: true
          }
        },
        required: ["category", "topic", "emotion", "intensity", "metaphors", "reflection", "hasNextStep"],
      },
    },
  }));

  if (!response.text) {
    throw new Error("Failed to analyze thought.");
  }

  const result = JSON.parse(response.text) as AnalysisResponse;
  
  // Safety fallback if model hallucinates a step when it shouldn't
  if (!result.hasNextStep) {
    result.nextStep = null;
  }

  return result;
}

async function generateSymbolicImage(metaphors: string[], emotion: string): Promise<string> {
  // Instantiate client locally
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePrompt = `
    A soft, dreamlike watercolor illustration representing: ${metaphors.join(", ")} and the feeling of ${emotion}.
    
    Art Style: 
    - Traditional Watercolor painting on textured paper.
    - Soft, pastel color palette (pale blues, gentle pinks, sage greens, warm ambers).
    - Ethereal, flowing shapes. 
    - Minimalist and symbolic.
    - Visible paper grain texture.
    - White vignette edges to blend with a white page.

    Constraints: 
    - NO text. 
    - NO photorealism. 
    - NO people. 
    - NO dark or harsh black lines.
    - NO chaotic elements.
  `;

  const response = await callWithRetry(() => ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [{ text: imagePrompt }],
    },
    // Gemini 3 Pro Image configuration
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  }));

  let imageUrl = "";
  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    return `https://picsum.photos/500/500?blur=5&grayscale`;
  }

  return imageUrl;
}