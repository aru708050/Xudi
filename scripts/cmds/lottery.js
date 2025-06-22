const fs = require("fs-extra");
const path = require("path");

const DATA_PATH = path.join(__dirname, "lottery_data.json");
const STATUS_PATH = path.join(__dirname, "lottery_status.json");

const MAX_TICKETS = 20;
const MAX_PER_USER = 3;
const TICKET_PRICE = 1_000_000;

module.exports = {
  config: {
    name: "lottery",
    version: "2.3.1",
    author: "Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "Lottery game system",
    longDescription: "Buy tickets, check info, and draw winner.",
    category: "game",
    guide: {
      en: "{pn} buy 1-3 | draw | info | status"
    }
  },

  onStart: async function ({ message, event, usersData, args }) {
    await fs.ensureFile(DATA_PATH);
    await fs.ensureFile(STATUS_PATH);

    let data = await fs.readJson(DATA_PATH).catch(() => ({ tickets: [] }));
    let status = await fs.readJson(STATUS_PATH).catch(() => ({}));

    const userId = event.senderID;
    const userData = await usersData.get(userId);
    const userName = userData?.name || "Unknown";
    const subcmd = args[0];

    // BUY
    if (subcmd === "buy") {
      const count = parseInt(args[1]);
      if (isNaN(count) || count < 1 || count > MAX_PER_USER) {
        return message.reply(`❌ | You can only buy between 1 and ${MAX_PER_USER} tickets.`);
      }

      const userTickets = data.tickets.filter(t => t.userId === userId);
      if (userTickets.length + count > MAX_PER_USER) {
        return message.reply(`⚠️ | You already have ${userTickets.length} ticket(s). Max allowed is ${MAX_PER_USER}.`);
      }

      if (data.tickets.length + count > MAX_TICKETS) {
        return message.reply(`🎫 | Only ${MAX_TICKETS - data.tickets.length} ticket(s) left.`);
      }

      const userBalance = userData?.money || 0;
      const cost = count * TICKET_PRICE;
      if (userBalance < cost) {
        return message.reply(
          `💸 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 $${(cost / 1_000_000)}𝐌 𝐭𝐨 𝐛𝐮𝐲 ${count} ticket(s).\n💼 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞: $${(userBalance / 1_000_000)}𝐌`
        );
      }

      await usersData.set(userId, {
        ...userData,
        money: userBalance - cost
      });

      const newTickets = [];
      for (let i = 0; i < count; i++) {
        const ticketNumber = data.tickets.length + 1;
        data.tickets.push({ userId, ticketNumber });
        newTickets.push(ticketNumber);
      }

      await fs.writeJson(DATA_PATH, data);

      return message.reply(
        `✅ 𝐘𝐨𝐮 𝐩𝐮𝐫𝐜𝐡𝐚𝐬𝐞𝐝 ${count} ticket(s).\n🎟 𝐓𝐢𝐜𝐤𝐞𝐭 𝐧𝐮𝐦𝐛𝐞𝐫𝐬: ${newTickets.join(", ")}\n💰 𝐓𝐨𝐭𝐚𝐥 𝐜𝐨𝐬𝐭: $${(cost / 1_000_000)}𝐌`
      );
    }

    // DRAW
    else if (subcmd === "draw") {
      if (data.tickets.length < MAX_TICKETS) {
        return message.reply(`⏳ | Only ${data.tickets.length}/${MAX_TICKETS} tickets sold. Cannot draw yet.`);
      }

      const winnerTicket = data.tickets[Math.floor(Math.random() * data.tickets.length)];
      const winnerData = await usersData.get(winnerTicket.userId);
      const prize = TICKET_PRICE * MAX_TICKETS;
      const winnerBalance = winnerData?.money || 0;

      await usersData.set(winnerTicket.userId, {
        ...winnerData,
        money: winnerBalance + prize
      });

      await fs.writeJson(STATUS_PATH, {
        name: winnerData.name,
        ticketNumber: winnerTicket.ticketNumber,
        userId: winnerTicket.userId,
        prize
      });

      await fs.writeJson(DATA_PATH, { tickets: [] });

      return message.reply(
        `╭──────────────⭓\n` +
        `├ 🏅 𝐖𝐢𝐧𝐧𝐞𝐫 𝐚𝐧𝐧𝐨𝐮𝐧𝐜𝐞𝐝\n` +
        `├ 🎀 𝐖𝐢𝐧𝐧𝐞𝐫: ${winnerData.name}\n` +
        `├ 🎟 𝐓𝐢𝐜𝐤𝐞𝐭 𝐧𝐮𝐦𝐛𝐞𝐫: #${winnerTicket.ticketNumber}\n` +
        `├ 💰 𝐏𝐫𝐢𝐳𝐞: $${prize / 1_000_000}𝐌\n` +
        `╰──────────────⭓\n\n• Prize money has been deposited automatically.`
      );
    }

    // INFO
    else if (subcmd === "info") {
      if (data.tickets.length === 0) {
        return message.reply("📭 | No tickets have been bought yet.");
      }

      const usersMap = {};
      for (const ticket of data.tickets) {
        if (!usersMap[ticket.userId]) usersMap[ticket.userId] = [];
        usersMap[ticket.userId].push(ticket.ticketNumber);
      }

      let infoText = `🎰 𝐋𝐨𝐭𝐭𝐞𝐫𝐲 𝐒𝐭𝐚𝐭𝐮𝐬:\n\n🎟 𝐓𝐢𝐜𝐤𝐞𝐭𝐬 𝐬𝐨𝐥𝐝: ${data.tickets.length}/${MAX_TICKETS}\n💰 𝐏𝐫𝐢𝐳𝐞 𝐩𝐨𝐨𝐥: $${(data.tickets.length * TICKET_PRICE / 1_000_000)}𝐌\n\n`;

      for (const [uid, ticketNums] of Object.entries(usersMap)) {
        const uData = await usersData.get(uid);
        const name = uData?.name || uid;
        infoText += `╭─ buy ${name}:\n╰──‣ ${ticketNums.length} Ticket${ticketNums.length > 1 ? "s" : ""}\n`;
      }

      return message.reply(infoText.trim());
    }

    // STATUS
    else if (subcmd === "status") {
      if (!status.name) {
        return message.reply("ℹ️ | No previous winner yet.");
      }

      return message.reply(
        `🏆 𝐋𝐚𝐬𝐭 𝐖𝐢𝐧𝐧𝐞𝐫:\n👤 ${status.name}\n🎫 Ticket: #${status.ticketNumber}\n💰 Prize: $${status.prize / 1_000_000}𝐌`
      );
    }

    // HELP
    else {
      return message.reply(
        `🎲 | Lottery Command Usage:\n` +
        `• Buy: lottery buy [1-3]\n` +
        `• Info: lottery info\n` +
        `• Draw: lottery draw\n` +
        `• Status: lottery status`
      );
    }
  }
};