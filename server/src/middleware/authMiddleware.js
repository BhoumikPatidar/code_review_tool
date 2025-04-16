// const jwt = require("jsonwebtoken");
// require("dotenv").config();

// //correct one 
// // module.exports = async (req, res, next) => {
// //   console.log("\n=== AUTH MIDDLEWARE START ===");
  
// //   try {
// //     const authHeader = req.header("Authorization");
// //     console.log("Authorization header:", authHeader);

// //     const token = authHeader?.split(" ")[1];
// //     console.log("Extracted token:", token);

// //     if (!token) {
// //       console.log("❌ No token provided");
// //       return res.status(401).json({ message: "No token, authorization denied" });
// //     }

// //     console.log("Attempting to verify token...");
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     console.log("✅ Decoded token:", JSON.stringify(decoded, null, 2));

// //     if (!decoded.username || !decoded.keyHash) {
// //       console.error("❌ Token missing required fields:");
// //       console.error("Username present:", !!decoded.username);
// //       console.error("KeyHash present:", !!decoded.keyHash);
// //       return res.status(401).json({ message: "Invalid token" });
// //     }

// //     // Attach user to the request object
// //     req.user = {
// //       username: decoded.username,
// //       keyHash: decoded.keyHash
// //     };

// //     console.log("✅ Successfully attached user data to req.user:", req.user);
// //     console.log("=== AUTH MIDDLEWARE END ===\n");
// //     next();
// //   } catch (error) {
// //     console.error("❌ Auth middleware error:", error);
// //     console.error("Error stack:", error.stack);
// //     console.log("=== AUTH MIDDLEWARE END WITH ERROR ===\n");
// //     res.status(401).json({ message: "Token is not valid" });
// //   }
// // };





// module.exports = async (req, res, next) => {
//   try {
//     console.log("\n=== AUTH MIDDLEWARE START ===");
//     console.log("Headers:", req.headers);

//     const authHeader = req.headers.authorization;
//     if (!authHeader?.startsWith('Bearer ')) {
//       console.error("❌ No Bearer token found");
//       return res.status(401).json({ error: "No token provided" });
//     }

//     const token = authHeader.split(' ')[1];
//     console.log("Token received:", token ? "✅ Present" : "❌ Missing");

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Decoded token data:", decoded);

//     if (!decoded.username) {
//       console.error("❌ No username in token");
//       return res.status(401).json({ error: "Invalid token - missing username" });
//     }

//     // Set user data in req.user
//     req.user = {
//       username: decoded.username,
//       keyHash: decoded.keyHash // Include keyHash if present
//     };

//     console.log("✅ Set req.user:", req.user);
//     console.log("=== AUTH MIDDLEWARE END ===\n");
//     next();
//   } catch (error) {
//     console.error("\n=== AUTH MIDDLEWARE ERROR ===");
//     console.error("Error:", error);
//     console.error("Stack:", error.stack);
//     console.log("=== AUTH MIDDLEWARE ERROR END ===\n");
//     return res.status(401).json({ error: "Invalid token" });
//   }
// };



const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import the User model
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    console.log("\n=== AUTH MIDDLEWARE START ===");
    console.log("Headers:", req.headers);

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("❌ No Bearer token found");
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    console.log("Token received:", token ? "✅ Present" : "❌ Missing");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token data:", decoded);

    if (!decoded.username) {
      console.error("❌ No username in token");
      return res.status(401).json({ error: "Invalid token - missing username" });
    }

    // Find the user in the database to get their ID
    const user = await User.findOne({ where: { username: decoded.username } });
    
    if (!user) {
      console.error("❌ User not found in database");
      return res.status(401).json({ error: "User not found" });
    }

    // Set user data in req.user, including the ID
    req.user = {
      id: user.id,
      username: decoded.username,
      keyHash: decoded.keyHash
    };

    console.log("✅ Set req.user:", req.user);
    console.log("=== AUTH MIDDLEWARE END ===\n");
    next();
  } catch (error) {
    console.error("\n=== AUTH MIDDLEWARE ERROR ===");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.log("=== AUTH MIDDLEWARE ERROR END ===\n");
    return res.status(401).json({ error: "Invalid token" });
  }
};