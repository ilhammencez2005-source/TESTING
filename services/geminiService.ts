
import { GoogleGenAI } from "@google/genai";
import { ContextData } from '../types';

export const generateGeminiResponse = async (userText: string, contextData: ContextData): Promise<string> => {
  const systemPrompt = `You are the AI technical lead for "Solar Synergy" at UTP Group 17.
      
  TOPICS YOU COVER:
  - ECO CHARGE: Sustainable solar-powered charging.
  - TURBO CHARGE: Fast-charging DC network at RM 1.20/kWh.
  - SYNERGY CREDITS: Wallet and QR reload support.
  - HARDWARE FEEDBACK: Explain that the Piezoelectric Buzzer (Pin D2) provides a 2-second "Success" beep during Unlocking for safety and accessibility.
  - SERVO: Servo motor is on Pin D4.

  STRICT RULES:
  - Keep responses concise and focused on UTP micro-mobility.
  - If users ask about the beep, explain it's the "Synergy Alert" confirming the hub is physically unlocked.

  User Context:
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

    return response.text || "I'm having trouble connecting. Please check your internet connection!";
  } catch (error) {
    return "Recalibrating Synergy systems. I'll be back online in a moment!";
  }
};
