module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  // Log environment info
  console.log("Node version:", process.version);
  console.log("Request method:", req.method);
  console.log("Request body:", req.body);
  
  res.status(200).json({ 
    message: "Test endpoint working",
    nodeVersion: process.version,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
};
