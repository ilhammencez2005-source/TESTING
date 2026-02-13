
// Vercel Serverless Function: Bridge for Solar Synergy
// This file must be in the /api folder at the project root.

// Note: Serverless variables are ephemeral and reset on cold starts.
let currentCommand = "LOCK";

export default function handler(req: any, res: any) {
  // 1. Set robust CORS and Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // Handle browser preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. POST Handler: Receives commands from the React App
  if (req.method === 'POST') {
    const { command } = req.body;
    if (command === "UNLOCK" || command === "LOCK") {
      currentCommand = command;
      return res.status(200).json({ 
        success: true, 
        state: currentCommand,
        timestamp: new Date().toISOString() 
      });
    }
    return res.status(400).json({ error: "Invalid command. Expected LOCK or UNLOCK." });
  }

  // 3. GET Handler: Strictly returns just the text string
  // Using end() instead of send() to avoid any potential auto-formatting
  res.setHeader('Content-Type', 'text/plain');
  res.statusCode = 200;
  return res.end(currentCommand.trim());
}
