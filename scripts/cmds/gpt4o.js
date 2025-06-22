const axios = require("axios");

module.exports = {
  config: {
    name: "gpt4o",
    version: "1.0",
    author: "@RI F AT",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Edit image with AI using GPT-4o style"
    },
    longDescription: {
      en: "Reply to an image with a prompt to edit it using GPT-4o image model"
    },
    category: "image",
    guide: {
      en: "Reply to an image with: gpt4o <your prompt>\nExample: gpt4o make it ghibli style"
    }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    const { messageReply, threadID, messageID } = event;

    if (!messageReply || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ | Please reply to an image to edit it.", threadID, messageID);
    }

    if (!prompt) return api.sendMessage("❌ | Please provide a prompt.\nExample: gpt4o make it ghibli style", threadID, messageID);

    const imgUrl = messageReply.attachments[0].url;
    const apiUrl = `https://refat-api.onrender.com/4o?img=${encodeURIComponent(imgUrl)}&prompt=${encodeURIComponent(prompt)}`;

    try {
      api.sendMessage("🖼️ | Processing your image, please wait...", threadID, messageID);

      const res = await axios.get(apiUrl);
      if (res.data.status !== "done" || !res.data.url) {
        return api.sendMessage("⚠️ | Failed to generate the edited image.", threadID, messageID);
      }

      const imgRes = await axios.get(res.data.url, { responseType: "stream" });
      api.sendMessage({
        body: `✨ Prompt: ${prompt}`,
        attachment: imgRes.data
      }, threadID, messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ | An error occurred while generating the image.", threadID, messageID);
    }
  }
};