
let currentCommand = "LOCK";

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { command } = req.body;
    if (command === "UNLOCK" || command === "LOCK") {
      currentCommand = command;
      return res.status(200).json({ success: true, state: currentCommand });
    }
    return res.status(400).json({ error: "Invalid command." });
  }

  res.setHeader('Content-Type', 'text/plain');
  res.statusCode = 200;
  return res.end(currentCommand.trim());
}
