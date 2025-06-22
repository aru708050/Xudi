const axios = require("axios");
const fs = require("fs-extra");

const allStyles = [
  "default", "none", "3d-model", "abstract", "advertising", "alien", "analog-film", "anime",
  "architectural", "artnouveau", "baroque", "black-white-film-portrait", "cinematic", "collage",
  "comic-book", "craft-clay", "cubist", "dark-portrait-realism", "dark-realism", "digital-art",
  "disco", "dreamscape", "dystopian", "enhance", "fairy-tale", "fantasy-art", "fighting-game",
  "filmnoir", "flat-papercut", "food-photography", "gothic", "graffiti", "grunge", "gta", "hdr",
  "horror", "hyperrealism", "impressionist", "industrialfashion", "isometric-style",
  "light-portrait-realism", "light-realism", "line-art", "long-exposure", "minecraft",
  "minimalist", "monochrome", "nautical", "neon-noir", "neon-punk", "origami", "paper-mache",
  "papercut-collage", "papercut-shadow-box", "photographic", "pixel-art", "pointillism", "pokémon",
  "pop-art", "psychedelic", "real-estate", "renaissance", "retro-arcade", "retro-game",
  "romanticism", "rpg-fantasy-game", "silhouette", "space", "stacked-papercut", "stained-glass",
  "steampunk", "strategy-game", "street-fighter", "super-mario", "surrealist", "techwear-fashion",
  "texture", "thick-layered-papercut", "tilt-shift", "tribal", "typography", "vintagetravel",
  "watercolor"
];

module.exports = {
  config: {
    name: "gen",
    version: "1.2",
    author: "@RI F AT",
    role: 0,
    shortDescription: "Generate AI image from prompt",
    longDescription: "Generate AI image with style using FastURL AI",
    category: "media",
    guide: "{pn} <prompt> --s <style>\n{pn} styles — to view all supported styles"
  },

  onStart: async function ({ api, event, args }) {
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === "styles" || subCommand === "models") {
      const styleList = allStyles.map((s, i) => `${i + 1}. ${s}`).join("\n");
      return api.sendMessage(`🎨 Available styles:\n\n${styleList}`, event.threadID);
    }

    if (args.length === 0) return api.sendMessage("❌ | You must enter a prompt.", event.threadID);

    const fullInput = args.join(" ");
    const styleMatch = fullInput.match(/--s\s+([^\n]+)/);
    const style = styleMatch ? styleMatch[1].trim() : "default";

    const prompt = fullInput.replace(/--s\s+[^\n]+/, "").trim();
    const negativePrompt = "low quality";
    const seed = Math.floor(Math.random() * 999999);

    const url = `https://fastrestapis.fasturl.cloud/aiimage/stablediff/advanced?prompt=${encodeURIComponent(prompt)}&style=${encodeURIComponent(style)}&seed=${seed}&negative_prompt=${encodeURIComponent(negativePrompt)}&size=square`;

    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });

      const contentType = response.headers["content-type"];
      if (!contentType?.startsWith("image/")) {
        const errorText = Buffer.from(response.data).toString();
        return api.sendMessage(`❌ | API didn't return an image:\n${errorText}`, event.threadID);
      }

      const path = __dirname + `/gen-${event.senderID}.png`;
      fs.writeFileSync(path, Buffer.from(response.data, "binary"));

      api.sendMessage({
        body: `✅ | Style: ${style}, Seed: ${seed}`,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path));
    } catch (e) {
      console.error("Image generation error:", e);
      api.sendMessage(`❌ | Failed to generate image.\n${e.message}`, event.threadID);
    }
  }
};
