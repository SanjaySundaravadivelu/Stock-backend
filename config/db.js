import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongourl = process.env.MONGO_URL;
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongourl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // process code 1 code means exit with failure, 0 means success
  }
};
