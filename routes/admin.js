const express = require("express");
const router = express.Router();
const { authenticateAdmin } = require("../middleware/auth");
const {
  login,
  verifyToken,
  getAllPeptidesAdmin,
  getPeptideById,
  createPeptide,
  updatePeptide,
  deletePeptide,
  updatePeptideStatus,
  bulkUpdate,
} = require("../controllers/adminController");

// Auth routes
router.post("/login", login);
router.get("/verify", authenticateAdmin, verifyToken);

// Peptide management routes (all require admin auth)
router.get("/peptides", authenticateAdmin, getAllPeptidesAdmin);
router.get("/peptides/:id", authenticateAdmin, getPeptideById);
router.post("/peptides", authenticateAdmin, createPeptide);
router.put("/peptides/:id", authenticateAdmin, updatePeptide);
router.delete("/peptides/:id", authenticateAdmin, deletePeptide);
router.patch("/peptides/:id/status", authenticateAdmin, updatePeptideStatus);
router.post("/peptides/bulk", authenticateAdmin, bulkUpdate);

module.exports = router;
