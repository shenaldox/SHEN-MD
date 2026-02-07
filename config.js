require("dotenv").config();

module.exports = {
  SESSION_ID: process.env.SESSION_ID || "𝙰𝚂𝙸𝚃𝙷𝙰-𝙼𝙳=f3a63b6cdfd69a6c",
  MONGO_URI: process.env.MONGO_URI,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OWNER_NUMBER: process.env.OWNER_NUMBER || "94716173434", // Without +
  PREFIX: ".",
  BOT_NAME: "SHEN-MD"
};
