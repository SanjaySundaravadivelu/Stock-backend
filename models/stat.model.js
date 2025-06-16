import mongoose from "mongoose";

const statSchema = new mongoose.Schema(
  {
    stat: {
      type: JSON,
      required: true,
    },
    userid: String,
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const stat = mongoose.model("stat", statSchema);

export default stat;
