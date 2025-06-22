const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    version: "2.0",
    author: "Nyx",
    countDown: 5,
    role: 0,
    description: { en: "Music search and download" },
    category: "MEDIA",
    guide: { en: "{pn} [options] <query>" }
  },

  onStart: async function({ args, message, event, api }) {
  const { messageReply } = event;
  let query = args.join(" ");

  try {
    const attachment = messageReply?.attachments?.[0];

    if (args[0] === '-f' && attachment && (attachment.type === "audio" || attachment.type === "video")) {
      await this.handleFinder(api, message, event);
    } else if (!args[0]?.startsWith('-') && attachment && (attachment.type === "audio" || attachment.type === "video")) {
      await this.handleAttachment(api, message, attachment);
      return;
    } else {
      if (args[0]?.startsWith('-')) {
        const flag = args[0];
        query = args.slice(1).join(" ");
        switch (flag) {
          case '-r': await this.searchRandom(api, message, query); break;
          case '-m': await this.searchList(api, message, query, event); break;
          default: await this.searchRandom(api, message, query);
        }
      } else {
        await this.searchRandom(api, message, query);
      }
    }
  } catch (err) {
    await message.reply(`❌ ${err.message}`);
  }
},

  onReply: async function({ event, api, Reply, message }) {
  const { searchResults, messageID, author } = Reply;
  if (event.senderID !== author) return;

  try {
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > searchResults.length) return;

    await api.unsendMessage(messageID);

    const selected = searchResults[choice - 1];
     await this.downloadTrack(api, message, selected.url);
  } catch (err) {
    await message.reply(`❌ ${err.message}`);
  }
},
  handleAttachment: async function(api, message, attachment) {
    const loading = await this.showLoading(api, message, "🔎 Finding...");
    try {
      const { data } = await axios.get(
        `${global.GoatBot.config.nyx}api/sond-finder?videourl=${encodeURIComponent(attachment.url)}`
      );
      const results = await yts(data.track.title);
      if (results.videos.length < 2) {
   message.reply("No results");
}
      await this.downloadTrack(api, message, results.videos[2].url);
    } finally {
      await loading.cleanup();
    }
  },

  searchRandom: async function(api, message, query) {
    if (!query) {
     message.reply("messing query")
   }
    const loading = await this.showLoading(api, message, "🔎 Finding...");
    try {
      const results = await yts(query);
      if (!results.videos.length) throw new Error("No results");
      const random = results.videos[Math.floor(Math.random() * results.videos.length)];
      await this.downloadTrack(api, message, random.url);
    } finally {
      await loading.cleanup();
    }
  },

  searchList: async function(api, message, query, event) {
    if (!query) throw new Error("Missing query");
    const loading = await this.showLoading(api, message, "🔎 Finding...");
    try {
      const results = await yts(query);
      const sliced = results.videos.slice(0, 6);
      const list = sliced.map((v, i) => `${i + 1}. ${v.title}`).join("\n");

      const msg = await message.reply({
        body: `🎵 Choose:\n\n${list}`,
        attachment: await Promise.all(sliced.map(v => this.getStream(v.thumbnail)))
      });

      global.GoatBot.onReply.set(msg.messageID, {
        commandName: "sing",
        messageID: msg.messageID,
        author: event.senderID,
        searchResults: sliced
      });
    } finally {
      await loading.cleanup();
    }
  },

  handleFinder: async function(api, message, event) {
    if (!event.messageReply) {
       message.reply("Reply to an attachment")
      }
    const loading = await this.showLoading(api, message, "🔎 Finding...");
    try {
      const { url } = event.messageReply.attachments[0];
      const { data } = await axios.get(
        `${global.GoatBot.config.nyx}api/sond-finder?videourl=${encodeURIComponent(url)}`
      );

      const audioURI = data.track.hub.actions.find(a => a.type === "uri")?.uri;
      if (!audioURI) {
       message.reply("no random audio found")
      }
      await message.reply({
        attachment: await this.getStream(audioURI),
        body: `🎵 ${data.track.title}`
      });
    } finally {
      await loading.cleanup();
    }
  },

  downloadTrack: async function(api, message, url) {
    const loading = await this.showLoading(api, message, "⏬ Downloading...");
    try {
      const { data } = await axios.get(
        `${global.GoatBot.config.nyx}api/ytv?d=${encodeURIComponent(url)}&type=mp3`
      );

      const tempPath = path.join(__dirname, 'cache', 'nyx.mp3');
      const audio = await axios.get(data.url, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, Buffer.from(audio.data));

      await message.reply({
        attachment: fs.createReadStream(tempPath)
      });
      fs.unlinkSync(tempPath);
    } finally {
      await loading.cleanup();
      await api.setMessageReaction("✅", message.messageID, () => {}, true);
    }
  },

  showLoading: async function(api, message, text = "Processing...") {
    const msg = await message.reply(text);
    const timeout = setTimeout(() => {
      api.unsendMessage(msg.messageID);
    }, 7000);
    return {
      messageID: msg.messageID,
      cleanup: async () => {
        clearTimeout(timeout);
        await api.unsendMessage(msg.messageID);
      }
    };
  },

  getStream: async function(url) {
    const res = await axios.get(url, { responseType: 'stream' });
    return res.data;
  }
};