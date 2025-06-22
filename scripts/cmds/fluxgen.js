const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "fluxgen",
    version: "1.1",
    author: "@RI F AT",
    countDown: 30,
    role: 0,
    shortDescription: "Generate AI images with Flux models",
    longDescription: "Create AI-generated images using various Flux models with enhanced error handling",
    category: "AI",
    guide: {
      en: "{pn} [model] [prompt]\nExample: {pn} flux-anime cute cat warrior"
    }
  },

  onStart: async function ({ message, args, event }) {
    try {
      const models = ["flux", "flux-pro", "flux-realism", "flux-anime", "flux-3d", "flux-cablyai", "turbo"];
      
      // Check if user needs help
      if (args[0] === "help") {
        let helpMsg = "📝 Flux AI Image Generator Help:\n\n";
        helpMsg += "Available Models:\n";
        helpMsg += models.map(m => `• ${m}`).join("\n");
        helpMsg += "\n\nUsage:\n";
        helpMsg += "/fluxgen [model] [prompt]\n";
        helpMsg += "Example:\n";
        helpMsg += "/fluxgen flux-anime cute anime girl with blue hair";
        return message.reply(helpMsg);
      }

      if (args.length < 2) {
        return message.reply("❌ Please provide both model and prompt\nType '/fluxgen help' for usage guide");
      }

      const model = args[0].toLowerCase();
      if (!models.includes(model)) {
        return message.reply(`❌ Invalid model. Type '/fluxgen help' to see available models`);
      }

      const prompt = args.slice(1).join(" ");
      const apiUrl = `https://fastrestapis.fasturl.cloud/aiimage/flux/dimension?prompt=${encodeURIComponent(prompt)}&model=${model}&width=1024&height=1024&enhance=true`;

      // Send generating message with typing indicator
      message.reply({
        body: `🖌️ Generating "${prompt}" with ${model}...`,
        mentions: [{
          tag: event.senderID,
          id: event.senderID
        }]
      });

      // Add delay to prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await axios({
        method: 'GET',
        url: apiUrl,
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
        headers: {
          'User-Agent': 'Goat-Bot-V2'
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("Empty response from API");
      }

      const tempPath = path.join(__dirname, "temp");
      if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath);
      }

      const imagePath = path.join(tempPath, `flux_${event.senderID}.jpg`);
      fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));
      
      // Send the image with prompt info
      message.reply({
        body: `🎨 Generated with ${model}\n📝 Prompt: "${prompt}"`,
        attachment: fs.createReadStream(imagePath)
      }, () => {
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {
          console.error("Error deleting temp file:", e);
        }
      });

    } catch (error) {
      console.error("FluxGen Error:", error);
      
      let errorMsg = "❌ Failed to generate image. Possible reasons:\n";
      errorMsg += "1. The API might be down\n";
      errorMsg += "2. Your prompt might be blocked\n";
      errorMsg += "3. Server timeout\n\n";
      errorMsg += "Please try:\n";
      errorMsg += "- A different prompt\n";
      errorMsg += "- Waiting a few minutes\n";
      errorMsg += "- Contacting admin if problem persists";
      
      message.reply(errorMsg);
    }
  }
};
