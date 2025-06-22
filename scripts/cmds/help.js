 
const axios = require("axios");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const mediaUrls = [
  "",
  "",
  ""
];

module.exports = {
  config: {
    name: "help",
    aliases: ["use"],
    version: "1.24",
    author: "Ayanokōji",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Explore command usage 📖",
    },
    longDescription: {
      en: "View detailed command usage, list commands by page, or filter by category ✨",
    },
    category: "info",
    guide: {
      en: "🔹 {pn} [pageNumber]\n🔹 {pn} [commandName]\n🔹 {pn} -c <categoryName>",
    },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    try {
      const { threadID } = event;
      const threadData = await threadsData.get(threadID).catch(() => ({}));
      const prefix = getPrefix(threadID) || "!";

      const ownerInfo = `╭─『 Ariyan bot TOOLS』\n` +
        `╰‣ 👑 Admin: Ariyan\n` +
        `╰‣ 🤖 Bot Name: Ariyan bot\n` +
        `╰───────────────◊\n`;

      const footerInfo = (totalCommands) =>
        `╭─『 Ariyan bot TOOLS』\n` +
        `╰‣ 📋 Total Commands: ${totalCommands}\n` +
        `╰‣ 👑 Admin: Ariyan\n` +
        `╰‣ 🌐 IAM FEELINGLESS\n` +
        `╰───────────────◊\n`;

      const getAttachment = async () => {
        try {
          const randomUrl = mediaUrls[Math.floor(Math.random() * mediaUrls.length)];
          if (!randomUrl) return null;
          const response = await axios.get(randomUrl, { responseType: "stream" });
          return response.data;
        } catch (error) {
          console.warn("Failed to fetch media:", error.message);
          return null;
        }
      };

      if (args.length === 0 || !isNaN(args[0])) {
        const categories = {};
        const commandList = [];

        for (const [name, value] of commands) {
          const category = value.config.category?.toLowerCase() || "uncategorized";
          if (!categories[category]) categories[category] = [];

          const isRestricted = value.config.role > role;
          categories[category].push(isRestricted ? `${name} 🔒` : name);
          commandList.push(name);
        }

        const totalCommands = commandList.length;

        Object.keys(categories).forEach(cat => {
          categories[cat].sort((a, b) => a.localeCompare(b));
        });

        const sortedCategories = Object.keys(categories).sort();

        const page = parseInt(args[0]) || 1;
        const itemsPerPage = 5;
        const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);

        if (page < 1 || page > totalPages)
          return message.reply(`🚫 Invalid page! Please select between 1 and ${totalPages}.`);

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pagedCategories = sortedCategories.slice(start, end);

        let msg = `✨ [ Command Guide — Page ${page}/${totalPages} ] ✨\n\n` + ownerInfo;

        for (const category of pagedCategories) {
          const cmds = categories[category];
          msg += `╭──── [ ${category.toUpperCase()} ]\n`;
          msg += `│ ✧ ${cmds.join(" ✧ ")}\n`;
          msg += `╰───────────────◊\n`;
        }

        msg += `🔒 = Restricted commands (You can't use them)\n`;
        msg += footerInfo(totalCommands);

        return message.reply({
          body: msg,
          attachment: await getAttachment()
        });
      }

      if (args[0].toLowerCase() === "-c") {
        if (!args[1]) return message.reply("🚫 Please specify a category!");
        const categoryName = args[1].toLowerCase();
        const filteredCommands = Array.from(commands.values()).filter(
          (cmd) => (cmd.config.category?.toLowerCase() === categoryName)
        );

        if (filteredCommands.length === 0)
          return message.reply(`🚫 No commands found in "${categoryName}" category.`);

        const cmdNames = filteredCommands.map(cmd => {
          const isRestricted = cmd.config.role > role;
          return isRestricted ? `${cmd.config.name} 🔒` : cmd.config.name;
        }).sort((a, b) => a.localeCompare(b));

        let msg = `✨ [ ${categoryName.toUpperCase()} Commands ] ✨\n\n` + ownerInfo;
        msg += `╭──── [ ${categoryName.toUpperCase()} ]\n`;
        msg += `│ ✧ ${cmdNames.join(" ✧ ")}\n`;
        msg += `╰───────────────◊\n`;
        msg += `🔒 = Restricted commands (You can't use them)\n`;
        msg += footerInfo(cmdNames.length);

        return message.reply({
          body: msg,
          attachment: await getAttachment()
        });
      }

      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command)
        return message.reply(`🚫 Command "${commandName}" not found.`);

      const configCommand = command.config;
      const roleText = roleTextToString(configCommand.role);
      const author = configCommand.author || "Unknown";
      const longDescription = configCommand.longDescription?.en || "No description";
      const guideBody = configCommand.guide?.en || "No guide available.";
      const usage = guideBody.replace(/{pn}/g, prefix).replace(/{n}/g, configCommand.name);

      let msg = `✨ [ Command: ${configCommand.name.toUpperCase()} ] ✨\n\n`;
      msg += ownerInfo;
      msg += `╭─── 📜 Details ───\n` +
        `│ 🔹 Name: ${configCommand.name}\n` +
        `│ 📝 Description: ${longDescription}\n` +
        `│ 🌐 Aliases: ${configCommand.aliases ? configCommand.aliases.join(", ") : "None"}\n` +
        `│ 🛠 Version: ${configCommand.version || "1.0"}\n` +
        `│ 🔒 Role: ${roleText}\n` +
        `│ ⏳ Cooldown: ${configCommand.countDown || 1}s\n` +
        `│ ✍️ Author: ${author}\n` +
        `╰───────────────◊\n` +
        `╭─── 📚 Usage ───\n` +
        `│ ${usage}\n` +
        `╰───────────────◊\n` +
        `╭─── 📌 Notes ───\n` +
        `│ Customize as needed with ♡ Ariyan bot ♡\n` +
        `╰───────────────◊\n`;
      msg += footerInfo(commands.size);

      return message.reply({
        body: msg,
        attachment: await getAttachment()
      });

    } catch (error) {
      console.error("Help command error:", error);
      await message.reply("⚠️ An error occurred. Please try again later.");
    }
  },
};

function roleTextToString(role) {
  switch (role) {
    case 0:
      return "Everyone 😊";
    case 1:
      return "Group Admins 🛡️";
    case 2:
      return "Bot Admins 🔧";
    default:
      return "Unknown ❓";
  }
}