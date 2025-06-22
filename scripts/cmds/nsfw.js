const axios = require('axios');
const { getStreamFromURL } = global.utils;
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "nsfw",
    version: "1.0",
    author: "@RI F AT",
    countDown: 5,
    role: 0,
    shortDescription: "Generate NSFW image",
    longDescription: "Generate NSFW AI image from a prompt.",
    category: "ai",
    guide: {
      en: "{pn} [prompt]",
    },
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("⚠️ Please provide a prompt.", event.threadID, event.messageID);

    const url = `https://fastrestapis.fasturl.cloud/aiimage/nsfw?prompt=${encodeURIComponent(prompt)}`;

    const filePath = path.join(__dirname, "cache", `${event.threadID}_nsfwimg.png`);

    try {
      const response = await axios.get(url, { responseType: 'stream' });

      // Ensure cache directory exists
      fs.ensureDirSync(path.dirname(filePath));

      // Save to file then send
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: `🖼️`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      });

      writer.on("error", () => {
        api.sendMessage("❌ Failed to process image.", event.threadID, event.messageID);
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error generating image.", event.threadID, event.messageID);
    }
  },
};