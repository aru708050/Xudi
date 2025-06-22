const axios = require('axios');
const fs = require('fs');

module.exports = {
  config: {
    name: "video",
    aliases: ["vid", "youtubevid"],
    version: "1.0",
    author: "Mahi--",
    description: "Fetches and downloads video from YouTube using a search query or URL.",
    category: "Utility",
    guide: "{pn} <YouTube URL or search query>"
  },

  onStart: async function ({ api, event, args }) {
    if (args.length === 0) {
      return api.sendMessage("Please provide a YouTube URL or search query.", event.threadID, event.messageID);
    }

    const input = args.join(" ");
    let videoUrl, videoTitle;

    // Attempt to react with "waiting" status
    try {
      await api.setMessageReaction?.("🔄", event.messageID, true);
    } catch (e) {
      console.log("Reaction 'waiting' failed:", e.message);
    }

    try {
      // Check if the input is a URL or search query
      if (!input.startsWith("http")) {
        const searchResponse = await axios.get(`https://mahi-apis.onrender.com/api/ytsearch`, {
          params: { query: input }
        });

        if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
          throw new Error("No results found for your search query.");
        }

        const video = searchResponse.data.items[0];
        videoUrl = video.url;
        videoTitle = video.title;
      } else {
        videoUrl = input;
        videoTitle = "Video File";
      }

      // Load cookies if available
      const cookies = fs.existsSync('cookie.txt') ? fs.readFileSync('cookie.txt', 'utf-8') : '';

      // Fetch the video using the external API
      const res = await axios.post('https://app.only-fans.club/yt', {
        url: videoUrl,
        filesize: 83, // Adjust as needed
        format: 'video',
        cookies: cookies
      });

      const data = res.data;

      if (!data || !data.url) {
        throw new Error("Failed to fetch the video. Please check the URL or try again later.");
      }

      // React with "success" status
      try {
        await api.setMessageReaction?.("✅", event.messageID, true);
      } catch (e) {
        console.log("Reaction 'success' failed:", e.message);
      }

      // Send the response with the video file
      await api.sendMessage({
        body: `• ${data.title}\n• Duration: ${data.duration}\n• Upload Date: ${data.upload_date}\n• Download: ${data.url}`,
        attachment: await global.utils.getStreamFromUrl(data.url)
      }, event.threadID, event.messageID);

    } catch (e) {
      // React with "failure" status
      try {
        await api.setMessageReaction?.("❌", event.messageID, true);
      } catch (err) {
        console.log("Reaction 'failure' failed:", err.message);
      }

      const errorMessage = e.response?.data || e.message || "An unknown error occurred.";
      api.sendMessage(`Error: ${errorMessage}`, event.threadID, event.messageID);
    }
  }
};