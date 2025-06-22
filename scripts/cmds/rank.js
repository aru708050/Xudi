const Canvas = require("canvas");
const path = require("path");
const fs = require("fs");

// --- HELPER: Ensure a directory exists ---
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// --- FONT REGISTRATION ---
const fontDir = path.join(__dirname, 'assets', 'font');
ensureDir(fontDir);
const boldFontPath = path.join(fontDir, 'BeVietnamPro-Bold.ttf');
const semiBoldFontPath = path.join(fontDir, 'BeVietnamPro-SemiBold.ttf');
if (fs.existsSync(boldFontPath)) {
    Canvas.registerFont(boldFontPath, { family: "Bold" });
}
if (fs.existsSync(semiBoldFontPath)) {
    Canvas.registerFont(semiBoldFontPath, { family: "SemiBold" });
}

// --- LEVELING & FORMATTING HELPERS ---
let deltaNext;
const expToLevel = (exp) => Math.floor((1 + Math.sqrt(1 + 8 * (exp || 0) / (deltaNext || 5))) / 2);
const formatMoney = (money) => {
    const m = money || 0;
    if (m >= 1e9) return `${(m / 1e9).toFixed(2)}B`;
    if (m >= 1e6) return `${(m / 1e6).toFixed(2)}M`;
    if (m >= 1e3) return `${(m / 1e3).toFixed(2)}K`;
    return m.toString();
}

// --- MAIN MODULE ---
module.exports = {
    config: {
        name: "rank",
        version: "7.0", // Definitive Parsing Fix
        author: "mahi--",
        countDown: 20,
        role: 0,
        description: {
            en: "Displays a detailed status card. Use -s to set your personal background."
        },
        category: "group",
        guide: {
            en: "   {pn} [@tag/uid/reply]\n   {pn} -s background (reply to an image)\n   {pn} -s removebg"
        },
        envConfig: {
            deltaNext: 5
        }
    },

    onStart: async function (args) {
        const { message, event, usersData, threadsData, api, envCommands } = args;

        // --- NEW: Direct parsing of the raw message body to fix the bug ---
        const rawCommand = event.body.toLowerCase();

        if (rawCommand.includes("-s background")) {
            if (event.type !== "message_reply" || !event.messageReply.attachments || event.messageReply.attachments[0].type !== "photo") {
                return message.reply("⚠️ To set your personal background, please reply to an image and use `/rank -s background`.");
            }
            const imageUrl = event.messageReply.attachments[0].url;
            const userInfo = await usersData.get(event.senderID) || {};
            userInfo.rankCardBackground = imageUrl;
            await usersData.set(event.senderID, userInfo);
            return message.reply("✅ Your personal rank card background has been updated.");
        }

        if (rawCommand.includes("-s removebg")) {
            const userInfo = await usersData.get(event.senderID) || {};
            if (userInfo.rankCardBackground) {
                delete userInfo.rankCardBackground;
                await usersData.set(event.senderID, userInfo);
                return message.reply("✅ Your custom rank card background has been removed.");
            }
            return message.reply("ℹ️ You have not set a custom background.");
        }

        // --- Default: Generate Rank Card (This will only run if the settings commands are not found) ---
        const cacheDir = path.join(__dirname, 'cache');
        ensureDir(cacheDir);
        deltaNext = envCommands[this.config.name].deltaNext;
        
        let uid;
        if (event.type === "message_reply") {
            uid = event.messageReply.senderID;
        } else if (Object.keys(event.mentions).length > 0) {
            uid = Object.keys(event.mentions)[0];
        } else if (args[0] && /^\d+$/.test(args[0])) {
            uid = args[0];
        } else {
            uid = event.senderID;
        }

        try {
            const data = await gatherUserData(uid, event.threadID, api, usersData, threadsData);
            const cardStream = await createRankCard(data);

            const filePath = path.join(cacheDir, `${Date.now()}_rank.png`);
            const writeStream = fs.createWriteStream(filePath);
            cardStream.pipe(writeStream);

            writeStream.on('finish', () => {
                message.reply({
                    attachment: fs.createReadStream(filePath)
                }, () => fs.unlinkSync(filePath));
            });
        } catch (error) {
            console.error("Rank Card Generation Error:", error);
            return message.reply(`❌ An error occurred. Please try again. Possible reasons:\n1. The bot's login cookie (appstate) has expired.\n2. The user has not interacted with the bot before.`);
        }
    },

    onChat: async function ({ usersData, threadsData, event }) {
        if (!event.isGroup || event.senderID == global.GoatBot.botID) return;
        const { senderID, threadID } = event;
        const user = await usersData.get(senderID) || {};
        await usersData.set(senderID, { exp: (user.exp || 0) + 1 });
        const thread = await threadsData.get(threadID) || {};
        if (!Array.isArray(thread.members)) thread.members = [];
        const findMember = thread.members.find(m => m.userID == senderID);
        if (findMember) {
            findMember.count = (findMember.count || 0) + 1;
        } else {
            const name = await usersData.getName(senderID);
            thread.members.push({ userID: senderID, name: name, count: 1 });
        }
        await threadsData.set(threadID, { members: thread.members });
    }
};

// --- COMPREHENSIVE DATA GATHERING ---
async function gatherUserData(uid, threadID, api, usersData, threadsData) {
    const [allUsers, userInfo, threadInfo, user] = await Promise.all([
        usersData.getAll().catch(() => []),
        api.getUserInfo(uid).catch(() => ({})),
        threadsData.get(threadID).catch(() => ({})),
        usersData.get(uid).catch(() => ({}))
    ]);
    const safeUser = user || {};
    const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];
    const safeThreadInfo = threadInfo || {};
    const expRankList = [...safeAllUsers].sort((a, b) => (b.exp || 0) - (a.exp || 0));
    const expRank = expRankList.findIndex(u => u.userID == uid) + 1 || safeAllUsers.length;
    const moneyRankList = [...safeAllUsers].sort((a, b) => (b.money || 0) - (a.money || 0));
    const moneyRank = moneyRankList.findIndex(u => u.userID == uid) + 1 || safeAllUsers.length;
    let messageCount = 0;
    if (Array.isArray(safeThreadInfo.members)) {
        const memberData = safeThreadInfo.members.find(m => m.userID === uid);
        if (memberData) messageCount = memberData.count || 0;
    }
    const _u = userInfo[uid] || {};
    let username = uid;
    if (_u.profileUrl) {
        const vanity = _u.profileUrl.replace('https://www.facebook.com/', '').split('?')[0].replace('/', '');
        if (vanity && !vanity.startsWith('profile.php')) username = vanity;
    }
    let gender = "Unknown";
    if (_u.gender === 1) gender = "Female";
    if (_u.gender === 2) gender = "Male";
    const nickname = (safeThreadInfo.nicknames && safeThreadInfo.nicknames[uid]) ? safeThreadInfo.nicknames[uid] : _u.name;
    return {
        uid,
        name: _u.name || `User ${uid}`,
        nickname: nickname || `User ${uid}`,
        username,
        gender,
        level: expToLevel(safeUser.exp),
        exp: safeUser.exp || 0,
        money: formatMoney(safeUser.money),
        messageCount,
        expRank: `${expRank}/${expRankList.length}`,
        moneyRank: `${moneyRank}/${moneyRankList.length}`,
        avatarUrl: await usersData.getAvatarUrl(uid),
        customBgUrl: safeUser.rankCardBackground || null
    };
}


// --- CANVAS GENERATION ---
async function createRankCard(data) {
    const themes = [
        { name: 'Blue', primary: '#00c3ff', glow: '#00c3ff', bg: '#0b1021', rgb: ['#00c3ff', '#59d7ff', '#91e5ff'] },
        { name: 'Red', primary: '#ff0032', glow: '#ff0032', bg: '#1d0f1a', rgb: ['#ff0032', '#ff4d6d', '#ff809b'] },
        { name: 'Green', primary: '#00ff41', glow: '#00ff41', bg: '#0b1d17', rgb: ['#00ff41', '#5bff82', '#91ffb0'] },
        { name: 'Purple', primary: '#d400ff', glow: '#d400ff', bg: '#190f2d', rgb: ['#d400ff', '#e15cff', '#ec91ff'] },
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const canvas = Canvas.createCanvas(1920, 1080);
    const ctx = canvas.getContext("2d");

    if (data.customBgUrl) {
        try {
            const background = await Canvas.loadImage(data.customBgUrl);
            ctx.drawImage(background, 0, 0, 1920, 1080);
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, 1920, 1080);
        } catch (e) {
            drawDefaultBackground(ctx, theme);
        }
    } else {
        drawDefaultBackground(ctx, theme);
    }
    
    drawNeonRect(ctx, 40, 40, 1840, 1000, theme.glow, 25);
    const avatarSize = 250;
    const avatarX = 1920 / 2;
    const avatarY = 240;
    drawRgbGlow(ctx, avatarX, avatarY, avatarSize / 2 + 15, theme.rgb);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    try {
        const avatar = await Canvas.loadImage(data.avatarUrl);
        ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    } catch (e) {
        ctx.fillStyle = '#2c2c2c';
        ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    }
    ctx.restore();
    ctx.textAlign = "center";
    ctx.font = '80px "Bold"';
    drawNeonText(ctx, data.name, 960, 460, "#ffffff", theme.glow, 20);
    ctx.textAlign = "left";
    ctx.font = '40px "SemiBold"';
    const col1X = 350;
    const col2X = 1050;
    const startY = 580;
    const itemGap = 90;
    const info = [
        { icon: 'id', label: 'User ID', value: data.uid },
        { icon: 'nickname', label: 'Nickname', value: data.nickname },
        { icon: 'gender', label: 'Gender', value: data.gender },
        { icon: 'username', label: 'Username', value: data.username },
        { icon: 'level', label: 'Level', value: data.level },
        { icon: 'exp', label: 'EXP', value: data.exp },
        { icon: 'money', label: 'Money', value: data.money },
        { icon: 'messages', label: 'Messages', value: data.messageCount },
        { icon: 'exp_rank', label: 'EXP Rank', value: data.expRank },
        { icon: 'money_rank', label: 'Money Rank', value: data.moneyRank },
    ];
    info.forEach((item, index) => {
        const x = index < 5 ? col1X : col2X;
        const y = startY + (index % 5) * itemGap;
        ctx.textBaseline = "middle";
        drawIcon(ctx, item.icon, x, y, 35, theme.primary);
        const labelText = `${item.label}: `;
        const valueText = item.value.toString().length > 20 ? item.value.toString().substring(0, 17) + "..." : item.value;
        drawNeonText(ctx, labelText, x + 55, y, "#bbbbbb", theme.glow, 5);
        drawNeonText(ctx, valueText, x + 55 + ctx.measureText(labelText).width, y, "#ffffff", theme.glow, 10);
    });
    ctx.textBaseline = "alphabetic";
    const bdtTime = new Date(new Date().getTime() + (6 * 60 * 60 * 1000));
    const timestamp = `Last Update: ${bdtTime.getUTCFullYear()}-${String(bdtTime.getUTCMonth() + 1).padStart(2, '0')}-${String(bdtTime.getUTCDate()).padStart(2, '0')} ${String(bdtTime.getUTCHours()).padStart(2, '0')}:${String(bdtTime.getUTCMinutes()).padStart(2, '0')}`;
    ctx.textAlign = "center";
    ctx.font = '28px "SemiBold"';
    drawNeonText(ctx, timestamp, 960, 1020, "#666666", theme.glow, 5);
    return canvas.createPNGStream();
}

// --- CANVAS DRAWING HELPERS ---
function drawDefaultBackground(ctx, theme) {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    drawStarfield(ctx, 1920, 1080);
}
function drawNeonText(ctx, text, x, y, color, glowColor, blur = 10) {
    ctx.fillStyle = color;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blur;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
}
function drawNeonRect(ctx, x, y, w, h, glowColor, blur = 20) {
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blur;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 30);
    ctx.stroke();
    ctx.shadowBlur = 0;
}
function drawStarfield(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
function drawRgbGlow(ctx, x, y, radius, colors) {
    const angleStep = (Math.PI * 2) / colors.length;
    ctx.save();
    ctx.lineWidth = 10;
    ctx.shadowBlur = 35;
    for (let i = 0; i < colors.length; i++) {
        ctx.beginPath();
        const startAngle = i * angleStep;
        const endAngle = (i + 1) * angleStep;
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.strokeStyle = colors[i];
        ctx.shadowColor = colors[i];
        ctx.stroke();
    }
    ctx.restore();
}
function drawIcon(ctx, iconName, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${size}px "Bold"`; 
    const icons = {
        'id': '🆔', 'nickname': '✏️', 'gender': '🚻', 'username': '🌐', 'level': '⭐',
        'exp': '⚡', 'money': '💰', 'messages': '💬', 'exp_rank': '🏆', 'money_rank': '💎'
    };
    if (icons[iconName]) {
        ctx.fillText(icons[iconName], x, y);
    }
    ctx.restore();
}