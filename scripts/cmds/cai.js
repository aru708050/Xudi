const axios = require("axios");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "caiData.json");
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

module.exports = {
  config: {
    name: "cai",
    version: "2.0",
    author: "@RI F AT ",
    role: 0,
    category: "ai",
    shortDescription: {
      en: "Talk to Character AI with custom style"
    }
  },

  onStart: async function ({ message, event, args, commandName }) {
    const userId = event.senderID;
    const userData = JSON.parse(fs.readFileSync(dataPath));

    // Handle: /cai set <character>
    if (args[0] === "set" && args[1]) {
      const style = args.slice(1).join("_");
      userData[userId] = style;
      fs.writeFileSync(dataPath, JSON.stringify(userData, null, 2));
      return message.reply(`✅Character set to: ${style.replace(/_/g, " ")}`);
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❓ Please enter a message or set a style using:\n/cai set <character>");
    }

    const style = userData[userId] || "ichigo_kurosakifrom_bleach";

    try {
      const res = await axios.get(
        `https://character-ai-1.onrender.com/chat?message=${encodeURIComponent(prompt)}&style=${encodeURIComponent(style)}`
      );

      const reply = res.data?.reply?.replace(/^"|"$/g, "") || "⚠️ No reply.";
      message.reply(
        { body: reply },
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: userId
            });
          }
        }
      );
    } catch (error) {
      console.error(error.message);
      message.reply("❌ Failed to contact Character AI.");
    }
  },

  onReply: async function ({ message, event, Reply, args }) {
    const { author, commandName } = Reply;
    if (event.senderID !== author) return;

    const userData = JSON.parse(fs.readFileSync(dataPath));
    const userId = event.senderID;
    const style = userData[userId] || "ichigo_kurosakifrom_bleach";

    const prompt = args.join(" ");
    if (!prompt) return;

    try {
      const res = await axios.get(
        `https://character-ai-1.onrender.com/chat?message=${encodeURIComponent(prompt)}&style=${encodeURIComponent(style)}`
      );

      const reply = res.data?.reply?.replace(/^"|"$/g, "") || "⚠️ No reply.";
      message.reply(
        { body: reply },
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: userId
            });
          }
        }
      );
    } catch (error) {
      console.error(error.message);
      message.reply("❌ Failed to contact Character AI.");
    }
  }
};
