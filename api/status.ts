
// Note: In Vercel, this variable resets when the function goes cold.
// For a prototype, it works as long as the app is being used.
let currentCommand = "LOCK";

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { command } = req.body;
    if (command === "UNLOCK" || command === "LOCK") {
      currentCommand = command;
      console.log(`BRIDGE_LOG: Received ${command}`);
      return res.status(200).json({ success: true, newState: currentCommand });
    }
    return res.status(400).json({ error: "Invalid Command" });
  }

  // GET Request from Arduino
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(currentCommand);
}
