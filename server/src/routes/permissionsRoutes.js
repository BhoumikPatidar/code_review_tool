// const express = require("express");
// const router = express.Router();
// const {
//   getUserPermissions,
//   getAllPermissions,
//   updatePermissions
// } = require("../controllers/permissionsController");

// // Get permissions for a specific SSH key
// router.get("/user", getUserPermissions);

// // Get all permissions (admin only)
// router.get("/all", getAllPermissions);

// // Update permissions (admin only)
// router.post("/update", updatePermissions);

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getUserPermissions,
  getAllPermissions,
  updatePermissions
} = require("../controllers/permissionsController");
const authMiddleware = require("../middleware/authMiddleware");

// Add authMiddleware to the routes
router.get("/user", authMiddleware, getUserPermissions);
router.get("/all", authMiddleware, getAllPermissions);
router.post("/update", authMiddleware, updatePermissions);

module.exports = router;