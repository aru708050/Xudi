const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 📁 Cache Directory Setup
const cacheDir = path.join(__dirname, '..', 'cache');

if (!fs.existsSync(cacheDir)) {
    try {
        fs.mkdirSync(cacheDir);
        console.log(`[CHARACTERSEARCH] 'cache' directory created at: ${cacheDir}`);
    } catch (e) {
        console.error(`[CHARACTERSEARCH ERROR] Failed to create 'cache' directory: ${e.message}`);
    }
}

module.exports = {
    config: {
        name: "charactersearch",
        version: "1.0.2",
        role: 0,
        author: "saim",
        shortDescription: "Searches for anime/manga character info from MyAnimeList.",
        countDown: 8,
        category: "anime",
        guide: {
            en: "[character name] - Example: /charactersearch Naruto Uzumaki"
        }
    },

    onStart: async ({ api, event, args }) => {
        const characterName = args.join(" ").trim();

        if (!characterName) {
            return api.sendMessage("✨ Please provide a character name to search! Example: `/charactersearch Eren Yeager`", event.threadID, event.messageID);
        }

        api.sendMessage(`🔎 Searching for "${characterName}"... please wait.`, event.threadID, event.messageID);

        try {
            const searchRes = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(characterName)}&limit=1`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; charactersearch/1.0; +https://example.com/bot)'
                }
            });

            if (searchRes.data.data.length === 0) {
                return api.sendMessage(`❌ Sorry, no character found with the name "${characterName}".`, event.threadID, event.messageID);
            }

            const character = searchRes.data.data[0];

            // ✨ Style 3: Emoji Header Style Formatting
            let characterInfoLines = [
                `🎌──────────── CHARACTER INFO ────────────🎌`,
                ``,
                `🧍‍♂️ Name: ${character.name}`
            ];

            if (character.nicknames?.length) {
                characterInfoLines.push(`🗣️ Nicknames:`);
                character.nicknames.slice(0, 3).forEach(nick => {
                    characterInfoLines.push(`   • ${nick}`);
                });
            }

            if (character.anime?.length) {
                const animeTitles = character.anime.slice(0, 3).map(a => a.anime.title).join(', ');
                characterInfoLines.push(``, `🎬 Anime: ${animeTitles}`);
            }

            if (character.manga?.length) {
                const mangaTitles = character.manga.slice(0, 3).map(m => m.manga.title).join(', ');
                characterInfoLines.push(`📚 Manga: ${mangaTitles}`);
            }

            if (character.about) {
                let aboutText = character.about.replace(/\s*\n\s*/g, ' ').trim();
                if (aboutText.length > 300) aboutText = aboutText.substring(0, 300) + '...';

                const aboutChunks = aboutText.match(/.{1,60}/g) || [aboutText];
                characterInfoLines.push(``, `📝 About:`);
                aboutChunks.forEach(line => {
                    characterInfoLines.push(`   ${line}`);
                });
            }

            characterInfoLines.push(``, `🔗 ${character.url}`);

            const characterInfo = characterInfoLines.join('\n');

            // 📸 Handle image
            let imageAttachment = null;
            let imagePath = null;

            if (character.images?.jpg?.image_url) {
                const imageUrl = character.images.jpg.image_url;
                try {
                    const imageResponse = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 10000,
                        maxRedirects: 5,
                    });

                    const safeName = character.name.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
                    const fileName = `${safeName}_${Date.now()}.jpg`;
                    imagePath = path.join(cacheDir, fileName);

                    fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
                    imageAttachment = fs.createReadStream(imagePath);

                } catch (imgErr) {
                    console.error("[IMAGE ERROR] Could not download character image:", imgErr.message);
                }
            }

            if (imageAttachment) {
                api.sendMessage({
                    body: characterInfo,
                    attachment: imageAttachment
                }, event.threadID, (err) => {
                    if (err) console.error("[SEND ERROR] Failed to send:", err);
                    if (imagePath && fs.existsSync(imagePath)) {
                        fs.unlink(imagePath, (unlinkErr) => {
                            if (unlinkErr) console.error("⚠️ Failed to delete image:", unlinkErr);
                        });
      
