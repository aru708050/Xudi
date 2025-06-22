  const os = require("os");
const { createCanvas, loadImage } = require("canvas");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const moment = require("moment-timezone");
const fs = require("fs");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "up"],
    version: "1.6",
    author: "MaHi + Modified by Ariyan",
    role: 0,
    noPrefix: true,
    shortDescription: {
      en: "Check bot uptime with image & ping"
    },
    longDescription: {
      en: "Shows how long the bot has been running, including days, plus ping & image"
    },
    category: "system",
    guide: {
      en: "Just type 'up' to check status"
    }
  },

  onStart: () => {
    console.log("✅ Uptime command loaded.");
  },

  onChat: async function ({ event, message, usersData, threadsData }) {
    const body = event.body ? event.body.toLowerCase() : "";
    if (body === "up") {
      try {
        // Step 1: Show "checking ping..." and measure delay
        const pingMsg = await message.reply("⚡ Checking ping...");
        const start = Date.now();
        await new Promise(r => setTimeout(r, 100));
        const ping = Date.now() - start;

        // Step 2: Calculate uptime with days
        const uptime = process.uptime();
        const s = Math.floor(uptime % 60);
        const m = Math.floor((uptime / 60) % 60);
        const h = Math.floor((uptime / 3600) % 24);
        const d = Math.floor(uptime / (3600 * 24));
        const upTimeStr = `${d}d ${h}h ${m}m ${s}s`;

        // Step 3: Load image background
        const background = await loadImage("https://i.imgur.com/hes9xq4.jpeg");
        const canvas = createCanvas(1000, 500);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(background, 0, 0, 1000, 500);

        // Step 4: Add uptime text to image
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 5;

        ctx.fillText("BOT UPTIME", 72, 100);
        ctx.fillText(`${upTimeStr}`, 72, 200);

        ctx.shadowColor = "transparent";

        const imagePath = `${__dirname}/uptime_image.png`;
        const buffer = canvas.toBuffer();
        fs.writeFileSync(imagePath, buffer);

        // Step 5: Delete the "checking ping..." message
        await message.unsend(pingMsg.messageID);

        // Step 6: Send final stylized message
        await message.reply({
          body: 
`╭───────────────────────╮
         BOT STATUS
──────╯
╰─────────────────

┏━━━━━━━━━━━━━━━┓
┃ 💤 𝖴𝗉𝗍𝗂𝗆e: ⏳ ${upTimeStr}
┃ ⚡ 𝖯𝗂𝗇𝗀: ${ping}ms
┃ 👑 𝖮𝗐𝗇𝖾𝗋: Ariyan
┗━━━━━━━━━━━━━━━┛

𝗕𝗼𝘁 𝗶𝘀 𝗮𝗹𝗶𝘃𝗲 𝗮𝗻𝗱 𝗿𝗲𝗮𝗱𝘆 𝘁𝗼 𝗿𝘂𝗹𝗲!`,
          attachment: fs.createReadStream(imagePath)
        });

        fs.unlinkSync(imagePath);

      } catch (err) {
        console.error(err);
        await message.reply("❌ An error occurred while generating uptime.");
      }
    }
  }
};