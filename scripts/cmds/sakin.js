const axios = require("axios");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json");
    return base.data.api;
};

module.exports.config = {
    name: "sakin",
    version: "1.0",
    author: "Arafat Da",
    countDown: 5,
    role: 0,
    description: {
        en: "Send a random TikTok video from sakin_ml",
    },
    category: "MEDIA",
    guide: {
        en: "{pn} - Sends a random video from 'sakin_ml' TikTok search results",
    },
};

module.exports.onStart = async function ({ api, event }) {
    const search = "sakin_ml Bangla Amv";
    const searchLimit = 50; // তুমি চাইলে কম/বেশি করতে পারো

    const apiUrl = `${await baseApiUrl()}/tiktoksearch?search=${encodeURIComponent(search)}&limit=${searchLimit}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data.data;

        if (!data || data.length === 0) {
            return api.sendMessage("❌ কোনো ভিডিও পাওয়া যায়নি!", event.threadID);
        }

        const videoData = data[Math.floor(Math.random() * data.length)];

        const stream = await axios({
            method: "get",
            url: videoData.video,
            responseType: "stream",
        });

        let infoMessage = `🎥 Video Title: ${videoData.title}\n`;
        infoMessage += `🔗 Video URL: ${videoData.video}`;

        api.sendMessage(
            { body: infoMessage, attachment: stream.data },
            event.threadID
        );
    } catch (error) {
        console.error("❌ Error:", error.message);
        api.sendMessage(
            "⚠️ ভিডিও আনতে সমস্যা হয়েছে। একটু পর আবার চেষ্টা করো!",
            event.threadID
        );
    }
};