import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    product: {
      type: JSON,
      required: true,
    },
    userid: String,
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
