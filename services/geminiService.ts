
import { GoogleGenAI } from "@google/genai";
import { ContextData } from '../types';

export const generateGeminiResponse = async (userText: string, contextData: ContextData): Promise<string> => {
  const systemPrompt = `You are the AI technical lead for "Solar Synergy" at UTP. You are helping a student (Ilhammencez, Group 17) with their ETP project.
      
  ESP-12E (NodeMCU 1.0) Technical Profile:
  - Processor: ESP8266
  - WiFi: 2.4GHz only (Advise using phone hotspot if UTP-WiFi is restricted).
  - Servo Pin: Signal goes to D4 (which is GPIO 2). 
  - Power: Recommend Vin (5V) for the Servo, GND for brown wire.
  
  ETP Common Fixes:
  - "My ESP won't connect": Check SSID/Password case sensitivity. UTP WiFi usually requires login pages which ESP cannot handle easily—hotspot is better.
  - "Servo is twitching": This is "Power Sag". The Wi-Fi chip takes a lot of current. Connect the NodeMCU to a wall adapter, not just the laptop USB.
  - "Sketch upload error": Ensure board is set to "NodeMCU 1.0 (ESP-12E Module)" in Arduino IDE.
  
  Guidelines:
  - Mention "Group 17" or "ETP" to feel personalized.
  - Use tech emojis: ⚡️, 🦾, 🔋, 🔌, 📡.
  - Be supportive and professional.
  - Always remind them about the "Breadboard Layout" in the Smart Bridge menu.

  Context:
  - User Wallet: RM ${contextData.walletBalance.toFixed(2)}
  - Active Dock: ${contextData.selectedStation ? contextData.selectedStation.name : 'None'}`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userText,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I'm having trouble syncing with the grid. Please check your ESP-12E serial monitor!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Eco-Companion is currently recalibrating. Check your breadboard wiring for loose jumpers! 🔌";
  }
};
