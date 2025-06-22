 const fs = require("fs-extra");

module.exports = {
  config: {
    name: "sendmoney",
    aliases: ["send", "send -m"],
    version: "1.1.0",
    author: "Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "Send money to another user",
    longDescription: "Send balance to another user by replying, mentioning or using UID",
    category: "economy",
    guide: "{pn} <amount> [@mention or UID or reply]"
  },

  onStart: async function ({ event, message, args, usersData }) {
    const senderID = event.senderID;

    // Validate amount
    if (!args[0] || isNaN(args[0])) {
      return message.reply("⚠️ Please enter a valid amount.\nUsage: sendmoney 100 @user");
    }

    const amount = parseInt(args[0]);
    if (amount <= 0) return message.reply("⚠️ Amount must be greater than 0.");

    // Determine recipient
    let recipientID = null;
    if (event.messageReply) {
      recipientID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      recipientID = Object.keys(event.mentions)[0];
    } else if (args[1] && /^\d+$/.test(args[1])) {
      recipientID = args[1];
    }

    if (!recipientID) {
      return message.reply("⚠️ Please reply to, mention, or provide a valid UID of the user to send money.");
    }

    if (recipientID === senderID) {
      return message.reply("❌ You can't send money to yourself.");
    }

    const senderData = await usersData.get(senderID);
    const recipientData = await usersData.get(recipientID);
    const senderBalance = senderData.money || 0;

    if (senderBalance < amount) {
      return message.reply(`❌ You don't have enough balance. Your balance: ₹${senderBalance}`);
    }

    // Perform transfer
    await usersData.set(senderID, {
      money: senderBalance - amount
    });

    await usersData.set(recipientID, {
      money: (recipientData.money || 0) + amount
    });

    const recipientName = recipientData.name || "User";

    return message.reply(`✅ ₹${amount} successfully sent to @${recipientName}`, [], {
      mentions: [{
        tag: `@${recipientName}`,
        id: recipientID
      }]
    });
  }
};