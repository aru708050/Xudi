 const axios = require("axios");

module.exports = {
  config: {
    name: "mjx",
    version: "1.0",
    author: "nyx",
    description: "Generate Midjourney images from a prompt",
    category: "GEN",
    usages: "[prompt]",
    role: 2,
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("❗ Please provide a prompt.", event.threadID, event.messageID);
    }

    try {
 api.sendMessage("🧩 Calling the NX API...", event.threadID, event.messageID);
      const res = await axios.get(`https://rest-nyx-apis-production.up.railway.app/api/mj?prompt=${encodeURIComponent(prompt)}`);
      const { discordCdn, imagesUrls } = res.data;

      const response = await axios.get(discordCdn, { responseType: "stream" });

      api.sendMessage({
        body: "🖼️ Here's your Midjourney image grid.\n\nReply with U1, U2, U3, or U4 to upscale a specific image.",
        attachment: response.data
      }, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "mjx",
          author: event.senderID,
          imagesUrls
        });
      },event.messageID);

    } catch (err) {
      api.sendMessage("❌ An error occurred while generating the image. Please try again later.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const userChoice = event.body.toUpperCase().trim();
    const validChoices = ["U1", "U2", "U3", "U4"];

    if (!validChoices.includes(userChoice)) {
      return api.sendMessage("❗ Please reply with U1, U2, U3, or U4 only.", event.threadID, event.messageID);
    }

    const imageUrl = Reply.imagesUrls[userChoice];
    if (!imageUrl) {
      return api.sendMessage("❌ Could not find the requested image.", event.threadID, event.messageID);
    }

    try {
      const response = await axios.get(imageUrl, { responseType: "stream" });
      api.sendMessage({
        body: `✅ Here is your selected image: ${userChoice}`,
        attachment: response.data
      }, event.threadID, event.messageID);
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to load the selected image.", event.threadID, event.messageID);
    }
  }
};