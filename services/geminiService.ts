
import { GoogleGenAI } from "@google/genai";
import { ContextData } from '../types';

export const generateGeminiResponse = async (userText: string, contextData: ContextData): Promise<string> => {
  const systemPrompt = `You are the AI technical lead for "Solar Synergy" at UTP Group 17.
      
  CORE TROUBLESHOOTING (If user says "Servo is not moving"):
  1. String Matching: Advise using 'if (payload.indexOf("UNLOCK") >= 0)' instead of 'if (payload == "UNLOCK")' because HTTP responses often have hidden characters.
  2. The D4/GPIO2 Conflict: D4 is also the onboard LED. If the LED blinks but servo doesn't move, the signal is reaching the pin but the servo might not have enough power.
  3. Power Sag: Servos pull 500mA+. If powered by the NodeMCU 3.3V pin, it will fail or crash the Wi-Fi. Recommend:
     - Servo Red -> Vin (5V)
     - Servo Brown -> GND
     - Servo Orange/Yellow -> D4
  4. Serial Debugging: Ask them to check if the Serial Monitor prints "Bridge Command: UNLOCK". If it does, the Cloud is perfect, and the issue is strictly the Arduino 'if' statement or wiring.

  Project Context:
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

    return response.text || "Connection glitch. Try refreshing the hardware link in your profile!";
  } catch (error) {
    return "Recalibrating... check your breadboard jumpers for loose connections! 🔌";
  }
};
