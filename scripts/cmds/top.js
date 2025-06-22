 module.exports = {
  config: {
    name: "top",
    version: "2.0",
    author: "@Ariyan",
    role: 0,
    shortDescription: {
      en: "Top 15 richest users"
    },
    longDescription: {
      en: "Shows the top 15 users with formatted money in K/M/B/T"
    },
    category: "group",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, usersData }) {
    try {
      const allUsers = await usersData.getAll();

      if (!allUsers.length) {
        return message.reply("❌ No user data found.");
      }

      const topUsers = allUsers
        .sort((a, b) => (b.money || 0) - (a.money || 0))
        .slice(0, 15);

      const emojis = ["🥇", "🥈", "🥉"];

      const formatMoneyShort = (num) => {
        if (num >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '') + '𝐓$';
        if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + '𝐁$';
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + '𝐌$';
        if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + '𝐊$';
        return num.toString() + '$';
      };

      const topList = topUsers.map((user, index) => {
        const name = user.name || "Unknown";
        const money = formatMoneyShort(user.money || 0);
        const rank = emojis[index] || `${index + 1}.`;
        const indexNum = index + 1;

        return `${rank} ${indexNum < 10 ? ' ' : ''}${indexNum}. ${name}: ${money}`;
      });

      const finalMessage = `👑 | 𝐓𝐨𝐩 𝟏𝟓 𝐑𝐢𝐜𝐡𝐞𝐬𝐭 𝐔𝐬𝐞𝐫𝐬:\n\n${topList.join("\n")}`;

      await message.reply(finalMessage);

    } catch (err) {
      console.error(err);
      message.reply("❌ An error occurred while retrieving the top list.");
    }
  }
};