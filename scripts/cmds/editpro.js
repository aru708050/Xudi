const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { getStreamFromURL } = global.utils;

const OWNER_UIDS = ["100089495797706", "61568425442088"];
const COOLDOWN_FILE = path.join(__dirname, "editpro_cooldown.json");

module.exports = {
  config: {
    name: "editpro",
    version: "5.1",
    author: "Mahi--",
    countDown: 10,
    role: 0,
    shortDescription: "Edit an image using AI and a prompt",
    longDescription: "Reply to an image with a prompt to edit it using AI.",
    category: "image",
    guide: "{pn} <prompt> (must reply to an image)"
  },

  onStart: async function ({ message, event, args }) {
    const senderID = event.senderID.toString();
    const reply = event.messageReply;
    const prompt = args.join(" ");

    if (!prompt) return message.reply("⚠️ You must provide a prompt. Example: /editpro add a cat");
    if (!reply || !reply.attachments || reply.attachments[0].type !== "photo")
      return message.reply("⚠️ Please reply to an image.");

    if (!fs.existsSync(COOLDOWN_FILE)) fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({}), "utf8");

    const cooldowns = JSON.parse(fs.readFileSync(COOLDOWN_FILE));
    const now = Date.now();

    if (!OWNER_UIDS.includes(senderID)) {
      const lastUsed = cooldowns[senderID] || 0;
      const timePassed = now - lastUsed;

      if (timePassed < 90_000) {
        const seconds = Math.ceil((90_000 - timePassed) / 1000);
        return message.reply(`⏳ You must wait ${seconds} seconds before using this command again.`);
      }

      cooldowns[senderID] = now;
      fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(cooldowns, null, 2));
    }

    const imageUrl = reply.attachments[0].url;
    const requestUrl = `https://egret-driving-cattle.ngrok-free.app/api/editpro2?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;

    const loadingMsg = await message.reply(`🎨 Editing image with prompt: "${prompt}"...`);

    try {
      const res = await axios.get(requestUrl);
      const finalImgUrl = res.data.image_url;

      if (!finalImgUrl) throw new Error("No image URL returned from API.");

      const img = await getStreamFromURL(finalImgUrl);
      await message.reply({
        body: `✅ Image Edited!\n📌 Prompt: ${prompt}`,
        attachment: img
      });

    } catch (err) {
      console.error("EditPro Error:", err.message || err);

      if (err.response?.data?.error === "rate_limit_exceeded") {
        await message.reply("⏳ An image is already being processed. Please wait a moment and try again.");
      } else {
        await message.reply("❌ Failed to edit image. Please try again later.");
      }
    }

    await message.unsend(loadingMsg.messageID);
  }
};