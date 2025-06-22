const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "pair2",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Get to know your partner" },
    longDescription: {
      en: "Know your destiny and know who you will complete your life with",
    },
    category: "love",
    guide: { en: "{pn}" }
  },

  onStart: async function ({
    api, event, usersData
  }) {
    const botID = api.getCurrentUserID();
    const pathImg = __dirname + "/cache/pair_background.png";
    const pathAvt1 = __dirname + "/cache/pair_avt1.png";
    const pathAvt2 = __dirname + "/cache/pair_avt2.png";

    // Step 1: Get sender info
    const id1 = event.senderID;
    const name1 = await usersData.getName(id1);
    const threadInfo = await api.getThreadInfo(event.threadID);
    const allUsers = threadInfo.userInfo;

    // Step 2: Determine sender gender and find opposite candidates
    let gender1 = allUsers.find(u => u.id == id1)?.gender || null;
    let candidates = [];

    for (let user of allUsers) {
      if (user.id !== id1 && user.id !== botID) {
        if (gender1 === "FEMALE" && user.gender === "MALE") candidates.push(user.id);
        else if (gender1 === "MALE" && user.gender === "FEMALE") candidates.push(user.id);
        else if (gender1 === null) candidates.push(user.id);
      }
    }

    if (candidates.length === 0) {
      return api.sendMessage("❌ No suitable match found!", event.threadID, event.messageID);
    }

    // Step 3: Random match and percentages
    const id2 = candidates[Math.floor(Math.random() * candidates.length)];
    const name2 = await usersData.getName(id2);

    const randomPercent = Math.floor(Math.random() * 100) + 1;
    const fakeOdds = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    const allChances = Array(9).fill(randomPercent).concat(fakeOdds);
    const matchPercent = allChances[Math.floor(Math.random() * allChances.length)];

    // Step 4: Image Handling
    const bgURL = "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg";

    const avatar1 = (
      await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, {
        responseType: "arraybuffer"
      })
    ).data;
    fs.writeFileSync(pathAvt1, Buffer.from(avatar1));

    const avatar2 = (
      await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, {
        responseType: "arraybuffer"
      })
    ).data;
    fs.writeFileSync(pathAvt2, Buffer.from(avatar2));

    const bgImage = (
      await axios.get(bgURL, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(pathImg, Buffer.from(bgImage));

    // Step 5: Compose final image
    const baseImage = await loadImage(pathImg);
    const imgAvt1 = await loadImage(pathAvt1);
    const imgAvt2 = await loadImage(pathAvt2);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgAvt1, 111, 175, 330, 330);
    ctx.drawImage(imgAvt2, 1018, 173, 330, 330);

    const finalImage = canvas.toBuffer();
    fs.writeFileSync(pathImg, finalImage);

    // Step 6: Send message
    return api.sendMessage({
      body: `『💗』Congratulations ${name1}『💗』\n` +
            `『❤️』Looks like your destiny brought you together with ${name2}『❤️』\n` +
            `『🔗』Your link percentage is ${matchPercent}%『🔗』`,
      mentions: [
        { tag: name1, id: id1 },
        { tag: name2, id: id2 }
      ],
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, () => {
      fs.unlinkSync(pathImg);
      fs.unlinkSync(pathAvt1);
      fs.unlinkSync(pathAvt2);
    }, event.messageID);
  }
};