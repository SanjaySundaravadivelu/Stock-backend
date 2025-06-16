import express from "express";
import dotenv from "dotenv";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";

import productRoutes from "./routes/product.route.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const FEURL = process.env.FEURL;

const __dirname = path.resolve();
app.use(
  cors({
    origin: FEURL, // ✅ Your frontend's URL
    credentials: true, // ✅ Required to send cookies
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser());

app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

app.use(express.json()); // allows us to accept JSON data in the req.body

app.use("/api/products", productRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server started at " + PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB", err);
  });
