 
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "goat",
    version: "1.0.3",
    author: "ARIJIT",
    countDown: 5,
    role: 0,
    shortDescription: "Expose someone as a goat!",
    longDescription: "Puts the tagged/replied user's face on a goat's body (fun meme)",
    category: "pro",
    guide: {
      en: "{pn} @mention or reply to goat someone",
    },
  },

  onStart: async function ({ event, message, api }) {
    let targetID = Object.keys(event.mentions)[0];
    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
    }

    if (!targetID) {
      return message.reply("❗ কাউকে mention বা reply করো তাকে ছাগল বানাতে!");
    }

    if (targetID === event.senderID) {
      return message.reply("❗ নিজেকেই ছাগল বানাচ্ছো নাকি ভাই? 😂");
    }

    const baseFolder = path.join(__dirname, "ARIJIT");
    const bgPath = path.join(baseFolder, "goat.jpg");
    const avatarPath = path.join(baseFolder, `avatar_${targetID}.png`);
    const outputPath = path.join(baseFolder, `goat_result_${targetID}.png`);

    try {
      if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder);

      // Goat background download
      if (!fs.existsSync(bgPath)) {
        const imgUrl = "https://files.catbox.moe/9zzfko.jpg"; // Goat image URL
        const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, res.data);
      }

      // Download Facebook avatar
      const avatarBuffer = (
        await axios.get(
          `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;
      fs.writeFileSync(avatarPath, avatarBuffer);

      // Process avatar
      const avatarImg = await jimp.read(avatarPath);
      avatarImg.circle(); // Make circular
      await avatarImg.writeAsync(avatarPath);

      const bg = await jimp.read(bgPath);
      bg.resize(600, 800); // Optional resize

      const avatarCircle = await jimp.read(avatarPath);
      avatarCircle.resize(100, 100); // Bigger to fit red circle better

      // ✅ Updated coordinates to match red circle on goat’s face
      const xFace = 175;
      const yFace = 105;
      bg.composite(avatarCircle, xFace, yFace);

      // Optional caption
      const font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
      bg.print(font, 10, bg.getHeight() - 50, "😂 ছাগলের আসল রূপ প্রকাশিত!");

      const finalBuffer = await bg.getBufferAsync(jimp.MIME_PNG);
      fs.writeFileSync(outputPath, finalBuffer);

      const userInfo = await api.getUserInfo(targetID);
      const tagName = userInfo[targetID]?.name || "Someone";

      await message.reply(
        {
          body: `🤣😹\n${tagName} দেখো দেখো! এই হলো আসল ছাগল 🐐`,
          mentions: [{ tag: tagName, id: targetID }],
          attachment: fs.createReadStream(outputPath),
        },
        () => {
          // Clean up temp files
          fs.unlinkSync(avatarPath);
          fs.unlinkSync(outputPath);
        }
      );
    } catch (err) {
      console.error("goat Command Error:", err);
      message.reply("❌ সমস্যা হইছে ভাই। আবার try করো!");
    }
  },
};