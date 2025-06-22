const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "xyz",
    aliases: ["x"],
    version: "1.0.0",
    author: "ArYAN",
    countDown: 5,
    role: 0,
    category: "media",
    longDescription: {
      en: "Convert media to direct download link."
    },
    guide: "Reply to an image/video/audio/gif with {pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      const reply = event.messageReply;
      if (!reply || !reply.attachments || reply.attachments.length === 0) {
        return api.sendMessage("❌ Please reply to a media file (image, video, audio, gif).", event.threadID, event.messageID);
      }

      const attachment = reply.attachments[0];
      const url = attachment.url;

      const ext = attachment.type === "audio" ? ".mp3"
                : attachment.type === "video" ? ".mp4"
                : attachment.type === "photo" ? ".jpg"
                : ".bin";

      const filePath = path.join(__dirname, `cyber_temp_${Date.now()}${ext}`);
      const writer = fs.createWriteStream(filePath);

      const fileRes = await axios.get(url, { responseType: "stream" });
      fileRes.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const form = new FormData();
      form.append("file", fs.createReadStream(filePath));

<<<<<<< HEAD
      const res = await axios.post("https://noobs-xyz.onrender.com/v1/upload", form, {
=======
      const res = await axios.post("https://aryan-xy.onrender.com/v1/upload", form, {
>>>>>>> 5f826bfa37596c145c0dee848e9aff6fc51060d8
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      fs.unlinkSync(filePath);

      if (res.data?.link) {
        return api.sendMessage(`✅ Uploaded:\n${res.data.link}`, event.threadID, event.messageID);
      } else {
        return api.sendMessage("❌ Upload failed: No link returned from server.", event.threadID, event.messageID);
      }

    } catch (error) {
      return api.sendMessage("❌ Failed to convert media into a link. Server may be down or the file is too large.", event.threadID, event.messageID);
    }
  }
<<<<<<< HEAD
};
=======
};
>>>>>>> 5f826bfa37596c145c0dee848e9aff6fc51060d8
