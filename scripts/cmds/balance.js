module.exports = {
	config: {
		name: "balance",
		aliases: ["bal"],
		version: "1.2",
		author: "NTKhang + Modified by Ariyan",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "view your money"
		},
		longDescription: {
			en: "view your money or the money of the tagged person"
		},
		category: "economy",
		guide: {
			en: "{pn}: view your balance\n{pn} @tag: view someone else's balance"
		}
	},

	onStart: async function ({ message, usersData, event }) {
		function formatCurrency(amount) {
			if (amount >= 1e12) return (amount / 1e12).toFixed(2).replace(/\.00$/, "") + "T$";
			if (amount >= 1e9) return (amount / 1e9).toFixed(2).replace(/\.00$/, "") + "B$";
			if (amount >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.00$/, "") + "M$";
			if (amount >= 1e3) return (amount / 1e3).toFixed(2).replace(/\.00$/, "") + "K$";
			return amount + "$";
		}

		if (Object.keys(event.mentions).length > 0) {
			const uids = Object.keys(event.mentions);
			let msg = "";
			for (const uid of uids) {
				const money = await usersData.get(uid, "money");
				const name = event.mentions[uid].replace("@", "");
				msg += `Baby, ${name}'s balance is ${formatCurrency(money)}\n`;
			}
			return message.reply(msg.trim());
		}

		const userData = await usersData.get(event.senderID);
		const formattedMoney = formatCurrency(userData.money);
		return message.reply(`Baby, Your balance is ${formattedMoney}`);
	}
};