
// Vercel instances stay warm for a few minutes. 
// For a prototype, this global variable acts as our bridge.
let state = "LOCK";

export default function handler(req: any, res: any) {
  // Setup CORS and Cache-Busting
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // UPDATE STATE (From Website)
  if (req.method === 'POST') {
    const { command } = req.body;
    if (command === "UNLOCK" || command === "LOCK") {
      state = command;
      console.log(`Bridge updated to: ${state}`);
      return res.status(200).json({ success: true, state });
    }
    return res.status(400).json({ error: "Invalid command" });
  }

  // READ STATE (From Arduino)
  // We send the command as a raw string so the Arduino can compare it easily.
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(state);
}
