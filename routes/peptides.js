const express = require("express");
const router = express.Router();
const {
  getAllPeptides,
  getCategories,
  getRetailers,
} = require("../controllers/peptideController");

// Public routes - only what frontend needs
router.get("/peptides", getAllPeptides);
router.get("/categories", getCategories);
router.get("/retailers", getRetailers);

module.exports = router;
