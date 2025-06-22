 
const axios = require("axios");

const aspectRatios = [
  { ratio: "1:2", width: 1000, height: 2000 },
  { ratio: "9:16", width: 1000, height: 1778 },
  { ratio: "2:3", width: 1000, height: 1500 },
  { ratio: "3:4", width: 1000, height: 1333 },
  { ratio: "4:5", width: 1000, height: 1250 },
  { ratio: "21:9", width: 1000, height: 429 },
  { ratio: "2:1", width: 1000, height: 500 },
  { ratio: "16:9", width: 1000, height: 563 },
  { ratio: "3:2", width: 1000, height: 667 },
  { ratio: "4:3", width: 1000, height: 750 },
  { ratio: "5:4", width: 1000, height: 800 },
  { ratio: "1:1", width: 1000, height: 1000 }
];

module.exports = {
  config: {
    name: "legit",
    version: "1.0",
    author: "Nyx",
    role: 0,
    longDescription: { en: "Generate images using legit API with custom ratio" },
    category: "GEN",
    guide: {
      en: "{pn} [prompt] -r [ratio]\nExample: legit A girl in cyberpunk city -r 16:9"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      if (args.length === 0) {
        return api.sendMessage("❗ Please provide a prompt.\nExample: legit A forest spirit -r 3:4", event.threadID, event.messageID);
      }

      const input = args.join(" ");
      const match = input.match(/(.*?)(?:\s+-r\s+(\d+:\d+))?$/);

      const prompt = match[1].trim();
      const ratioInput = match[2]?.trim() || "1:1";

      const selectedRatio = aspectRatios.find(r => r.ratio === ratioInput);
      if (!selectedRatio) {
        return api.sendMessage("❗ Invalid ratio. Supported ratios:\n" + aspectRatios.map(r => r.ratio).join(", "), event.threadID, event.messageID);
      }

      const apiUrl = `${global.GoatBot.config.nyx}api/legit?prompt=${encodeURIComponent(prompt)}&width=${selectedRatio.width}&height=${selectedRatio.height}`;

      const response = await axios.get(apiUrl);
      const images = response.data;

      if (!Array.isArray(images) || images.length === 0) {
        return api.sendMessage("❌ No images found in response.", event.threadID, event.messageID);
      }

      const attachments = await Promise.all(
        images.map(async (url) => {
          const img = await axios.get(url, { responseType: "stream" });
          return img.data;
        })
      );

      api.sendMessage({
        body: `🖼️ Prompt: "${prompt}"\nAspect Ratio: ${ratioInput}`,
        attachment: attachments
      }, event.threadID, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Failed to generate image(s).", event.threadID, event.messageID);
    }
  }
};