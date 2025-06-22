const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "anitts",
    version: "2.0",
    author: "NTKhang",
    countDown: 10,
    role: 0,
    shortDescription: "Anime Voice Generator",
    longDescription: "Convert text to anime character voice with speed control",
    category: "ai",
    guide: "{pn} <model> | <text> | [speed=1]"
  },

  onStart: async function ({ api, event, args }) {
    try {
      // Parse input
      const input = args.join(" ").split("|").map(item => item.trim());
      if (input.length < 2) {
        return api.sendMessage("❌ Usage: /anitts <model> | <text> | [speed]\nExample: /anitts Paimon | Hello traveler | 1.2", event.threadID);
      }

      const model = input[0];
      const text = input[1];
      const speed = input[2] || "1"; // Default speed = 1

      // Validate text length
      if (text.length > 150) {
        return api.sendMessage("❌ Text too long (max 150 characters)", event.threadID);
      }

      // Create temp directory
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate unique filename
      const filePath = path.join(tempDir, `anime_tts_${Date.now()}.mp3`);

      // API call to Anime TTS endpoint
      const response = await axios.get(
        `https://fastrestapis.fasturl.cloud/tts/anime?text=${encodeURIComponent(text)}&model=${encodeURIComponent(model)}&speed=${speed}&language=Mix`, 
        { 
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'GoatBot-V2-AnimeTTS'
          }
        }
      );

      // Save audio file
      fs.writeFileSync(filePath, response.data);

      // Send voice message
      await api.sendMessage({
        body: `🗣️ ${model} says:\n"${text}"\n(Speed: ${speed}x)`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);

      // Clean up
      fs.unlinkSync(filePath);

    } catch (error) {
      console.error("Anime TTS Error:", error);
      api.sendMessage("❌ Failed to generate voice. Possible reasons:\n1. Invalid model name\n2. API limit reached\n3. Text contains blocked content", event.threadID);
    }
  }
};
