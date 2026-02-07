const { OpenAI } = require("openai");
const config = require("../config");

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

const getAIResponse = async (prompt) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are ${config.BOT_NAME}, a WhatsApp assistant. Reply in a mix of friendly Sinhala and English. Keep replies short and helpful.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("AI Error:", error.message);
    return "Sorry, AI is busy right now. Try again later.";
  }
};

module.exports = { getAIResponse };
