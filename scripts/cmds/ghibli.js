const axios = require("axios");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "ghibli",
    version: "1.0",
    author: "Nyx",
    countDown: 5,
    role: 0,
    shortDescription: "Ghibli style image",
    longDescription: "Convert a replied image into Ghibli-style using the API",
    category: "GEN",
    guide: "{pn} (as a reply to an image)"
  },
  onStart: async function ({ message, event, api }) {
    try {
      if (
        !event.messageReply ||
        !event.messageReply.attachments
      ) {
        return message.reply("❌ Please reply to an image with the command 'ghibli'.");
      }
      const imgURL = encodeURIComponent(event.messageReply.attachments[0].url);
      const res = await axios.get(`${global.GoatBot.config.nyx}api/ghibli-studio?imageUrl=${imgURL}`);
      const shareUrl = res.data.share_url;
      if (!shareUrl) {
        return message.reply("⚠️ No image was returned. Please try again later.");
      }
      return message.reply({
        body: "🎨 Here's your Ghibli-style image:",
        attachment: await getStreamFromURL(shareUrl)
      });
    } catch (err) {
      return message.reply("❌ Something went wrong. Please try again.");
    }
  }
};