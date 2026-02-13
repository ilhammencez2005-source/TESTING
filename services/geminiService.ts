
import { GoogleGenAI } from "@google/genai";
import { ContextData } from '../types';

export const generateGeminiResponse = async (userText: string, contextData: ContextData): Promise<string> => {
  const systemPrompt = `You are the AI technical lead for "Solar Synergy" at UTP Group 17.
      
  HARDWARE FIX (If Serial Monitor shows 'UNLOCK' but no movement):
  1. This means the code and internet are PERFECT. The problem is electricity or wiring.
  2. PIN CHECK: Is the signal wire in D4? The code uses pin D4.
  3. POWER CHECK: Servo RED must be in 'Vin'. The '3.3V' pin is NOT strong enough for a motor.
  4. STARTUP TEST: The new code sweeps the motor (180 to 0) as soon as you plug it in. If it doesn't sweep on startup, the wires are loose or the servo is broken.

  Project Context:
  - User Wallet: RM ${contextData.walletBalance.toFixed(2)}
  - Active Station: ${contextData.selectedStation ? contextData.selectedStation.name : 'None'}`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userText,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I'm having trouble connecting to the cloud. Check your hardware jumpers!";
  } catch (error) {
    return "The assistant is busy recalibrating. Check your breadboard for loose connections! 🔌";
  }
};
