const mongoose = require("mongoose");

const retailerSchema = new mongoose.Schema({
  retailer_id: { type: String, required: true },
  retailer_name: { type: String, required: true },
  product_id: { type: String, required: true },
  price: { type: Number, required: true },
  discounted_price: { type: Number },
  discount_percentage: { type: Number },
  stock: { type: Boolean, default: true },
  rating: { type: Number, default: 4.5 },
  review_count: { type: Number, default: 0 },
  affiliate_url: { type: String, required: true },
  coupon_code: { type: String },
  size: { type: String, required: true },
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

    // Stack Builder Data
    recommendedForGoals: [{ type: String }],
    stackDifficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    stackTiming: { type: String },
    stackDuration: { type: Number, default: 8 },

    // Retailers
    retailers: [retailerSchema],

    // Status
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

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
