const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "hgen",
    version: "1.0",
    author: "@RI F AT ",
    countDown: 5,
    role: 0,
    shortDescription: "Generate image from prompt",
    longDescription: "Generate an AI image using a prompt",
    category: "ai",
    guide: {
      en: "{pn} <your prompt>"
    }
  },

  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❌ Please enter a prompt to generate an image.");
    }

    const url = `https://hgen.onrender.com/ai?prompt=${encodeURIComponent(prompt)}`;

    try {
      const res = await axios.get(url, { responseType: 'stream' });
      const ext = res.headers['content-type'].split('/')[1] || 'jpg';
      const fileName = `hgen_${Date.now()}.${ext}`;
      const filePath = path.join(__dirname, 'cache', fileName);

      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      writer.on('finish', () => {
        message.reply({
          body: `🖼️ Prompt: ${prompt}`,
          attachment: fs.createReadStream(filePath)
        }, () => fs.unlinkSync(filePath));
      });

      writer.on('error', (err) => {
        console.error(err);
        message.reply("❌ Error saving the image.");
      });

    } catch (err) {
      console.error(err.message);
      message.reply("❌ Failed to generate image. The API might be down.");
    }
  }
};