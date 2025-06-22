 module.exports = {
  config: {
    name: "sall",
    aliases: ["send sall", "sallmoney"],
    version: "1.0.0",
    author: "Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "Send money to many users",
    longDescription: "Transfer a selected amount to all mentioned users",
    category: "economy",
    guide: "{pn} <amount> @user1 @user2 ..."
  },

  onStart: async function ({ event, message, args, usersData }) {
    const senderID = event.senderID;
    const mentions = Object.keys(event.mentions);

    // Validate
    if (!args[0] || isNaN(args[0])) {
      return message.reply("⚠️ Please provide a valid amount to send.\nExample: send sall 50 @user1 @user2");
    }

    if (mentions.length === 0) {
      return message.reply("⚠️ Please mention at least one user to send money.");
    }

    const amount = parseInt(args[0]);
    if (amount <= 0) return message.reply("⚠️ Amount must be greater than 0.");

    const totalAmount = amount * mentions.length;

    const senderData = await usersData.get(senderID);
    const senderBalance = senderData.money || 0;

    if (senderBalance < totalAmount) {
      return message.reply(`❌ You need ₹${totalAmount} to send ₹${amount} to ${mentions.length} users.`);
    }

    // Transfer to each mentioned user
    let transferred = 0;
    for (const uid of mentions) {
      if (uid === senderID) continue;
      const userData = await usersData.get(uid);
      await usersData.set(uid, {
        money: (userData.money || 0) + amount
      });
      transferred++;
    }

    // Deduct from sender
    await usersData.set(senderID, {
      money: senderBalance - (transferred * amount)
    });

    message.reply(`✅ Successfully sent ₹${amount} to ${transferred} user(s). Total: ₹${amount * transferred}`);
  }
};