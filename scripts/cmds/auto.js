 
const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");

module.exports = {
  config: {
    name: 'auto',
    version: '5.1',
    author: 'Ariyan',
    countDown: 3,
    role: 0,
    shortDescription: 'Download videos from FB, IG, YT, TikTok',
    category: 'media',
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("✅ Auto downloader active. Send a Facebook, Instagram, YouTube or TikTok video link.", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const message = event.body;

    const linkMatch = message.match(/https?:\/\/[^\s]+/);
    if (!linkMatch) return;

    const url = linkMatch[0];
    const validSites = ["facebook.com", "fb.watch", "instagram.com", "instagr.am", "youtube.com", "youtu.be", "tiktok.com"];

    // If the link is not from a supported site, silently ignore
    if (!validSites.some(site => url.includes(site))) return;

    // Show ⏳ reaction
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const { data } = await axios.get(`https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`);

      const videoUrl = data.data.high || data.data.low;
      if (!videoUrl) throw new Error("No video found");

      const filePath = "video.mp4";

      request(videoUrl).pipe(fs.createWriteStream(filePath)).on("close", () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        api.sendMessage({
          body: `🎬 ${data.data.title || "Video"}\n✅ Downloaded successfully.`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => fs.unlinkSync(filePath));
      });

    } catch (e) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("⚠️ Failed to download. The link might be private or not a valid video.", threadID, event.messageID);
    }
  }
};