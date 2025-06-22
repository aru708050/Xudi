
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const VOICE_MODELS = {
  1: "Nova",
  2: "Shimmer",
  3: "Echo",
  4: "Sable",
  5: "Faye",
  6: "Ember",
  7: "Breeze"
};

module.exports = {
  config: {
    name: "gpt2",
    version: "1.2",
    author: "@RI F AT ",
    role: 0,
    category: "ai",
    shortDescription: { en: "Chat + Voice + Image AI" }
  },

  onStart: async function({ message, event, args, commandName }) {
    const fullInput = args.join(" ");
    if (!fullInput) return message.reply("⚠️ Enter a prompt.");

    const senderID = event.senderID;
    const chatSession = `chat_${senderID}`;
    const voiceSession = `voice_${senderID}`;

    const isVoice = fullInput.includes("-v");
    const isImage = fullInput.includes("-img");

    const modelMatch = fullInput.match(/-m\s?(\d+)/);
    const modelNum = modelMatch ? parseInt(modelMatch[1]) : 1;
    const voiceModel = VOICE_MODELS[modelNum] || VOICE_MODELS[1];

    const imgModelMatch = fullInput.match(/-img\s?(turbo|flux)/i);
    const imgModel = imgModelMatch ? imgModelMatch[1].toLowerCase() : "turbo";

    // Reset session
    if (args[0] === "reset") {
      await axios.get(`https://coustom-gpt.onrender.com/reset?session=${chatSession}`);
      await axios.get(`https://coustom-gpt.onrender.com/reset?session=${voiceSession}`);
      return message.reply("✅ Session has been reset.");
    }

    let cleanPrompt = fullInput
      .replace(/-v/g, "")
      .replace(/-m\s?\d+/g, "")
      .replace(/-img\s?(turbo|flux)/gi, "")
      .trim();

    if (!cleanPrompt) return message.reply("⚠️ Prompt is empty.");

    await message.reply("⏳ Generating...");

    try {
      // 🖼️ Image generation
      if (isImage) {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=720&height=1280&model=${imgModel}&token=desktophut&negative_prompt=worst%20quality%2C%20blurry&nologo=true`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const filePath = path.join(__dirname, `${chatSession}_img.jpg`);
        fs.writeFileSync(filePath, res.data);

        return message.reply({
          body: `🖼️ Generated using '${imgModel}' model`,
          attachment: fs.createReadStream(filePath)
        }, () => fs.unlinkSync(filePath));
      }

      // 🔊 Voice
      if (isVoice) {
        const url = `https://coustom-gpt.onrender.com/voice?q=${encodeURIComponent(cleanPrompt)}&session=${voiceSession}&model=${voiceModel}`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const filePath = path.join(__dirname, `${voiceSession}.mp3`);
        fs.writeFileSync(filePath, res.data);

        return message.reply({
          body: `🎤 [${voiceModel}]`,
          attachment: fs.createReadStream(filePath)
        }, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: senderID,
              isVoice: true,
              model: voiceModel
            });
          }
          fs.unlinkSync(filePath);
        });
      }

      // 💬 Text
      const res = await axios.get(`https://coustom-gpt.onrender.com/chat?q=${encodeURIComponent(cleanPrompt)}&session=${chatSession}`);
      const answer = res.data;
      message.reply(answer, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: senderID,
            isVoice: false
          });
        }
      });
    } catch (err) {
      console.error("❌ Error:", err.message);
      message.reply("❌ Failed to generate.");
    }
  },

  onReply: async function({ message, event, Reply, args }) {
    const { author, commandName, isVoice, model } = Reply;
    const senderID = event.senderID;
    if (senderID !== author || !args.length) return;

    const chatSession = `chat_${senderID}`;
    const voiceSession = `voice_${senderID}`;
    const prompt = args.join(" ");

    try {
      if (isVoice) {
        const url = `https://coustom-gpt.onrender.com/voice?q=${encodeURIComponent(prompt)}&session=${voiceSession}&model=${model}`;
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const filePath = path.join(__dirname, `${voiceSession}.mp3`);
        fs.writeFileSync(filePath, res.data);

        return message.reply({
          body: `🎤`,
          attachment: fs.createReadStream(filePath)
        }, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: senderID,
              isVoice: true,
              model
            });
          }
          fs.unlinkSync(filePath);
        });
      }

      const res = await axios.get(`https://coustom-gpt.onrender.com/chat?q=${encodeURIComponent(prompt)}&session=${chatSession}`);
      const answer = res.data;
      message.reply(answer, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: senderID,
            isVoice: false
          });
        }
      });
    } catch (err) {
      console.error("❌ Reply Error:", err.message);
      message.reply("❌ Failed to reply.");
    }
  }
};