module.exports = {
  config: {
    name: "aigen",
    version: "2.0",
    author: "@RI F AT",
    countDown: 10,
    role: 0,
    shortDescription: "Generate AI image",
    longDescription: "Generate AI image using numbered or named models with optional reference image and creativity level.",
    category: "image",
    guide: "{pn} <prompt> [--model_name | --model_number] [--ref <url>] [--c <0-1>]\nExample:\n{pn} anime hero --12 --ref https://img.com/ref.jpg --c 0.7"
  },

  onStart: async function ({ api, event, args }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const modelList = [
      "AnimageModel", "RealisticModel", "Cute blind box", "Fantasy mecha", "Story book illustration",
      "Children picture book illustration", "Q version simple drawing", "Ink landscape", "Ink painting", "Sketch style",
      "Enhanced realism", "Oil painting", "3D character", "3D Pixar", "Chinese scenery", "Beautiful scenery",
      "Minimalist LOGO", "Advanced LOGO", "E-commerce products", "Modern Nordic", "General interior design",
      "Light luxury style interior", "Modern architecture", "Chinese style flat illustration", "Chinese style blind box",
      "Year of the Dragon Fantasy", "Year of the Dragon Avatar", "Eastern Dragon", "Western Dragon", "Q version 3D three views",
      "Sand sculpture hand-painted", "Clay style", "Paper-cut landscape", "Comic Lines", "Graffiti Lines",
      "Felt Doll", "Q Version 3D", "PhotographyModel", "White Moonlight", "Thick Illustration Boy", "Healing Boy",
      "Avatar Sketch", "Ruffian Handsome Man", "Ancient Costume Male God", "Cartoon Hand-painted", "Big Fight",
      "Expression Master", "Fox Mask", "Nine-tailed Fox", "Neon Lights", "Hong Kong Film", "Classical Dunhuang",
      "Healing Girl", "Cold Style", "Retro Anime", "FURINA", "NAHIDA", "SHOGUN", "KLEE", "AYAKA", "SHENHE", "KOKOMI",
      "GANYU", "MIKO", "HUTAO", "YOIMIYA", "KEQING", "BARBARA", "NILOU", "EULA", "NINGGUANG", "YELAN", "PAIMON", "lumine",
      "Indulge in freedom", "Emotional illustration", "Forgiveness", "Sea of roses", "Jumping colors",
      "Fashionable machinery", "Korean Wave Photo", "Watercolor Illustration", "Holographic Technology",
      "Healing Animation", "Journey to the West", "Colored Mud Fantasy", "Little Fresh", "Colorful Girl", "Graffiti Style",
      "Sloppy Painting Style", "Commercial Illustration", "Jade Texture", "Pixel World", "Children picture book",
      "Light lines", "Two-person illustration", "AnimeModelV5", "TechModelV7", "Chinese suspense", "Japanese suspense",
      "Style suspense", "Mechanical beetle", "Nature", "Oriental beauty"
    ];

    const input = args.join(" ").trim();

    // Model list command
    if (input.toLowerCase() === "models") {
      const msg = modelList.map((name, i) => `${i + 1}. ${name}`).join("\n");
      return api.sendMessage(`📌 Total ${modelList.length} Models:\n\n${msg}`, event.threadID, event.messageID);
    }

    // Match model by number (e.g., --14)
    const numberMatch = input.match(/--(\d+)/);
    const modelIndex = numberMatch ? parseInt(numberMatch[1], 10) - 1 : -1;

    // Match model by name (e.g., --animev5)
    const nameMatch = input.match(/--([a-z0-9]+)/i);
    const modelName = nameMatch ? nameMatch[1].toLowerCase() : null;

    let style = "AnimageModel";
    if (modelIndex >= 0 && modelIndex < modelList.length) {
      style = modelList[modelIndex];
    } else if (modelName) {
      const lowerList = modelList.map(m => m.toLowerCase().replace(/[^a-z0-9]/g, ""));
      const matchIndex = lowerList.indexOf(modelName);
      if (matchIndex !== -1) style = modelList[matchIndex];
    }

    // Match ref image
    const refMatch = input.match(/--ref\s+(https?:\/\/[^\s]+)/);
    const refImage = refMatch ? refMatch[1] : null;

    // Match creativity with --c
    const creativityMatch = input.match(/--c\s+([0-1](\.\d+)?)/);
    const creativity = creativityMatch ? parseFloat(creativityMatch[1]) : 0.5;

    // Remove args from prompt
    const prompt = input
      .replace(/--\d+/g, "")
      .replace(/--[a-z0-9]+\s+[^\s]+/gi, "")
      .replace(/--[a-z0-9]+/gi, "")
      .trim();

    if (!prompt) {
      return api.sendMessage("❌ Please provide a prompt.\nExample:\n/aigen anime cat girl --1 --c 0.6", event.threadID, event.messageID);
    }

    const filePath = path.join(__dirname, "cache", `${event.senderID}_aigen.png`);
    const url = `https://fastrestapis.fasturl.cloud/imgedit/aiimage`;

    try {
      const res = await axios.get(url, {
        params: {
          prompt,
          style,
          width: 1024,
          height: 1024,
          creativity,
          ...(refImage ? { refImage } : {})
        },
        responseType: "arraybuffer"
      });

      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

      api.sendMessage({
        body: `✅ AI image generated!\n\nModel: ${style}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Failed to generate image. Try again later.", event.threadID, event.messageID);
    }
  }
};
