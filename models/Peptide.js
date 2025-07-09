const mongoose = require("mongoose");

// Updated retailer variant schema
const retailerVariantSchema = new mongoose.Schema({
  size: { type: String, required: true }, // e.g., "5mg", "10mg"
  price: { type: Number, required: true, min: 0 },
  discount_percentage: { type: Number, min: 0, max: 100, default: 0 },
  discounted_price: { type: Number, min: 0 }, // Auto-calculated
  stock: { type: Boolean, default: true },
  coupon_code: { type: String },
});

// Updated retailer schema with variants array
const retailerSchema = new mongoose.Schema({
  retailer_id: { type: String, required: true },
  retailer_name: { type: String, required: true },
  product_id: { type: String },
  rating: { type: Number, default: 4.5, min: 1, max: 5 },
  review_count: { type: Number, default: 0, min: 0 },
  affiliate_url: { type: String, required: true },
  variants: [retailerVariantSchema], // Array of size/price variants
});

const peptideSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    category: { type: String, required: true },
    description: { type: String, required: true },

    // Dosage Info
    dosages: [{ type: String, required: true }],
    unit: { type: String, enum: ["mg", "mcg", "iu"], required: true },
    tags: [{ type: String }],

    // Calculator Data
    startingDose: { type: String },
    maintenanceDose: { type: String },
    frequency: { type: String },
    dosageNotes: { type: String },

    // Stack Builder Data - Enhanced with manual goals
    recommendedForGoals: [{ type: String }],
    manualGoals: [{ type: String }], // NEW: Manual goal input
    stackDifficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    stackTiming: { type: String },
    stackDuration: { type: Number, default: 8 },

    // Retailers with variants
    retailers: [retailerSchema],

    // Status
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate discounted prices
retailerVariantSchema.pre("save", function (next) {
  if (this.discount_percentage && this.discount_percentage > 0 && this.price) {
    this.discounted_price = this.price * (1 - this.discount_percentage / 100);
    this.discounted_price = Math.round(this.discounted_price * 100) / 100; // Round to 2 decimals
  } else {
    this.discounted_price = undefined;
  }
  next();
});

// Generate slug before saving
peptideSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// Ensure slug is always set before validation
peptideSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

module.exports = mongoose.model("Peptide", peptideSchema);
