 const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "NTKhang x Modified by Ariyan",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const prefix = global.utils.getPrefix(threadID);
    const { nickNameBot } = global.GoatBot.config;
    const dataAddedParticipants = event.logMessageData.addedParticipants;

    // If the bot was added
    if (dataAddedParticipants.some(user => user.userFbId == api.getCurrentUserID())) {
      if (nickNameBot) api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
      return message.send(
        `Thank you for inviting me to the group!\nBot prefix: ${prefix}\nTo view commands: ${prefix}help`
      );
    }

    // Setup for custom welcome message
    if (!global.temp.welcomeEvent[threadID]) {
      global.temp.welcomeEvent[threadID] = {
        joinTimeout: null,
        dataAddedParticipants: []
      };
    }

    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
      const threadData = await threadsData.get(threadID);
      if (threadData.settings.sendWelcomeMessage === false) return;

      const dataAdded = global.temp.welcomeEvent[threadID].dataAddedParticipants;
      const dataBanned = threadData.data.banned_ban || [];
      const threadName = threadData.threadName;
      const userName = [];
      const mentions = [];

      for (const user of dataAdded) {
        if (dataBanned.some(ban => ban.id === user.userFbId)) continue;

        userName.push(user.fullName);
        mentions.push({
          tag: user.fullName,
          id: user.userFbId
        });
      }

      if (userName.length === 0) return;

      const threadInfo = await api.getThreadInfo(threadID);
      const memberCount = threadInfo.participantIDs.length;
      const adderID = event.logMessageData.author;
      const adderInfo = await api.getUserInfo(adderID);
      const adderName = adderInfo[adderID]?.name || "Someone";

      const welcomeMsg = `🥰 𝙰𝚂𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 ${userName.join(", ")} 𝚠𝚎𝚕𝚌𝚘𝚖𝚎 𝚢𝚘𝚞 𝚃𝚘 𝙾𝚞𝚛 ${threadName} 😊

• 𝙸 𝙷𝚘𝚙𝚎 𝚈𝚘𝚞 𝚆𝚒𝚕𝚕 𝚏𝚘𝚕𝚕𝚘𝚠 𝙾𝚞𝚛 𝙶𝚛𝚘𝚞𝚙 𝚁𝚞𝚕𝚎𝚜
• !𝚛𝚞𝚕𝚎𝚜 𝚏𝚘𝚛 𝙶𝚛𝚘𝚞𝚙 𝚁𝚞𝚕𝚎𝚜
• !𝚑𝚎𝚕𝚙 𝙵𝚘𝚛 𝙰𝚕𝚕 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜

• 𝚈𝚘𝚞 𝙰𝚛𝚎 𝚃𝚑𝚎 ${memberCount}𝚝𝚑 𝙼𝚎𝚖𝚋𝚎𝚛 𝙸𝚗 𝙾𝚞𝚛 𝙶𝚛𝚘𝚞𝚙
• 𝙰𝚍𝚍𝚎𝚍 𝙱𝚢: ${adderName}`;

      const form = {
        body: welcomeMsg,
        mentions
      };

      // Add attachments if set
      if (threadData.data.welcomeAttachment) {
        const files = threadData.data.welcomeAttachment;
        const attachments = files.map(file => drive.getFile(file, "stream"));
        form.attachment = (await Promise.allSettled(attachments))
          .filter(r => r.status === "fulfilled")
          .map(r => r.value);
      }

      message.send(form);
      delete global.temp.welcomeEvent[threadID];
    }, 1500);
  }
};