const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "art",
    aliases: ['animate'],
    author: "@RI F AT",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Transform images to animations",
    longDescription: "Convert images to animation styles ",
    category: "image",
    guide: {
      en: "{p}art [style] (reply to image)\nStyles: crayon, inkstains, simpledrawing, witty, tinies, grumpy3d, 90smanga, gothic, vector, comic, felted, wojak, illustration, mini, clay, 3d, inkpainting, colorrough"
    }
  },

  onStart: async function ({ message, event, args }) {
    try {
      // Get image from reply or attachment
      const imageUrl = event.messageReply?.attachments[0]?.url || event.attachments[0]?.url;
      if (!imageUrl) return message.reply("❌ Please reply to or attach an image");

      // All supported animation styles
      const styleMap = {
        crayon: "Crayon",
        inkstains: "Ink Stains",
        simpledrawing: "Simple Drawing",
        witty: "Witty",
        tinies: "Tinies",
        grumpy3d: "Grumpy 3D",
        "90smanga": "90s Shoujo Manga",
        gothic: "Gothic",
        vector: "Vector",
        comic: "Comic Book",
        felted: "Felted Doll",
        wojak: "Wojak",
        illustration: "Illustration",
        mini: "Mini",
        clay: "Clay",
        "3d": "3D",
        inkpainting: "Ink Painting",
        colorrough: "Color Rough"
      };
      
      const styleInput = args[0]?.toLowerCase() || "crayon";
      const style = styleMap[styleInput];
      
      if (!style) {
        return message.reply(`❌ Invalid style. Available:\n${Object.keys(styleMap).join(", ")}`);
      }

      message.reply(`🎬 Creating ${style} animation...`);

      // FastAPI request (using toanimation endpoint)
      const apiUrl = `https://fastrestapis.fasturl.cloud/imgedit/toanimation?imageUrl=${encodeURIComponent(imageUrl)}&style=${encodeURIComponent(style)}`;
      
      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 40000,
        headers: {
          'User-Agent': 'GoatBot-V2-Art'
        }
      });

      // Save and send result
      const tempPath = path.join(__dirname, "cache", `art_${Date.now()}.jpg`);
      fs.writeFileSync(tempPath, response.data);
      
      message.reply({
        body: `✅ ${style} Animation Complete!`,
        attachment: fs.createReadStream(tempPath)
      }, () => fs.unlinkSync(tempPath));

    } catch (error) {
      console.error("Art Command Error:", error);
      message.reply(`❌ Failed to process image. ${error.response?.status === 429 ? "Server busy, try later" : "Please check the image and try again"}`);
    }
  }
};
