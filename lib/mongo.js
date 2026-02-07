const mongoose = require("mongoose");
const config = require("../config");

const connectDB = async () => {
  try {
    if (!config.MONGO_URI) return console.log("⚠️ MONGO_URI not provided");
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Database Connected");
  } catch (error) {
    console.error("❌ Database Error:", error.message);
  }
};

module.exports = connectDB;
