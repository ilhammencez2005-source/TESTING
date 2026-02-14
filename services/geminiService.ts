
import { GoogleGenAI } from "@google/genai";
import { ContextData } from '../types';

export const generateGeminiResponse = async (userText: string, contextData: ContextData): Promise<string> => {
  const systemPrompt = `You are the AI technical lead for "Solar Synergy" at UTP Group 17.
      
  HARDWARE TROUBLESHOOTING:
  - If they get 'LiquidCrystal_I2C does not name a type': Tell them to REMOVE '#include <LiquidCrystal.h>' and use '#include <LiquidCrystal_I2C.h>' instead. They must also install the library by Frank de Brabander.
  - If Serial Monitor shows 'UNLOCK' but no movement: Check wiring. Servo RED to Vin, Signal to D4.
  - LCD blank? Turn the blue potentiometer (screw) on the back of the LCD to adjust contrast.

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
