const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const FormData = require('form-data');

const ok = 'xyz';
const alldlAPI = `https://smfahim.${ok}/alldl`;

const cacheFolder = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheFolder)) {
  fs.mkdirSync(cacheFolder, { recursive: true });
}

async function downloadViaAllDL(url) {
  const res = await axios.get(`${alldlAPI}?url=${encodeURIComponent(url)}`);
  const downloadURL = res.data?.links?.sd || res.data?.links?.hd;
  if (!downloadURL) throw new Error("Couldn't fetch downloadable video link");
  return downloadURL;
}

async function silentVideoToAudio(videoUrl) {
  const tempFile = path.join(cacheFolder, `temp_${Date.now()}.mp3`);
  await new Promise((resolve, reject) => {
    exec(`${ffmpeg} -i "${videoUrl}" -vn -acodec libmp3lame -y "${tempFile}"`,
      (error) => error ? reject(error) : resolve()
    );
  });
  return tempFile;
}

async function shazamDetection(audioPath) {
  try {
    const form = new FormData();
    form.append('data', fs.createReadStream(audioPath), {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    });

    const addr = (await axios.get('https://raw.githubusercontent.com/Tanvir0999/stuffs/main/raw/addresses.json')).data.main;
    const response = await axios.post(`${addr}/shazam`, form, {
      headers: form.getHeaders()
    });

    return response.data;
  } finally {
    fs.unlink(audioPath, () => {});
  }
}

async function searchAndDownloadSong(query) {
  const isURL = /^https?:\/\//.test(query);
  const searchResponse = await axios.get('http://193.149.164.141:8610/api/ytsearch', {
    params: isURL ? { url: query } : { query }
  });

  if (!searchResponse.data.items?.length) throw new Error('No results found');
  const video = searchResponse.data.items[0];
  const cookies = fs.existsSync('cookie.txt') ? fs.readFileSync('cookie.txt', 'utf-8') : '';
  const addr = (await axios.get('https://raw.githubusercontent.com/Tanvir0999/stuffs/main/raw/addresses.json')).data.yt;

  const res = await axios.post(addr, {
    url: video.url,
    filesize: 26,
    format: 'audio',
    cookies
  });

  return {
    audioUrl: res.data.url,
    videoInfo: video
  };
}

module.exports = {
  config: {
    name: "song",
    aliases: ["music", "sing"],
    version: "5.1",
    author: "Mahi--",
    description: "Identify songs from audio/video, video links or search",
    category: "Utility",
    guide: {
      en: "Reply to audio/video or link:\n{pn} -i (info only)\n{pn} (info + audio)\n\nSearch:\n{pn} <query>\n{pn} <YT/video link>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      message.reaction("🔍", event.messageID);
      const isReply = event.messageReply;
      const infoOnly = args.includes("-i");
      const input = args.join(" ");

      // Check if reply is a link
      if (isReply) {
        const replyText = isReply.body || "";
        const attachment = isReply.attachments?.[0];

        if (attachment && ["audio", "video"].includes(attachment.type)) {
          const audioPath = attachment.type === "video"
            ? await silentVideoToAudio(attachment.url)
            : attachment.url;

          const shazamData = await shazamDetection(audioPath);
          const song = shazamData.song?.[0] || {};
          const artist = shazamData.artist?.[0] || {};

          const songInfo = [
            `🎵 ${song.name || "Unknown Song"}`,
            `🎤 Artist: ${artist.name || "Unknown"}`,
            `📀 Album: ${shazamData.album || "Unknown"}`,
            `📅 Released: ${shazamData.released || "Unknown"}`
          ].join("\n");

          if (infoOnly) return message.reply(songInfo);

          const searchQuery = `${song.name} ${artist.name}`.trim();
          const { audioUrl, videoInfo } = await searchAndDownloadSong(searchQuery || "popular music");

          return message.reply({
            body: `${songInfo}\n\n🔊 Now playing: ${videoInfo.title}`,
            attachment: await global.utils.getStreamFromURL(audioUrl)
          });
        }

        // Reply is a text with a link
        if (replyText.startsWith("http")) {
          const downloadedURL = await downloadViaAllDL(replyText);
          const audioPath = await silentVideoToAudio(downloadedURL);
          const shazamData = await shazamDetection(audioPath);
          const song = shazamData.song?.[0] || {};
          const artist = shazamData.artist?.[0] || {};

          const songInfo = [
            `🎵 ${song.name || "Unknown Song"}`,
            `🎤 Artist: ${artist.name || "Unknown"}`,
            `📀 Album: ${shazamData.album || "Unknown"}`,
            `📅 Released: ${shazamData.released || "Unknown"}`
          ].join("\n");

          if (infoOnly) return message.reply(songInfo);

          const searchQuery = `${song.name} ${artist.name}`.trim();
          const { audioUrl, videoInfo } = await searchAndDownloadSong(searchQuery || "popular music");

          return message.reply({
            body: `${songInfo}\n\n🔊 Now playing: ${videoInfo.title}`,
            attachment: await global.utils.getStreamFromURL(audioUrl)
          });
        }

        return message.reply("❌ Please reply to audio, video, or a valid link.");
      }

      // Normal input link
      if (input.startsWith("http")) {
        const downloadedURL = await downloadViaAllDL(input);
        const audioPath = await silentVideoToAudio(downloadedURL);
        const shazamData = await shazamDetection(audioPath);
        const song = shazamData.song?.[0] || {};
        const artist = shazamData.artist?.[0] || {};

        const songInfo = [
          `🎵 ${song.name || "Unknown Song"}`,
          `🎤 Artist: ${artist.name || "Unknown"}`,
          `📀 Album: ${shazamData.album || "Unknown"}`,
          `📅 Released: ${shazamData.released || "Unknown"}`
        ].join("\n");

        if (infoOnly) return message.reply(songInfo);

        const searchQuery = `${song.name} ${artist.name}`.trim();
        const { audioUrl, videoInfo } = await searchAndDownloadSong(searchQuery || "popular music");

        return message.reply({
          body: `${songInfo}\n\n🔊 Now playing: ${videoInfo.title}`,
          attachment: await global.utils.getStreamFromURL(audioUrl)
        });
      }

      // Text query
      if (!args.length) return message.reply("❌ Provide a query or link.");
      const { audioUrl, videoInfo } = await searchAndDownloadSong(input);
      return message.reply({
        body: `🎬 ${videoInfo.title}\n⏱ Duration: ${videoInfo.duration}\n🔗 ${videoInfo.url}`,
        attachment: await global.utils.getStreamFromURL(audioUrl)
      });

    } catch (err) {
      console.error("Song Error:", err);
      return message.reply(`❌ ${err.message}`);
    }
  }
};