const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sketch",
    aliases: ['draw'],
    author: "@RI F AT",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Transform images to sketches",
    longDescription: "Convert images to sketch styles",
    category: "image",
    guide: {
      en: "{p}sketch [style] (reply to image)\nStyles: ink, bgline, color, gouache, manga, pencil, anime, lineart, simple, doodle, intricate"
    }
  },

  onStart: async function ({ message, event, args }) {
    const hasImage = event.messageReply?.attachments?.length > 0 || event.attachments?.length > 0;
    if (!args[0] && !hasImage) return;

    try {
      const imageUrl = event.messageReply?.attachments[0]?.url || event.attachments[0]?.url;
      if (!imageUrl) return message.reply("❌ Please reply to or attach an image");

      const styleMap = {
        ink: "Ink Sketch",
        bgline: "BG Line",
        color: "Color Rough",
        gouache: "Gouache",
        manga: "Manga Sketch",
        pencil: "Pencil Sketch",
        anime: "Anime Sketch",
        lineart: "Line Art",
        simple: "Simplex",
        doodle: "Doodle",
        intricate: "Intricate Line"
      };

      const styleInput = args[0]?.toLowerCase() || "pencil";
      const style = styleMap[styleInput];

      if (!style) {
        return message.reply(`❌ Invalid style. Available:\n${Object.keys(styleMap).join(", ")}`);
      }

      message.reply(`✏️ Creating ${style} sketch...`);

      const apiUrl = `https://fastrestapis.fasturl.cloud/imgedit/tosketch?imageUrl=${encodeURIComponent(imageUrl)}&style=${encodeURIComponent(style)}`;
      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 40000,
        headers: { 'User-Agent': 'GoatBot-V2-Sketch' }
      });

      const tempPath = path.join(__dirname, "cache", `sketch_${Date.now()}.jpg`);
      fs.writeFileSync(tempPath, response.data);

      message.reply({
        body: `✅ ${style} Sketch Complete!`,
        attachment: fs.createReadStream(tempPath)
      }, () => fs.unlinkSync(tempPath));

    } catch (error) {
      console.error("Sketch Command Error:", error);
      message.reply(`❌ Failed to process image. ${error.response?.status === 429 ? "Server busy, try later" : "Please check the image and try again"}`);
    }
  }
};
