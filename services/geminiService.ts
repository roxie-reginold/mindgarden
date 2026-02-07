import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";
import { GeneratedContent, ThoughtMeta, ThoughtCategory, NextStep, ThoughtCard, GrowthStage } from "../types";

const TEXT_MODEL = "gemini-3-flash-preview";
const IMAGE_MODEL = "gemini-3-pro-image-preview"; 
const API_TIMEOUT_MS = 25000; // Increased timeout for potential double-generation

// --- VISUAL SYSTEM DEFINITIONS ---

const PLANT_SPECIES: Record<ThoughtCategory, { name: string; stages: Record<GrowthStage, string> }> = {
  todo: {
    name: 'Daisy',
    stages: {
      seed: 'A tiny green bud close to the ground, barely noticeable. Simple and modest.',
      sprout: 'A thin green stem with a few small leaves. Active but incomplete.',
      bloom: 'A fully opened small white daisy with a bright yellow center. Clean, balanced, and clear.',
      mature: 'The daisy remains visible but slightly faded or lowered. Colors softer.',
    }
  },
  feeling: {
    name: 'Cherry Blossom',
    stages: {
      seed: 'Bare branches with small, closed pink buds.',
      sprout: 'Buds begin to open, showing soft pink petals.',
      bloom: 'Branches covered with delicate pink cherry blossoms.',
      mature: 'Petals gently falling through the air, leaving light branches behind.',
    }
  },
  goal: {
    name: 'Sunflower',
    stages: {
      seed: 'A small shoot emerging from the soil, sturdy and upright.',
      sprout: 'A tall, strong green stem growing upward with broad leaves.',
      bloom: 'A large sunflower fully open, with a bright yellow face and dark center.',
      mature: 'The sunflower slightly tilts downward, seeds fully formed.',
    }
  },
  memory: {
    name: 'Bluebell',
    stages: {
      seed: 'A bulb beneath the soil, barely visible.',
      sprout: 'Long, narrow green leaves rise gently from the ground.',
      bloom: 'A curved stem with small, bell-shaped blue flowers hanging downward.',
      mature: 'The flowers remain but with softened color and reduced contrast.',
    }
  },
  idea: {
    name: 'Tulip',
    stages: {
      seed: 'A bulb hidden beneath the soil.',
      sprout: 'Two thick, smooth green leaves emerge symmetrically.',
      bloom: 'A fully opened tulip with a clean, well-defined silhouette.',
      mature: 'The tulip maintains its form with minimal movement or change.',
    }
  },
};

interface AnalysisResponse {
  emotion: string;
  intensity: 'low' | 'medium' | 'high';
  reflection: string;
  category: ThoughtCategory;
  topic: string;
  hasNextStep: boolean;
  nextStep: NextStep | null;
  songSuggestion: {
    query: string;        // Search query for Spotify
    reasoning: string;    // Why this song fits the mood
  };
}

interface WateringAnalysisResponse {
  acknowledgment: string;
  newStage: GrowthStage;
  hasNextStep: boolean;
  nextStep: NextStep | null;
}

interface WateringResponse {
  acknowledgment: string;
  newStage: GrowthStage;
  hasNextStep: boolean;
  nextStep: NextStep | null;
  newImageUrl?: string;
}

// Helper for retry logic
async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("The garden is taking a moment to grow...")), API_TIMEOUT_MS)
    );
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error: any) {
    const isOverloaded = error?.status === 503 || error?.code === 503 || (error?.message && error.message.includes('overloaded'));
    if (retries > 0 && isOverloaded) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");
  return new GoogleGenAI({ apiKey });
};

// --- BACKGROUND REMOVAL ---

export async function removeBackground(dataUri: string): Promise<string> {
  // Convert base64 data URI to Blob
  const res = await fetch(dataUri);
  const blob = await res.blob();

  // Run client-side background removal (WASM + ONNX, ~40MB model cached after first use)
  const resultBlob = await imglyRemoveBackground(blob);

  // Convert result back to base64 data URI
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(resultBlob);
  });
}

// --- MAIN FUNCTIONS ---

export const generateMindGardenContent = async (text: string): Promise<GeneratedContent & { songSuggestion: { query: string; reasoning: string } }> => {
  try {
    // 1. Analyze Text to get Category & Emotion
    const analysis = await analyzeTextAndReflect(text);

    // 2. Generate Initial Seed Image
    let imageUrl = "";
    try {
      imageUrl = await generateBotanyImage('seed', analysis.emotion, analysis.category);
    } catch (imgError) {
      console.warn("Image gen failed:", imgError);
      imageUrl = `https://picsum.photos/seed/${Date.now()}/800/800?blur=8`;
    }

    return {
      imageUrl,
      reflection: analysis.reflection,
      meta: {
        emotion: analysis.emotion,
        intensity: analysis.intensity,
        metaphors: [], // Deprecated but kept for type safety
        plantSpecies: PLANT_SPECIES[analysis.category]?.name ?? '',
        category: analysis.category,
        topic: analysis.topic,
        hasNextStep: analysis.hasNextStep,
        nextStep: analysis.nextStep,
      },
      songSuggestion: analysis.songSuggestion
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check for quota/rate limit errors
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("The garden has reached its daily limit. Please try again in a few minutes or check your Gemini API quota.");
    }
    
    if (error.message?.includes('overloaded') || error.status === 503) {
       throw new Error("The garden is very busy right now. Please try again in a moment.");
    }
    
    throw new Error("The garden is cloudy right now. Please try again later.");
  }
};

export const waterMindGardenThought = async (thought: ThoughtCard, updateText: string): Promise<WateringResponse> => {
  const ai = getClient();

  // 1. Analyze the update (Text)
  const stageOrder: GrowthStage[] = ['seed', 'sprout', 'bloom', 'mature'];
  const currentIndex = stageOrder.indexOf(thought.growthStage);
  const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : thought.growthStage;

  const prompt = `
    You are the MindGarden AI.
    Original: "${thought.originalText}"
    Current Stage: ${thought.growthStage}
    Number of updates so far: ${thought.updates?.length ?? 0}
    Update: "${updateText}"

    Rules:
    ${thought.growthStage !== 'mature'
      ? `- The plant MUST advance to the next growth stage: "${nextStage}".\n    - newStage MUST be "${nextStage}".`
      : `- The plant is already fully grown (mature stage). Keep newStage as "mature".`}
    - Write a gentle acknowledgment of the user's update.
    - Determine if next step is needed.
  `;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          acknowledgment: { type: Type.STRING },
          newStage: { type: Type.STRING, enum: ["seed", "sprout", "bloom", "mature"] },
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
  const result = JSON.parse(response.text) as WateringAnalysisResponse;

  console.log("[Water] AI response:", { currentStage: thought.growthStage, newStage: result.newStage, expectedNext: nextStage });

  // Force stage advancement if AI didn't comply
  if (result.newStage === thought.growthStage && thought.growthStage !== 'mature') {
    console.warn("[Water] AI did not advance stage, forcing to:", nextStage);
    result.newStage = nextStage;
  }

  // 2. Regenerate image for the new stage
  let newImageUrl: string | undefined = undefined;

  if (result.newStage !== thought.growthStage) {
    // Try with reference image first, fall back to without
    try {
      console.log("[Water] Generating new image for stage:", result.newStage, "with reference:", !!thought.imageUrl);
      newImageUrl = await generateBotanyImage(
        result.newStage,
        thought.meta.emotion,
        thought.meta.category,
        thought.imageUrl
      );
      console.log("[Water] Image generated successfully, length:", newImageUrl?.length);
    } catch (e) {
      console.warn("[Water] Image gen with reference failed, retrying without reference:", e);
      try {
        newImageUrl = await generateBotanyImage(
          result.newStage,
          thought.meta.emotion,
          thought.meta.category
        );
        console.log("[Water] Fallback image generated successfully");
      } catch (e2) {
        console.error("[Water] Image gen fully failed:", e2);
      }
    }
  }

  return {
    ...result,
    newImageUrl,
    nextStep: result.hasNextStep ? result.nextStep : null
  };
};

// --- HELPERS ---

async function analyzeTextAndReflect(userText: string): Promise<AnalysisResponse> {
  const ai = getClient();

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

    TASK 3: SONG SUGGESTION
    Based on the emotion, intensity, and metaphors, suggest ONE song that would resonate with this mental state.

    Guidelines:
    - For high intensity: Calming, ambient, or gentle instrumental
    - For low energy: Uplifting but not overwhelming
    - For joy/achievement: Celebratory but tasteful
    - For sadness: Validating, melancholic, but not depressing
    - Match metaphors when possible (e.g., "ocean" → beach sounds, "fire" → intense rhythms)

    Format: 
    - query: "{artist name} {song name}" or "{mood keyword} ambient music"
    - reasoning: One gentle sentence explaining the connection (max 15 words)

    Avoid: 
    - Overly clinical suggestions
    - Songs with harsh/violent themes
    - Extremely sad/triggering music for vulnerable states

    Return STRICT JSON object.
    Analyze user thought: "${userText}".
    Map to ONE category:
    - idea (creative sparks, structured thoughts)
    - todo (tasks, daily actions)
    - feeling (emotions, sensitivity)
    - goal (aspirations, long-term effort)
    - memory (remembrance, past experiences)

    Provide a gentle reflection.
    Return JSON.
  `;

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ["idea", "todo", "feeling", "goal", "memory"] },
          topic: { type: Type.STRING },
          emotion: { type: Type.STRING },
          intensity: { type: Type.STRING, enum: ["low", "medium", "high"] },
          reflection: { type: Type.STRING },
          hasNextStep: { type: Type.BOOLEAN },
          nextStep: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["do", "clarify", "reflect"] },
              confidence: { type: Type.NUMBER }
            },
            nullable: true
          },
          songSuggestion: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Spotify search query" },
              reasoning: { type: Type.STRING, description: "Why this song fits (max 15 words)" }
            },
            required: ["query", "reasoning"]
          }
        },
        required: ["category", "topic", "emotion", "intensity", "reflection", "hasNextStep", "songSuggestion"],
      },
    },
  }));

  if (!response.text) throw new Error("Analysis failed");
  const res = JSON.parse(response.text) as AnalysisResponse;
  if (!res.hasNextStep) res.nextStep = null;
  return res;
}

async function generateBotanyImage(stage: GrowthStage, emotion: string, category: ThoughtCategory, referenceImageUrl?: string): Promise<string> {
  const ai = getClient();
  const species = PLANT_SPECIES[category];
  const stageDesc = species?.stages[stage] ?? 'A small plant in a garden.';
  const speciesName = species?.name ?? 'Plant';

  const isEvolution = !!referenceImageUrl;

  // STRICT PROMPT TEMPLATE
  const imagePrompt = `
    ${isEvolution
      ? `Evolve the provided reference ${speciesName} image into its next growth stage. The new image MUST look like a natural progression of the same ${speciesName} — preserve the exact same color palette, art style, shape language, and viewing angle. Only change what reflects the new growth stage.`
      : `Create a high-quality digital illustration of a ${speciesName} suitable for a UI garden.`}

    Plant: ${speciesName}
    Growth Stage (${stage}): ${stageDesc}

    Visual Style:
    - Soft, painterly illustration style with a calm, natural feel.
    - Clean shapes with smooth edges, suitable for SVG or painterly generation.
    - Flat colors with minimal gradients (very subtle, no harsh contrast).
    - Matte finish, no texture noise.
    - Calm natural lighting — no harsh shadows or highlights.

    Color Palette:
    - Base colors aligned with the app's soft, natural theme.
    - Emotion (${emotion}) influences tint only:
      - calm → cool green / blue undertones
      - anxious → muted, slightly desaturated tones
      - hopeful → warm highlights, gentle glow
    - Avoid neon, avoid overly saturated colors.

    Composition:
    - Centered ${speciesName}, front-facing or slight angle.
    - Isolated on a TRANSPARENT BACKGROUND (alpha channel).
    - Clear silhouette for easy placement.
    - Minimal background — no scenery, no soil, no pots.

    Constraints:
    - NO watercolor
    - NO sketch lines
    - NO rough brush strokes
    - NO text
    - NO frames
    - NO shadows or drop shadows beneath the plant
    - NO ground shadow, cast shadow, or ambient occlusion
    - NO shading on the plant itself — no dark gradients, no light/dark sides, no volumetric shading
    - NO background scenery (no soil, sky, pots)
    - Fully flat-lit appearance, as if there is no light source
  `;

  // Build content parts: text prompt + optional reference image
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: imagePrompt }];

  if (referenceImageUrl) {
    try {
      // Extract base64 data from data URI
      const match = referenceImageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        parts.unshift({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    } catch (e) {
      console.warn("Failed to attach reference image, generating without continuity:", e);
    }
  }

  const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  }));

  const candidate = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!candidate?.inlineData?.data) throw new Error("No image generated");

  const rawDataUri = `data:${candidate.inlineData.mimeType};base64,${candidate.inlineData.data}`;

  // Remove background for true transparency
  try {
    return await removeBackground(rawDataUri);
  } catch (bgError) {
    console.warn("Background removal failed, using original image:", bgError);
    return rawDataUri;
  }
}
