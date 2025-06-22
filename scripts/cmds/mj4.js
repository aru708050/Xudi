 

const axios = require("axios");
const { getStreamFromURL } = global.utils;
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "mjx",
  aliases: ["mj4"],
  version: "2.0",
  role: 0,
  author: "Dipto",
  description: "MidJourney image generator",
  usePrefix: true,
  guide: "{pn} [prompt]",
  category: "𝗜𝗠𝗔𝗚𝗘 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥",
  premium: true,
  countDown: 35,
};

async function splitImage(imageUrl, messageID) {
  try {
    const image = await loadImage(imageUrl);
    const width = image.width;
    const height = image.height;
    const halfWidth = Math.floor(width / 2);
    const halfHeight = Math.floor(height / 2);

    const parts = [
      { name: 'U1', x: 0, y: 0 },
      { name: 'U2', x: halfWidth, y: 0 },
      { name: 'U3', x: 0, y: halfHeight },
      { name: 'U4', x: halfWidth, y: halfHeight }
    ];

    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const generatedFiles = [];

    for (const part of parts) {
      const canvas = createCanvas(halfWidth, halfHeight);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, part.x, part.y, halfWidth, halfHeight, 0, 0, halfWidth, halfHeight);

      const filePath = path.join(tempDir, `${messageID}_${part.name}.png`);
      const out = fs.createWriteStream(filePath);
      const stream = canvas.createPNGStream();
      await new Promise((resolve, reject) => {
        stream.pipe(out);
        out.on('finish', () => {
          generatedFiles.push({
            name: part.name,
            path: filePath
          });
          resolve();
        });
        out.on('error', reject);
      });
    }

    return generatedFiles;

  } catch (error) {
    console.error('Error splitting image:', error);
    throw error;
  }
}

module.exports.onReply = async function ({ api, event, message, Reply }) {
  let reply = event?.body?.toLowerCase() || "";
  const { author } = Reply;
  if (author != event.senderID) return;

  if (event.type == "message_reply") {
    try {
      if (isNaN(reply)) {
        if (reply === "u1" || reply === "u2" || reply === "u3" || reply === "u4") {
          const selectedPart = Reply.splitImages.find(img => img.name.toLowerCase() === reply);
          if (selectedPart) {
            await api.sendMessage({
              body: `✅ | Here's your (${selectedPart.name}) image\n⚫ | More available actions\n\n1. pan_up\n2. pan_left\n3. pan_right\n4. zoom_out_2x4\n5. zoom_out_1_5x`,
              attachment: fs.createReadStream(selectedPart.path)
            }, event.threadID, event.messageID);

            Reply.splitImages.forEach(img => {
              try {
                fs.unlinkSync(img.path);
              } catch (e) {
          console.error(`Error deleting ${img.path}:`, e);
              }
            });
            return;
          }
        }

        let actionn;
       /* if (reply == "u1") {
          actionn = Reply.action[0];
        } else if (reply == "u2") {
          actionn = Reply.action[1];
        } else if (reply == "u3") {
          actionn = Reply.action[2];
        } else if (reply == "u4") {
          actionn = Reply.action[3];
        } else */if (reply == "v1") {
          actionn = Reply.action[4];
        } else if (reply == "v2") {
          actionn = Reply.action[5];
        } else if (reply == "v3") {
          actionn = Reply.action[6];
        } else if (reply == "v4") {
          actionn = Reply.action[7];
        } else {
          return message.reply("Please reply with a valid option.\n\n1. U1\n2. U2\n3. U3\n4. U4\n🔄\n1. V1\n2. V2\n3. V3\n4. V4");
        }

        const waitMsg2 = await message.reply("Wait a moment...");
        const response = await axios.get(`https://noobs-api.top/dipto/midjourneyAction?action=${actionn}&image_id=${Reply.imageID}`);
        message.unsend(waitMsg2.messageID);
        await api.sendMessage({
          body: `✅ | Here's your image\n⚫ | More available actions\n\n1. pan_up\n2. pan_left\n3. pan_right\n4. zoom_out_2x4\n5. zoom_out_1_5x`,
          attachment: await getStreamFromURL(response.data.image_url)
        }, event.threadID, (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: 'reply',
            messageID: info.messageID,
            author: event.senderID,
            imageID: response.data.image_id,
            action: response.data.actions
          });
        }, event.messageID);
      }
    } catch (error) {
      console.error(error.message);
      api.sendMessage(`❎ | Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};

module.exports.onStart = async function ({ message, api, args, event }) {
  try {
    const dipto = args.join(" ");
    if (!args[0]) {
      return message.reply("❎ | Please provide a prompt.");
    }

    const waitMsg = await message.reply("Generating your image...");
    const res = await axios.get(`https://noobs-api.top/dipto/midjourney?prompt=${encodeURIComponent(dipto)}&key=mjcudi`);

    message.unsend(waitMsg.messageID);

    const splitImages = await splitImage(res.data.image_url, event.messageID);

    await api.sendMessage({
      body: `Generated image:\n\n𝐑𝐞𝐩𝐥𝐲 𝐭𝐨 𝐭𝐡𝐢𝐬 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐰𝐢𝐭𝐡 𝐔𝟏/𝐔𝟐/𝐔𝟑/𝐔𝟒
🔄
𝐕𝟏/𝐕𝟐/𝐕𝟑/𝐕𝟒 𝐭𝐨 𝐠𝐞𝐭 𝐢𝐦𝐚𝐠𝐞.`,
      attachment: await getStreamFromURL(res.data.image_url)
    }, event.threadID, (error, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        type: 'reply',
        messageID: info.messageID,
        author: event.senderID,
        imageID: res.data.image_id,
        action: res.data.actions,
        splitImages: splitImages
      });
    }, event.messageID);

  } catch (error) {
    console.error(error.message);
    api.sendMessage(`❎ | Error: ${error.message}`, event.threadID, event.messageID);
  }
}