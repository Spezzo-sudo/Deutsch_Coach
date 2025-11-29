import { GoogleGenAI, Type } from "@google/genai";
import { LessonContent, LanguageLevel } from "../types";

// Initialize Gemini
// NOTE: Process.env.API_KEY must be available in the build environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_INSTRUCTION = `
You are a private German tutor for a student whose native language is Hindi but speaks English well.
Goal: Guide her to Goethe-Zertifikat B1.
Rules:
1. German text must be correct and natural.
2. Explanations must be in simple English.
3. Translations must be in Hindi using Latin script (e.g., "Namaste", "Main ghar ja rahi hoon").
4. Adapt complexity to the requested CEFR level (A0, A1, A2, or B1).
`;

const JSON_INSTRUCTION = BASE_INSTRUCTION + `
5. Output MUST be valid JSON matching the requested schema.
6. Keep strings concise. English explanations should be short (max 15 words).
7. ANTI-REPETITION RULE: Do NOT repeat sentences, phrases, or words. Each sentence must be unique.
8. CONTENT RULE: 'txt' field must contain ONLY German text. NO translations in brackets within the German text.
9. HARD STOP RULE: After generating the reading text, STOP IMMEDIATELY. Do not continue generating beyond the word limit.
10. Ensure all JSON strings are properly escaped.
11. Do not include markdown code blocks (like \`\`\`json). Just return the raw JSON.
`;

// Helper to map minified JSON back to full Application Types
const mapRawToLesson = (raw: any): LessonContent => {
  return {
    topic: raw.t || 'Lesson',
    level: raw.l || 'A1',
    vocabulary: (raw.voc || []).map((v: any) => ({
      german: v.de,
      englishExplanation: v.en,
      hindiTranslation: v.hi,
      exampleSentence: v.ex
    })),
    readingText: raw.txt,
    readingTextTranslation: raw.txt_tr, // Map the new translation field
    readingQuestions: (raw.q || []).map((q: any) => ({
      question: q.qu,
      options: q.ops,
      correctAnswer: q.ans,
      explanation: q.exp
    })),
    writingPrompt: raw.wr,
    writingPoints: raw.pts,
    listeningScenario: raw.lis
  };
};

// Validate response to prevent loops
const validateResponse = (raw: any, level: LanguageLevel): boolean => {
  // Check if txt exists and is not absurdly long
  if (raw.txt) {
    const wordCount = raw.txt.split(/\s+/).length;
    const maxWords = level === 'A0' ? 60 : 150; // Safety margin
    if (wordCount > maxWords) {
      console.warn(`Reading text too long: ${wordCount} words (max: ${maxWords})`);
      return false;
    }
    
    // Check for repetition (same word appears >8 times)
    const words = raw.txt.toLowerCase().split(/\s+/);
    const wordFreq: Record<string, number> = {};
    for (const word of words) {
      if (word.length > 3) { // Ignore short words like "der", "die"
        wordFreq[word] = (wordFreq[word] || 0) + 1;
        if (wordFreq[word] > 8) {
          console.warn(`Repetition detected: "${word}" appears ${wordFreq[word]} times`);
          return false;
        }
      }
    }
  }
  
  // Check if vocabulary exists
  if (!raw.voc || raw.voc.length === 0) {
    console.warn("No vocabulary found in response");
    return false;
  }
  
  return true;
};

export const generateLesson = async (
  level: LanguageLevel,
  type: 'daily' | 'exam' | 'topic',
  topic?: string
): Promise<LessonContent | null> => {
  
  let levelInstruction = level as string;
  let textLength = "EXACTLY 60-80 words. Count carefully. STOP after reaching 80 words.";
  let vocabInstruction = "EXACTLY 4 German words (not more).";
  let textContentInstruction = "Topic: everyday life.";
  
  if (level === 'A0') {
    levelInstruction = "A0 (Absolute Beginner).";
    vocabInstruction = "EXACTLY 4 basic words (e.g. Hallo, Name, sein, kommen).";
    textLength = "EXACTLY 20-30 words. 3-4 very short sentences.";
    // Critical change for A0: Text must use the vocab
    textContentInstruction = "CRITICAL FOR A0: The text must be extremely simple (Subject-Verb-Object). It MUST primarily use the 4 vocabulary words generated above. Do not use complex grammar.";
  }

  let prompt = "";
  if (type === 'daily') {
    prompt = `Create a daily training session for level ${levelInstruction}. 
    The response MUST be valid JSON.
    Include:
    1. voc: ${vocabInstruction} Each with English explanation (max 15 words), Hindi translation (Latin script), and ONE example sentence.
    2. txt: A German reading text (${textLength}). ${textContentInstruction}
       CRITICAL: 'txt' must contain ONLY German.
    3. txt_tr: (Optional) Full English translation of the 'txt'. REQUIRED for A0 level.
    4. q: EXACTLY 2 Multiple Choice questions about the text. Each question has "qu" (string), "ops" (array of 4 strings), "ans" (integer 0-3), "exp" (short explanation).
    5. wr: A writing task instruction (e.g. "Write a short message..."). Just the scenario.
    6. pts: EXACTLY 3 bullet points (strings) that must be covered in the writing task.
    
    STOP RULE: After generating all fields, stop immediately.`;
  } else if (type === 'exam') {
    prompt = `Create a B1 Exam simulation task. 
    Focus on ONE skill: Reading or Writing.
    If Reading: Provide a German text (${textLength}) and EXACTLY 3 multiple choice questions (with 4 string options each).
    If Writing: Provide a scenario and EXACTLY 3 points that must be covered in an email (approx 80 words).
    Level must be strict B1.
    STOP after generating the content.`;
  } else {
    prompt = `Create a lesson about "${topic}" for level ${levelInstruction}.
    Include:
    - EXACTLY 4 vocabulary words
    - A short dialogue or text (${textLength})
    - EXACTLY 2 comprehension questions with multiple choice options
    STOP after generating all content.`;
  }

  // Retry logic
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: JSON_INSTRUCTION,
          responseMimeType: "application/json",
          maxOutputTokens: 8192, // Increased to 8192 to prevent truncation during long responses
          temperature: 0.2, 
          topP: 0.8,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              t: { type: Type.STRING, description: "Topic" },
              l: { type: Type.STRING, description: "Level" },
              voc: {
                type: Type.ARRAY,
                description: "Vocabulary (max 4 items)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    de: { type: Type.STRING, description: "German Word" },
                    en: { type: Type.STRING, description: "English Explanation" },
                    hi: { type: Type.STRING, description: "Hindi Translation (Latin)" },
                    ex: { type: Type.STRING, description: "Example Sentence (German)" }
                  },
                  required: ["de", "en", "hi", "ex"]
                }
              },
              txt: { type: Type.STRING, description: "Reading Text (German only)" },
              txt_tr: { type: Type.STRING, description: "English translation of reading text (for A0)" },
              q: {
                type: Type.ARRAY,
                description: "Questions (max 3)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    qu: { type: Type.STRING, description: "Question" },
                    ops: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 Options" },
                    ans: { type: Type.INTEGER, description: "Correct Answer Index (0-3)" },
                    exp: { type: Type.STRING, description: "Explanation" }
                  },
                  required: ["qu", "ops", "ans"]
                }
              },
              wr: { type: Type.STRING, description: "Writing Prompt Instruction" },
              pts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Writing Bullet Points (max 3)" },
              lis: { type: Type.STRING, description: "Listening Scenario" }
            },
            required: ["t", "l", "voc"]
          }
        }
      });

      if (response.text) {
        let cleanText = response.text.trim();
        // Remove markdown code blocks if present (safety check)
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const rawData = JSON.parse(cleanText);
        
        // Validate before returning
        if (validateResponse(rawData, level)) {
          return mapRawToLesson(rawData);
        } else {
          console.warn(`Attempt ${attempt + 1}: Response validation failed, retrying...`);
          if (attempt === 2) {
            console.error("All retry attempts failed, returning partial data");
            return mapRawToLesson(rawData);
          }
          continue; // Retry
        }
      }
    } catch (error) {
      console.error(`Gemini Generation Error (Attempt ${attempt + 1}):`, error);
      if (attempt === 2) {
        return null; // All retries exhausted
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return null;
};

export const evaluateWriting = async (prompt: string, userText: string, level: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The student (Level ${level}) was asked: "${prompt}".
            Student wrote: "${userText}".
            
            Please provide feedback in simple English (max 200 words):
            1. Correct the German errors (if any).
            2. Suggest a better way to say it (German) with Hindi (Latin script) translation.
            3. Rate it loosely (e.g., "Good A2", "Weak B1").
            
            Keep it encouraging. STOP after 200 words.`,
            config: {
                systemInstruction: BASE_INSTRUCTION,
                maxOutputTokens: 1000,
                temperature: 0.3,
            }
        });
        return response.text || "Could not generate feedback.";
    } catch (e) {
        console.error("Evaluation error:", e);
        return "Error generating feedback. Please try again.";
    }
}