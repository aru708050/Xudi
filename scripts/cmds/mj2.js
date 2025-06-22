 
const axios = require('axios');
const { getStreamFromURL, shortenURL } = global.utils;

function generateTaskId() {
  return "nyx_" + Math.floor(Math.random() * 1e15);
}

module.exports = {
  config: {
    name: "mj2",
    aliases: ["dhn"],
    version: "1.0",
    author: "Nyx",
    countDown: 10,
    role: 2,
    longDescription: { en: "Generates images using Nyx MJ API" },
    category: "GEN",
    guide: { en: "{pn} [prompt]" }
  },

  onStart: async function ({ message, event, args, commandName }) {
    try {
      const prompt = args.join(" ");
      if (!prompt) return message.reply("❌ Prompt required");

      const taskId = generateTaskId();
      const loading =  message.reply(`⏳ Generating...\nTask ID: ${taskId}`);
      const apiURL = `http://37.1.211.119:9003/generate?prompt=${encodeURIComponent(prompt)}&apiKey=nyx008`;

      const { data } = await axios.get(apiURL);
      if (!data?.image_url) {
        message.unsend(loading.messageID);
        return message.reply("❌ Generation failed");
      }

      message.unsend(loading.messageID);
      message.reply({
        body: `🎨 Generated (ID: ${taskId})\nReply with U1-U4/V1-V4`,
        attachment: await getStreamFromURL(data.image_url)
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: event.senderID,
          imageId: data.image_id,
          upscales: data.parts,
          variations: data.variations
        });
      });

    } catch (err) {
      message.reply(`❌ Error server in maintain`);
    }
  },

  onReply: async function ({ message, event, Reply, commandName }) {
  const { upscales , variations ,author, imageId } = Reply
    console.log(upscales)
    try {
      if (event.senderID !== author) return;
      const choice = event.body?.toUpperCase();
      if (!/^[UV][1-4]$/.test(choice)) return message.reply("❌ Invalid choice");

      const taskId = generateTaskId();
      const loading = message.reply(`⏳ Processing ${choice}...\nID: ${taskId}`);

      if (choice.startsWith("U")) {
const selected = upscales?.filter(p => p.name === choice)[0]
        if (!selected?.url) {
           message.unsend(loading.messageID);
          return message.reply("❌ Invalid upscale URL");
        }

        await message.reply({
          body: `🖼 Upscaled ${choice} (ID: ${taskId})\n${await shortenURL(selected.url)}`,
          attachment: await getStreamFromURL(selected.url)
        });
         message.unsend(loading.messageID);
      }

      if (choice.startsWith("V")) {
        const variationAPI = `http://37.1.211.119:9003/variation?variation=${choice}&image_id=${imageId}`;
        const { data: result } = await axios.get(variationAPI);

        if (!result?.image_url) {
           message.unsend(loading.messageID);
          return message.reply("❌ Variation failed");
        }

        message.unsend(loading.messageID);
        message.reply({
          body: `🎨 Variation ${choice} (ID: ${taskId})\nReply with new options`,
          attachment: await getStreamFromURL(result.image_url)
        }, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            author: event.senderID,
            imageId: result.image_id,
            upscales: result.parts,
            variations: result.actions
          });
        });
      }

    } catch (err) {
      message.reply(`❌ Error server in maintain`);
    }
  }
};