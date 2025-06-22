const fs = require('fs');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "owner",
    aliases: ["owner", "own"],
    version: "2.0",
    author: "Ariyan",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "Sends information about the bot and admin."
    },
    longDescription: {
      vi: "",
      en: "Sends information about the bot and admin."
    },
    category: "Information",
    guide: {
      en: "{pn}"
    },
    envConfig: {}
  },

  onStart: async function ({ message }) {
    await this.sendInfo(message);
  },

  onChat: async function ({ event, message }) {
    if (event.body && event.body.toLowerCase() === "info") {
      await this.sendInfo(message);
    }
  },

  sendInfo: async function (message) {
    try {
      const botName = "Ariyan Bot";
      const botPrefix = ")";
      const authorName = "𝗔RIYAN";
      const authorFB = "NOPE 🐸";
      const authorInsta = "Shor Mgii 😒";
      const status = "Married";

      const now = moment().tz('Asia/Dhaka');
      const time = now.format('h:mm:ss A');

      const uptime = process.uptime();
      const seconds = Math.floor(uptime % 60);
      const minutes = Math.floor((uptime / 60) % 60);
      const hours = Math.floor((uptime / (60 * 60)) % 24);
      const days = Math.floor(uptime / (60 * 60 * 24));
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      await message.reply(
`╭────────────◊
├‣ 𝐁𝐨𝐭 & 𝐎𝐰𝐧𝐞𝐫 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 
├‣ 𝐍𝐚𝐦𝐞: ${authorName}
├‣ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞:  ${botName}
├‣ 𝐏𝐫𝐞𝐟𝐢𝐱:  ${botPrefix}
├‣ 𝐅𝐛: ${authorFB}
├‣ 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦:  ${authorInsta}
├‣ 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧𝐬𝐡𝐢𝐩: ${status}   
├‣ 𝐓𝐢𝐦𝐞:  ${time}
├‣ 𝐔𝐩𝐭𝐢𝐦𝐞: ${uptimeString}
╰────────────◊`
      );

    } catch (err) {
      console.error("❌ Error in owner command:", err);
      return message.reply("❌ Error occurred while sending owner info.");
    }
  }
};