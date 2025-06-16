import express from "express";

import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  getMutalfunds,
  searchStock,
  getHistoricalData,
  getIpo,
  sendMail,
  getStat,
  updateStat,
  getReccomended,
  signUp,
  login,
  verifyToken,
} from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/updatestat", updateStat);
router.get("/getStat", getStat);
router.get("/getReco", getReccomended);
router.get("/sendmail", sendMail);
router.get("/mutual", getMutalfunds);
router.get("/ipo", getIpo);
router.get("/history/:id", getHistoricalData);
router.get("/search/:id", searchStock);
router.post("/add", createProduct);
router.post("/login", login);
router.post("/signUp", signUp);
router.post("/verifyToken", verifyToken);
router.get("/report", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
