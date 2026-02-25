
import { GoogleGenAI } from "@google/genai";
import { ContextData } from '../types';

export const generateGeminiResponse = async (userText: string, contextData: ContextData): Promise<{ text: string, grounding?: any[] }> => {
  const systemPrompt = `You are the AI technical lead for "Solar Synergy" at UTP Group 17.
      
  TOPICS YOU COVER:
  - ECO CHARGE: Sustainable solar-powered charging.
  - TURBO CHARGE: Fast-charging DC network at RM 1.20/kWh.
  - SYNERGY CREDITS: Wallet and QR reload support.
  - HARDWARE FEEDBACK: Explain that the Piezoelectric Buzzer (Pin D2) provides a 2-second "Success" beep during Unlocking for safety and accessibility.
  - SERVO: Servo motor is on Pin D4.

  STRICT RULES:
  - Keep responses concise and focused on UTP micro-mobility.
  - Use GOOGLE MAPS grounding to find nearby amenities, food, or specific UTP building locations if the user asks.
  - If Google Maps is used, ensure directions or distances mentioned are accurate.
  - Maintain a helpful, high-tech, and sustainable persona.

  User Context:
  - User Wallet: RM ${contextData.walletBalance.toFixed(2)}
  - Active Station: ${contextData.selectedStation ? contextData.selectedStation.name : 'None'}
  - Current Lat/Lng: ${contextData.userLocation ? `${contextData.userLocation.lat}, ${contextData.userLocation.lng}` : 'Unknown'}`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: userText }] }],
      config: {
        systemInstruction: systemPrompt,
        tools: [
          { googleMaps: {} },
          { googleSearch: {} }
        ],
        toolConfig: contextData.userLocation ? {
          retrievalConfig: {
            latLng: {
              latitude: contextData.userLocation.lat,
              longitude: contextData.userLocation.lng
            }
          }
        } : undefined
      }
    });

    const text = response.text || "I'm having trouble connecting. Please check your internet connection!";
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { text, grounding };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Recalibrating Synergy systems. I'll be back online in a moment!" };
  }
};
