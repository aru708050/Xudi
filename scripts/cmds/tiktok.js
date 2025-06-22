const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { createReadStream, unlinkSync } = fs;

// Configuration for maximum concurrent downloads
const MAX_CONCURRENT_DOWNLOADS = 3;
let activeDownloads = 0;

module.exports = {
    config: {
        name: "tiktok",
        version: "2.1",
        role: 0,
        author: "Sorwar Hosen Sohan",
        description: "Search and download TikTok videos with multiple API sources",
        category: "media",
        aliases: ["tik", "tt"],
        usage: "tiktok <search term>",
        cooldown: 15,
    },

    onStart: async function ({ api, event, args, message }) {
        // Check if search term is provided
        const searchQuery = args.join(" ");
        if (!searchQuery) {
            return message.reply("🔍 Please enter a search term (e.g., tiktok dance)");
        }

        // Check download limit
        if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS) {
            return message.reply("🚫 Too many downloads in progress. Please wait a moment.");
        }

        activeDownloads++;
        let videoPath = null;
        let loadingMsg = null;

        try {
            await message.reaction("⏳", event.messageID);
            loadingMsg = await message.reply("🔍 Searching TikTok videos...");

            // API sources with fallback mechanism
            const API_SOURCES = [
                {
                    url: `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(searchQuery)}`,
                    dataPath: "data.videos",
                    videoUrl: "play",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                },
                {
                    url: `https://tiktok-video-no-watermark2.p.rapidapi.com/search?keywords=${encodeURIComponent(searchQuery)}&count=1`,
                    dataPath: "data",
                    videoUrl: "play",
                    headers: {
                        "X-RapidAPI-Key": "your-api-key-here",
                        "X-RapidAPI-Host": "tiktok-video-no-watermark2.p.rapidapi.com"
                    }
                },
                {
                    url: `https://tiktok-search-api.samirbadaila24.repl.co/search?query=${encodeURIComponent(searchQuery)}`,
                    dataPath: "videos",
                    videoUrl: "video_url",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            ];

            // Try each API source until we get a valid video
            let videoData = null;
            for (const apiSource of API_SOURCES) {
                try {
                    const response = await axios.get(apiSource.url, {
                        timeout: 10000,
                        headers: apiSource.headers
                    });

                    // Extract video data using the specified path
                    const dataPath = apiSource.dataPath.split('.');
                    let videos = response.data;
                    for (const pathSegment of dataPath) {
                        videos = videos?.[pathSegment];
                    }

                    if (videos && videos.length > 0) {
                        videoData = videos[0];
                        videoData.videoUrl = videoData[apiSource.videoUrl];
                        break;
                    }
                } catch (error) {
                    console.log(`API [${apiSource.url}] failed:`, error.message);
                    continue;
                }
            }

            if (!videoData || !videoData.videoUrl) {
                throw new Error("No videos found or all APIs failed");
            }

            await message.reaction("✅", event.messageID);

            // Create temp file in system temp directory
            videoPath = path.join(os.tmpdir(), `tiktok_${event.messageID}_${Date.now()}.mp4`);
            const writer = fs.createWriteStream(videoPath);

            // Download the video
            const videoResponse = await axios({
                method: 'get',
                url: videoData.videoUrl,
                responseType: 'stream',
                headers: {
                    'Referer': 'https://www.tiktok.com/',
                    'Origin': 'https://www.tiktok.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 30000
            });

            // Pipe the download stream to file
            videoResponse.data.pipe(writer);

            // Wait for download to complete
            await new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    // Verify the file was downloaded properly
                    if (!fs.existsSync(videoPath)) {
                        reject(new Error("Downloaded file not found"));
                    } else if (fs.statSync(videoPath).size < 1024) {
                        reject(new Error("Downloaded file is too small"));
                    } else {
                        resolve();
                    }
                });
                writer.on('error', reject);
            });

            // Prepare video info
            const authorInfo = videoData.author || {};
            const videoInfo = `🎵 𝐓𝐢𝐤𝐓𝐨𝐤 𝐕𝐢𝐝𝐞𝐨\n\n👤 𝐂𝐫𝐞𝐚𝐭𝐨𝐫: ${authorInfo.nickname || "Unknown"}\n📌 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: @${authorInfo.unique_id || "unknown"}\n❤️ 𝐋𝐢𝐤𝐞𝐬: ${videoData.digg_count || "N/A"}\n💬 𝐂𝐨𝐦𝐞𝐧𝐭𝐬: ${videoData.comment_count || "N/A"}`;

            // Send the video
            await api.sendMessage({
                body: videoInfo,
                attachment: createReadStream(videoPath)
            }, event.threadID);

        } catch (error) {
            console.error("Error:", error);
            await message.reply("❌ Failed to process TikTok video. Please try again later.");
        } finally {
            // Clean up
            try {
                if (loadingMsg) await message.unsend(loadingMsg.messageID);
                if (videoPath && fs.existsSync(videoPath)) {
                    unlinkSync(videoPath);
                }
            } catch (cleanupError) {
                console.error("Cleanup error:", cleanupError);
            }
            activeDownloads = Math.max(0, activeDownloads - 1);
        }
    }
};