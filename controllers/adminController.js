const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Peptide = require("../models/Peptide");

// Admin login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      message: "Login successful",
      token,
      admin: { id: admin._id, email: admin.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Verify token
const verifyToken = (req, res) => {
  res.json({
    message: "Token valid",
    admin: { id: req.admin._id, email: req.admin.email },
  });
};

// Get all peptides for admin (including inactive)
const getAllPeptidesAdmin = async (req, res) => {
  try {
    const peptides = await Peptide.find().sort({ createdAt: -1 });
    res.json(peptides);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching peptides", error: error.message });
  }
};

// Get single peptide by ID
const getPeptideById = async (req, res) => {
  try {
    const peptide = await Peptide.findById(req.params.id);
    if (!peptide) {
      return res.status(404).json({ message: "Peptide not found" });
    }
    res.json(peptide);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching peptide", error: error.message });
  }
};

// Create new peptide
const createPeptide = async (req, res) => {
  try {
    const peptideData = req.body;

    // Generate slug if not provided
    if (!peptideData.slug && peptideData.name) {
      peptideData.slug = peptideData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Filter out empty arrays and invalid data
    if (peptideData.dosages) {
      peptideData.dosages = peptideData.dosages.filter((d) => d && d.trim());
    }
    if (peptideData.tags) {
      peptideData.tags = peptideData.tags.filter((t) => t && t.trim());
    }
    if (peptideData.manualGoals) {
      peptideData.manualGoals = peptideData.manualGoals.filter(
        (g) => g && g.trim()
      );
    }

    // Validate and filter retailers with variants
    if (peptideData.retailers) {
      peptideData.retailers = peptideData.retailers.filter((retailer) => {
        // Filter out retailers without basic info
        if (
          !retailer.retailer_id ||
          !retailer.retailer_name ||
          !retailer.affiliate_url
        ) {
          return false;
        }

        // Filter out variants without size and price
        if (retailer.variants) {
          retailer.variants = retailer.variants.filter(
            (variant) =>
              variant.size && variant.size.trim() && variant.price > 0
          );
        }

        // Only keep retailers that have at least one valid variant
        return retailer.variants && retailer.variants.length > 0;
      });
    }

    // Validate required fields
    if (
      !peptideData.name ||
      !peptideData.category ||
      !peptideData.description
    ) {
      return res.status(400).json({
        message: "Name, category, and description are required",
      });
    }

    if (!peptideData.dosages || peptideData.dosages.length === 0) {
      return res.status(400).json({
        message: "At least one dosage is required",
      });
    }

    if (!peptideData.retailers || peptideData.retailers.length === 0) {
      return res.status(400).json({
        message: "At least one retailer with valid variants is required",
      });
    }

    const peptide = new Peptide(peptideData);
    await peptide.save();

    res.status(201).json({ message: "Peptide created successfully", peptide });
  } catch (error) {
    console.error("Create peptide error:", error);

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `A peptide with this ${field} already exists`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: `Validation error: ${messages.join(", ")}`,
      });
    }

    res.status(500).json({
      message: "Error creating peptide",
      error: error.message,
    });
  }
};

// Update peptide
const updatePeptide = async (req, res) => {
  try {
    const peptideData = req.body;

    // Filter out empty arrays
    if (peptideData.dosages) {
      peptideData.dosages = peptideData.dosages.filter((d) => d && d.trim());
    }
    if (peptideData.tags) {
      peptideData.tags = peptideData.tags.filter((t) => t && t.trim());
    }
    if (peptideData.retailers) {
      peptideData.retailers = peptideData.retailers.filter(
        (r) =>
          r.retailer_id &&
          r.retailer_name &&
          r.affiliate_url &&
          r.size &&
          r.price
      );
    }

    const peptide = await Peptide.findByIdAndUpdate(
      req.params.id,
      peptideData,
      { new: true }
    );
    if (!peptide) {
      return res.status(404).json({ message: "Peptide not found" });
    }

    res.json({ message: "Peptide updated successfully", peptide });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating peptide", error: error.message });
  }
};

// Delete peptide
const deletePeptide = async (req, res) => {
  try {
    const peptide = await Peptide.findByIdAndDelete(req.params.id);
    if (!peptide) {
      return res.status(404).json({ message: "Peptide not found" });
    }
    res.json({ message: "Peptide deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting peptide", error: error.message });
  }
};

// Update peptide status
const updatePeptideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const peptide = await Peptide.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!peptide) {
      return res.status(404).json({ message: "Peptide not found" });
    }

    res.json({ message: "Status updated successfully", peptide });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
};

// Bulk update peptides
const bulkUpdate = async (req, res) => {
  try {
    const { action, peptideIds } = req.body;

    let result;
    switch (action) {
      case "activate":
        result = await Peptide.updateMany(
          { _id: { $in: peptideIds } },
          { status: "active" }
        );
        break;
      case "deactivate":
        result = await Peptide.updateMany(
          { _id: { $in: peptideIds } },
          { status: "inactive" }
        );
        break;
      case "delete":
        result = await Peptide.deleteMany({ _id: { $in: peptideIds } });
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ message: `Bulk ${action} completed`, result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error performing bulk action", error: error.message });
  }
};

module.exports = {
  login,
  verifyToken,
  getAllPeptidesAdmin,
  getPeptideById,
  createPeptide,
  updatePeptide,
  deletePeptide,
  updatePeptideStatus,
  bulkUpdate,
};
