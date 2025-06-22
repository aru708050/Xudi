const fs = require("fs");
const axios = require("axios");
const request = require("request");

module.exports = {
  config: {
    name: "pindl",
    version: "1.0",
    author: "Ariyan",
    shortDescription: "Auto-download Pinterest videos",
    category: "media",
    role: 0,
    countDown: 5
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("✅ Pinterest AutoDownloader is now active.", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const urlMatch = body.match(/(https?:\/\/[^\s]+)/);
    if (!urlMatch) return;

    const url = urlMatch[0];
    if (!url.includes("pinterest.")) return;

    const processingMsg = await api.sendMessage("⏳ 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐢𝐧𝐠 𝐏𝐢𝐧𝐭𝐞𝐫𝐞𝐬𝐭 𝐯𝐢𝐝𝐞𝐨...", threadID, messageID);

    try {
      // ✅ Use a working public Pinterest downloader API
      const res = await axios.get(`https://pinterest-downloader-api.vercel.app/api/download?url=${encodeURIComponent(url)}`);
      const { video, title } = res.data;

      if (!video) {
        await api.unsendMessage(processingMsg.messageID);
        return api.sendMessage("❌ 𝐂𝐨𝐮𝐥𝐝 𝐧𝐨𝐭 𝐟𝐞𝐭𝐜𝐡 𝐚 𝐝𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐚𝐛𝐥𝐞 𝐯𝐢𝐝𝐞𝐨.", threadID, messageID);
      }

      const filePath = __dirname + "/pin_video.mp4";
      request(video).pipe(fs.createWriteStream(filePath)).on("close", () => {
        api.sendMessage({
          body: `🎥 𝐓𝐢𝐭𝐥𝐞: ${title || "Unknown"}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => fs.unlinkSync(filePath), messageID);
      });

    } catch (err) {
      await api.unsendMessage(processingMsg.messageID);
      console.error("Pinterest DL Error:", err.message);
      return api.sendMessage("❌ 𝐄𝐫𝐫𝐨𝐫 𝐝𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐢𝐧𝐠 𝐏𝐢𝐧𝐭𝐞𝐫𝐞𝐬𝐭 𝐯𝐢𝐝𝐞𝐨.", threadID, messageID);
    }
  }
};