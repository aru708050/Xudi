const axios = require("axios");

module.exports = {
  config: {
    name: "gemini",
    version: "1.1",
    author: "@RI F AT ",
    description: "Generate or edit image using prompt (reply to an image to edit it)",
    usage: "[prompt] (reply to image for edit)",
    cooldown: 5
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    const { messageReply, threadID, messageID } = event;

    if (!prompt) {
      return api.sendMessage("⚠️ Please provide a prompt.\n🖼️ You can also reply to an image to edit it.", threadID, messageID);
    }

    let imageURL = null;

    if (
      messageReply &&
      messageReply.attachments &&
      messageReply.attachments[0] &&
      messageReply.attachments[0].type === "photo"
    ) {
      imageURL = messageReply.attachments[0].url;
    }

    const apiUrl = imageURL
      ? `https://edit-and-gen.onrender.com/gen?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageURL)}`
      : `https://edit-and-gen.onrender.com/gen?prompt=${encodeURIComponent(prompt)}`;

    try {
      const res = await axios.get(apiUrl, { responseType: "stream" });

      api.sendMessage({
        body: `✅ ${imageURL ? "Edited" : "Generated"} with: "${prompt}"\n`,
        attachment: res.data
      }, threadID, messageID);
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to generate or edit image. Try again later.", threadID, messageID);
    }
  }
};