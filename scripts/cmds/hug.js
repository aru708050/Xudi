  const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const Jimp = require("jimp");

module.exports = {
  config: {
    name: "hug",
    aliases: [],
    version: "1.0",
    author: "Ariyan",
    countDown: 5,
    role: 0,
    shortDescription: "Send a hug with avatars",
    category: "fun",
  },

  onStart: async function ({ api, event }) {
    const mention = Object.keys(event.mentions)[0];
    if (!mention) return api.sendMessage("⚠️ Tag someone to hug!", event.threadID, event.messageID);

    const senderID = event.senderID;
    const receiverID = mention;

    const imgBgUrl = "https://i.imgur.com/XEXuR4O.jpg"; // Replace with your hug template (boy hugging girl)

    try {
      // Load background and avatars
      const [bg, boyAvt, girlAvt] = await Promise.all([
        Jimp.read(imgBgUrl),
        Jimp.read(`https://graph.facebook.com/${senderID}/picture?width=512&height=512`),
        Jimp.read(`https://graph.facebook.com/${receiverID}/picture?width=512&height=512`)
      ]);

      // Resize avatars
      boyAvt.resize(120, 120);
      girlAvt.resize(100, 100);

      // Paste avatars (adjust positions as per your template)
      bg.composite(boyAvt, 140, 60); // boy face
      bg.composite(girlAvt, 290, 75); // girl face

      const outPath = path.join(__dirname, "cache", `hug_${Date.now()}.jpg`);
      await bg.writeAsync(outPath);

      api.sendMessage(
        {
          body: "🤗 A warm hug!",
          attachment: fs.createReadStream(outPath)
        },
        event.threadID,
        () => fs.unlinkSync(outPath),
        event.messageID
      );
    } catch (err) {
      console.error("❌ Hug command error:", err);
      api.sendMessage("❌ Failed to generate hug image.", event.threadID, event.messageID);
    }
  }
};