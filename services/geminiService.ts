
import { GoogleGenAI } from "@google/genai";
import { ContextData } from '../types';

export const generateGeminiResponse = async (userText: string, contextData: ContextData): Promise<string> => {
  const systemPrompt = `You are the AI technical lead for "Solar Synergy" at UTP Group 17.
      
  TOPICS YOU COVER:
  - ECO CHARGE: Explain that this is a sustainable, solar-powered charging mode provided for free within the UTP village.
  - TURBO CHARGE: Explain this is our fast-charging DC network for urgent needs, priced at RM 1.20/kWh.
  - SYNERGY CREDITS: Assist users with wallet balance queries and how to top up via kiosk QR codes.
  - IMPACT: Encourage users by sharing their CO2 savings and environmental contribution.

  STRICT RULES:
  - Do NOT mention hardware, breadboards, breadboard wiring, IR sensors, servos, or security/lock mechanisms unless explicitly asked for technical internal specs.
  - Focus purely on the user experience: finding hubs, booking sessions, and charging modes.

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
