const Peptide = require("../models/Peptide");

// Get all active peptides for frontend
const getAllPeptides = async (req, res) => {
  try {
    const peptides = await Peptide.find({ status: "active" }).sort({
      createdAt: -1,
    });
    res.json(peptides);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching peptides", error: error.message });
  }
};

// Get all categories (dynamically from peptides)
const getCategories = async (req, res) => {
  try {
    const categories = await Peptide.distinct("category", { status: "active" });
    const categoriesFormatted = categories.map((cat) => ({
      id: cat,
      name: cat
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      slug: cat,
    }));
    res.json(categoriesFormatted);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

// Get all retailers (dynamically from peptides)
const getRetailers = async (req, res) => {
  try {
    const peptides = await Peptide.find({ status: "active" });
    const retailersSet = new Set();

    peptides.forEach((peptide) => {
      peptide.retailers.forEach((retailer) => {
        retailersSet.add(
          JSON.stringify({
            id: retailer.retailer_id,
            name: retailer.retailer_name,
          })
        );
      });
    });

    const retailers = Array.from(retailersSet).map((r) => JSON.parse(r));
    res.json(retailers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching retailers", error: error.message });
  }
};

module.exports = {
  getAllPeptides,
  getCategories,
  getRetailers,
};
