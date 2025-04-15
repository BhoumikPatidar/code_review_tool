const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  console.log("\n=== AUTH MIDDLEWARE START ===");
  
  try {
    const authHeader = req.header("Authorization");
    console.log("Authorization header:", authHeader);

    const token = authHeader?.split(" ")[1];
    console.log("Extracted token:", token);

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    console.log("Attempting to verify token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded token:", JSON.stringify(decoded, null, 2));

    if (!decoded.username || !decoded.keyHash) {
      console.error("❌ Token missing required fields:");
      console.error("Username present:", !!decoded.username);
      console.error("KeyHash present:", !!decoded.keyHash);
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user to the request object
    req.user = {
      username: decoded.username,
      keyHash: decoded.keyHash
    };

    console.log("✅ Successfully attached user data to req.user:", req.user);
    console.log("=== AUTH MIDDLEWARE END ===\n");
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    console.error("Error stack:", error.stack);
    console.log("=== AUTH MIDDLEWARE END WITH ERROR ===\n");
    res.status(401).json({ message: "Token is not valid" });
  }
};