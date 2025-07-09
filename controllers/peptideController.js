const Peptide = require("../models/Peptide");

// Updated to handle new retailer variant structure
// Updated to handle new retailer variant structure and maintain backward compatibility
const getAllPeptides = async (req, res) => {
  try {
    const peptides = await Peptide.find({ status: "active" }).sort({
      createdAt: -1,
    });

    // Transform data to maintain backward compatibility while adding new features
    const transformedPeptides = peptides.map((peptide) => {
      const peptideObj = peptide.toObject();

      // Transform retailers to flatten variants for frontend compatibility
      if (peptideObj.retailers && peptideObj.retailers.length > 0) {
        peptideObj.retailers = peptideObj.retailers.flatMap((retailer) => {
          // If retailer has variants (new structure)
          if (retailer.variants && retailer.variants.length > 0) {
            return retailer.variants.map((variant) => ({
              _id: `${retailer._id}_${variant._id}`,
              retailer_id: retailer.retailer_id,
              retailer_name: retailer.retailer_name,
              product_id: retailer.product_id,
              price: variant.price,
              discounted_price: variant.discounted_price,
              discount_percentage: variant.discount_percentage,
              stock: variant.stock,
              rating: retailer.rating,
              review_count: retailer.review_count,
              affiliate_url: retailer.affiliate_url,
              coupon_code: variant.coupon_code,
              size: variant.size,
              last_updated: peptide.updatedAt,
            }));
          } else {
            // Handle old structure (shouldn't happen but good fallback)
            return [
              {
                _id: retailer._id,
                retailer_id: retailer.retailer_id,
                retailer_name: retailer.retailer_name,
                product_id: retailer.product_id,
                price: retailer.price || 0,
                discounted_price: retailer.discounted_price,
                discount_percentage: retailer.discount_percentage,
                stock: retailer.stock !== undefined ? retailer.stock : true,
                rating: retailer.rating || 4.5,
                review_count: retailer.review_count || 0,
                affiliate_url: retailer.affiliate_url || "",
                coupon_code: retailer.coupon_code,
                size: retailer.size || "",
                last_updated: peptide.updatedAt,
              },
            ];
          }
        });
      } else {
        // Handle empty retailers array
        peptideObj.retailers = [];
      }

      return peptideObj;
    });

    res.json(transformedPeptides);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching peptides", error: error.message });
  }
};

// Rest of the controller remains the same
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
