 const axios = require("axios");

module.exports = {
  config: {
    name: "prompt",
    version: "1.0",
    author: "Nyx",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Apply style prompt to an image"
    },
    longDescription: {
      en: "Reply to an image and apply Midjourney-like style prompt"
    },
    category: "media",
    guide: {
      en: "Reply to an image with: prompt <style>"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      // Check for image reply
      if (
        !event.messageReply ||
        !event.messageReply.attachments ||
        event.messageReply.attachments.length === 0
      ) {
        return api.sendMessage(
          "❌ Please reply to an image.",
          event.threadID,
          event.messageID
        );
      }

      const attachment = event.messageReply.attachments[0];
      if (attachment.type !== "photo") {
        return api.sendMessage(
          "❌ Only image replies are supported.",
          event.threadID,
          event.messageID
        );
      }

      const imageUrl = attachment.url;
      const style = args.join(" ").trim();

      if (!style) {
        return api.sendMessage(
          "❌ Please provide a style.\nExample: prompt dreamy fantasy",
          event.threadID,
          event.messageID
        );
      }

      // Make API request
      const apiUrl = `${global.GoatBot.config.nyx}api/prompt?imageUrl=${encodeURIComponent(imageUrl)}&style=${encodeURIComponent(style)}`;
      const response = await axios.get(apiUrl);

      // Send result
      return api.sendMessage(response.data.data, event.threadID, event.messageID);
    } catch (err) {
      console.error("Prompt command error:", err);
      return api.sendMessage(
        "❌ An error occurred while processing the prompt.",
        event.threadID,
        event.messageID
      );
    }
  }
};