import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: String,
    userid: String,
    email: String,
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const User = mongoose.model("User", userSchema);

export default User;
