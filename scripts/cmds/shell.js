 const { exec } = require('child_process');

module.exports = {
  config: {
    name: "shell",
    version: "1.0",
    author: "Samir // Eren Yeager",
    countDown: 5,
    role: 0,
    shortDescription: "Execute shell commands",
    longDescription: "Executes terminal shell commands from chat",
    category: "shell",
    guide: {
      vi: "{p}{n} <command>",
      en: "{p}{n} <command>"
    },
    usePrefix: false,
    onChat: true
  },

  onStart: async function ({ args, message, event }) {
    const allowedUIDs = ["61556251307831", "61556251307831"];
    if (!allowedUIDs.includes(event.senderID)) {
      const insults = [
        "Oh My God 🙀 \n Nasa' র অনেক বড় হেকার আইসে আমার Shell use করতে 🙀",
        "এই কমান্ড তোর জন্য না, যাহ কেল্কুলেটর চালা 😒",
        "𝐏𝐫𝐨𝐭𝐡𝐨𝐦𝐞 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧 𝐦𝐚𝐧𝐚𝐠𝐞 𝐤𝐨𝐫!",
        "𝐂𝐨𝐝𝐞 𝐥𝐢𝐤𝐡𝐚𝐫 𝐚𝐠𝐞 𝐛𝐚𝐛𝐚𝐫 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧 𝐧𝐢𝐞 𝐚𝐬!",
        "তুই shell দিয়া কি করবি মাংগের নাতি 😿",
        "বম্ব বলা উইরা জা মাংগের পোলা 🥸!",
        "chup chap Hente choila ja 🐒!",
        "Vhai Ei command Kono Bacchara Chalate pare na 🙂🤲!"
      ];
      const insult = insults[Math.floor(Math.random() * insults.length)];
      return message.reply(`════════════════════\n${insult}\n════════════════════`);
    }

    const command = args.join(" ");
    if (!command) {
      return message.reply("Please provide a command to execute.");
    }

    exec(command, (error, stdout, stderr) => {
      if (error) return message.reply(`❌ Error:\n${error.message}`);
      if (stderr) return message.reply(`⚠️ Stderr:\n${stderr}`);
      const output = stdout || "✅ Command executed successfully, but no output.";
      message.reply(`✅ Output:\n${output}`);
    });
  },

  onChat: async function ({ event, args, message }) {
    const prefixUsed = event.body.split(" ")[0].toLowerCase();
    if (prefixUsed !== "shell") return;

    const allowedUIDs = ["61556251307831", "61556251307831"];
    if (!allowedUIDs.includes(event.senderID)) {
      const insults = [
        "Oh My God 🙀 \n Nasa' র অনেক বড় হেকার আইসে আমার Shell use করতে 🙀",
        "এই কমান্ড তোর জন্য না, যাহ কেল্কুলেটর চালা 😒",
        "𝐏𝐫𝐨𝐭𝐡𝐨𝐦𝐞 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧 𝐦𝐚𝐧𝐚𝐠𝐞 𝐤𝐨𝐫!",
        "𝐂𝐨𝐝𝐞 𝐥𝐢𝐤𝐡𝐚𝐫 𝐚𝐠𝐞 𝐛𝐚𝐛𝐚𝐫 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧 𝐧𝐢𝐞 𝐚𝐬!",
        "তুই shell দিয়া কি করবি মাংগের নাতি 😿",
        "বম্ব বলা উইরা জা মাংগের পোলা 🥸!",
        "chup chap Hente choila ja 🐒!",
        "Vhai Ei command Kono Bacchara Chalate pare na 🙂🤲!"
      ];
      const insult = insults[Math.floor(Math.random() * insults.length)];
      return message.reply(`════════════════════\n${insult}\n════════════════════`);
    }

    const command = args.join(" ");
    if (!command) {
      return message.reply("Please provide a command to execute.");
    }

    exec(command, (error, stdout, stderr) => {
      if (error) return message.reply(`❌ Error:\n${error.message}`);
      if (stderr) return message.reply(`⚠️ Stderr:\n${stderr}`);
      const output = stdout || "✅ Command executed successfully, but no output.";
      message.reply(`✅ Output:\n${output}`);
    });
  }
};