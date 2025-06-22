 const axios = require("axios");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "draw",
    version: "1.0",
    author: "@RI F AT",
    countDown: 10,
    role: 0,
    shortDescription: "Generate AI image from text",
    longDescription: "Generate an image using a given prompt and optional model flag (e.g., --fluxpro)",
    category: "image",
    guide: "{pn} your prompt --modelname\nExample: {pn} cat samurai --pixart"
  },

  onStart: async function ({ message, event, args }) {
    let prompt = "";
    let model = "";

    // Get prompt from reply or args
    if (event.type === "message_reply" && event.messageReply?.body) {
      prompt = event.messageReply.body;
    } else {
      prompt = args.join(" ");
    }

    // Detect model from --modelname
    const modelMatch = prompt.match(/--(\w+)/);
    if (modelMatch) {
      model = modelMatch[1];
      prompt = prompt.replace(`--${model}`, "").trim();
    }

    if (!prompt) return message.reply("❌ Please provide a prompt.");

    const apiUrl = `https://mj-s6wm.onrender.com/draw?prompt=${encodeURIComponent(prompt)}${model ? `&model=${model}` : ""}`;

    try {
      message.reply("🎨 Generating image, please wait...");

      const res = await axios.get(apiUrl);
      const images = res.data?.images;

      if (!images || images.length === 0) {
        return message.reply("⚠️ No image was returned.");
      }

      const imageStream = await getStreamFromURL(images[0]);
      return message.reply({ attachment: imageStream });

    } catch (err) {
      console.error("❌ Draw command error:", err.message);
      return message.reply("❌ Failed to generate image.");
    }
  }
};