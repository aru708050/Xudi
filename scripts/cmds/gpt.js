const fetch = require("node-fetch");
const axios = require("axios");

const OWNER_UIDS = ["61568425442088", "61568425442088"];
const maxStorageMessage = 69; // Max number of messages to store per user

if (!global.temp) {
  global.temp = {};
}
if (!global.temp.voicePreference) {
  global.temp.voicePreference = {};
}
if (!global.temp.conversationHistroy) {
  global.temp.conversationHistroy = {};
}
if (!global.utils || !global.utils.getStreamFromURL) {
  console.error("global.utils.getStreamFromURL is not defined! Features requiring it may fail.");
  global.utils = global.utils || {};
  global.utils.getStreamFromURL = async (url) => {
    const response = await axios.get(url, { responseType: 'stream' });
    return response.data;
  };
}

const { voicePreference, conversationHistroy } = global.temp;

function parseAspectRatio(ratioStr) {
  // Default to 1:1 if no ratio provided
  if (!ratioStr) return { width: 1024, height: 1024 };

  const parts = ratioStr.split(':');
  if (parts.length !== 2) return { width: 1024, height: 1024 };

  const width = parseInt(parts[0]);
  const height = parseInt(parts[1]);

  if (isNaN(width) || isNaN(height)) return { width: 1024, height: 1024 };

  // Calculate dimensions while maintaining aspect ratio and reasonable size
  const baseSize = 1024;
  if (width > height) {
    return {
      width: baseSize,
      height: Math.round((height / width) * baseSize)
    };
  } else {
    return {
      width: Math.round((width / height) * baseSize),
      height: baseSize
    };
  }
}

async function checkIfImageGenerationNeeded(text) {
  try {
    const response = await axios.get(`http://193.149.164.141:8610/api/gemini?text=${encodeURIComponent(`Analyze this text and respond only with "yes" if it's requesting image generation or "no" if it's normal chat. Text: "${text}"`)}`);
    return response.data?.response?.trim().toLowerCase() === "yes";
  } catch (error) {
    console.error("Error checking image generation need:", error);
    return false;
  }
}

async function getChatResponse(prompt) {
  try {
    const response = await fetch('https://exomlapi.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://exomlapi.com/c/chat-1750343203906-699io3j50'
      },
      body: JSON.stringify({
        "id": "AFIq6sis1FqpLNO1",
        "messages": [
          {
            "role": "user",
            "content": "",
            "parts": [
              {
                "type": "text",
                "text": prompt
              }
            ]
          }
        ],
        "chatId": "chat-1750343203906-699io3j50",
        "userId": "local-user-1750335940442-fqspmyjqr",
        "model": "gpt-4.1",
        "isAuthenticated": true,
        "systemPrompt": "",
        "antiBotId": "U9l0CUaITcZLQlAsSXiKX_KombniEv2u-64fa2e38"
      })
    });

    const data = await response.text();
    // Parse the streaming response
    const lines = data.split('\n').filter(line => line.trim());
    let fullResponse = '';
    
    for (const line of lines) {
      if (line.startsWith('0:"')) {
        fullResponse += line.substring(3, line.length - 1);
      } else if (line.startsWith('e:') || line.startsWith('f:') || line.startsWith('d:')) {
        // Skip metadata lines
        continue;
      }
    }
    
    return fullResponse || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Chat API Error:", error);
    return "❌ An error occurred while generating the response. Please try again.";
  }
}

module.exports = {
  config: {
    name: "gpt",
    version: "2.1",
    author: "Mahi--",
    countDown: 5,
    role: 0,
    shortDescription: "AI chat, image generation, image editing, TTS, and admin tools.",
    longDescription: "Chat with AI, generate images with 'imagine', edit images by replying with a prompt, convert text to speech with 'speak', toggle voice responses, and access admin tools.",
    category: "ai",
    guide: {
      en: "• /gpt <text>: Chat with AI.\n" +
          "• /gpt imagine <prompt> --ar <ratio>: Generate an image (e.g., --ar 16:9). Default is 1:1.\n" +
          "• /gpt (reply to image) <edit_prompt>: Edit the replied image.\n" +
          "• /gpt speak <text>: Convert text to speech.\n" +
          "• /gpt voice on/off: Toggle voice responses for chat.\n" +
          "• /gpt clear: Clear conversation history\n" +
          "--- Admin ---\n" +
          "• /gpt -a force: Force account creation (admin only).\n" +
          "• /gpt -a info: Get account info (admin only)."
    }
  },

  langs: {
    en: {
      error: "❌ An error occurred: %1",
      downloading_edit: "✨ Editing your image with prompt \"%1\"...",
      invalid_reply_image: "⚠️ Please reply to an image to edit.",
      usage_edit_prompt: "⚠️ You must provide a prompt for image editing. Example: /gpt make background red (while replying to an image)",
      admin_created: "✅ Force account creation successful.",
      admin_info: "📊 Account Info:\n%1",
      admin_invalid_action: "⚠️ Invalid admin command. Use -a force or -a info.",
      api_init_fail: "❌ Critical: Could not initialize API endpoints for image editing. Please contact bot admin.",
      clearHistory: "🗑️ Conversation history cleared successfully.",
      invalid_aspect_ratio: "⚠️ Invalid aspect ratio format. Use --ar W:H (e.g., --ar 16:9)"
    }
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    const senderID = event.senderID.toString();
    let text_args = args.join(" ").trim();
    const reply = event.messageReply;

    // Clear conversation history
    if (args[0]?.toLowerCase() === "clear") {
      conversationHistroy[senderID] = [];
      return message.reply(getLang("clearHistory"));
    }

    if (args[0] === "-a") {
      if (!OWNER_UIDS.includes(senderID)) {
        return message.reply("🚫 You are not authorized to use admin commands.");
      }
      const action = args[1];
      if (action === "force") {
        try {
          await axios.post(`http://193.149.164.141:8610/api/force`, null, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
          return message.reply(getLang("admin_created"));
        } catch (err) {
          return message.reply(getLang("error", err.message));
        }
      } else if (action === "info") {
        try {
          const { data } = await axios.get(`http://193.149.164.141:8610/api/accounts-info`);
          return message.reply(getLang("admin_info", JSON.stringify(data, null, 2)));
        } catch (err) {
          return message.reply(getLang("error", err.message));
        }
      } else {
        return message.reply(getLang("admin_invalid_action"));
      }
      return;
    }

    // Handle image editing
    if (reply && reply.attachments && reply.attachments[0]?.type === "photo" && args.length > 0) {
      const edit_prompt = text_args;
      if (!edit_prompt) return message.reply(getLang("usage_edit_prompt"));

      const imageUrl = reply.attachments[0].url;
      let Pmsg = await message.reply(getLang("downloading_edit", edit_prompt));
      
      try {
        const editUrl = `http://193.149.164.141:8610/api/editpro2?prompt=${encodeURIComponent(edit_prompt)}&url=${encodeURIComponent(imageUrl)}`;
        const editRes = await axios.get(editUrl);
        
        if (editRes.data?.image_url) {
          const imgStream = await global.utils.getStreamFromURL(editRes.data.image_url);
          await message.reply({
            body: `✅ Image Edited!\n📌 Prompt: ${edit_prompt}`,
            attachment: imgStream
          });
        } else {
          throw new Error("Generated image URL not found in API response.");
        }
        
        if (Pmsg && Pmsg.messageID) api.unsendMessage(Pmsg.messageID);
      } catch (err) {
        if (Pmsg && Pmsg.messageID) api.unsendMessage(Pmsg.messageID);
        const errorMessage = err.response?.data?.error || err.response?.data?.message || err.response?.data || err.message;
        return message.reply(getLang("error", errorMessage));
      }
      return;
    }

    // Voice toggle
    const isVoiceToggle = /^(voice)\s(on|off)$/i.test(text_args);
    if (isVoiceToggle) {
      const toggle = args[1]?.toLowerCase();
      if (toggle === "on") {
        voicePreference[senderID] = true;
        return message.reply("✅ | Voice mode enabled. AI will now respond with text and audio.");
      } else if (toggle === "off") {
        voicePreference[senderID] = false;
        return message.reply("❌ | Voice mode disabled. AI will now respond with text only.");
      }
      return;
    }

    // Explicit image generation commands
    const isImageGen = /^(gen|imagine|create\simage|draw)/i.test(args[0]);
    if (isImageGen) {
      // Extract aspect ratio if provided
      let aspectRatio = null;
      const arRegex = /--ar\s+(\d+:\d+)/i;
      const arMatch = text_args.match(arRegex);

      if (arMatch) {
        aspectRatio = arMatch[1];
        text_args = text_args.replace(arRegex, '').trim();
      }

      const { width, height } = parseAspectRatio(aspectRatio);

      const prompt = text_args.replace(/^(gen|imagine|create\simage|draw)\s+/i, "");
      if (!prompt) return message.reply("🖼️ | Please provide a prompt for image generation.");

      const fluxUrl = "https://fluxtools.org/api/ai.generateFluxImage?batch=1";
      const body = {
        "0": {
          json: {
            prompt: prompt,
            imageSize: { width: width, height: height },
            customWidth: width,
            customHeight: height,
            numInferenceSteps: 28,
            guidanceScale: 3.5,
            syncMode: false,
            imageModel: "pro-free"
          }
        }
      };

      try {
        const response = await fetch(fluxUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
            "Referer": "https://fluxtools.org/"
          },
          body: JSON.stringify(body)
        });

        const data = await response.json();    
        const imageUrl = data?.[0]?.result?.data?.json?.[0]?.url;    

        if (imageUrl) {
          message.reply({
            body: `🖼️ | Here's your image (${width}x${height}) for: "${prompt}"`,
            attachment: await global.utils.getStreamFromURL(imageUrl)
          });
        } else {
          console.error("Image Gen Response Issue (Flux):", JSON.stringify(data, null, 2));
          message.reply("❌ | Failed to generate image with Flux. API might have an issue.");
        }
      } catch (error) {
        console.error("Image Gen Error (Flux):", error);
        message.reply(`❌ | Image generation (Flux) failed: ${error.message}`);
      }
      return;
    }

    // Check for implicit image generation requests
    const shouldGenerateImage = await checkIfImageGenerationNeeded(text_args);
    if (shouldGenerateImage && !isImageGen) {
      const { width, height } = parseAspectRatio("1:1");
      const fluxUrl = "https://fluxtools.org/api/ai.generateFluxImage?batch=1";
      const body = {
        "0": {
          json: {
            prompt: text_args,
            imageSize: { width: width, height: height },
            customWidth: width,
            customHeight: height,
            numInferenceSteps: 28,
            guidanceScale: 3.5,
            syncMode: false,
            imageModel: "pro-free"
          }
        }
      };

      try {
        const response = await fetch(fluxUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
            "Referer": "https://fluxtools.org/"
          },
          body: JSON.stringify(body)
        });

        const data = await response.json();    
        const imageUrl = data?.[0]?.result?.data?.json?.[0]?.url;    

        if (imageUrl) {
          message.reply({
            body: `🖼️ | Here's your image (${width}x${height}) for: "${text_args}"`,
            attachment: await global.utils.getStreamFromURL(imageUrl)
          });
        } else {
          console.error("Image Gen Response Issue (Flux):", JSON.stringify(data, null, 2));
          message.reply("❌ | Failed to generate image with Flux. API might have an issue.");
        }
      } catch (error) {
        console.error("Image Gen Error (Flux):", error);
        message.reply(`❌ | Image generation (Flux) failed: ${error.message}`);
      }
      return;
    }

    // TTS handling
    const isTTS = /^(speak|say|tts|voice)/i.test(args[0]);
    if (isTTS && args.length > 1 && !isVoiceToggle) {
      const speechText = text_args.replace(/^(speak|say|tts|voice)\s+/i, "");
      if (!speechText) return message.reply("🗣️ | Please provide text to convert to speech.");

      const ttsUrl = `https://tts-siam-apiproject.vercel.app/speech?text=${encodeURIComponent(speechText)}`;
      try {
        message.reply({
          body: `🗣️ | Here is your speech for: "${speechText}"`,
          attachment: await global.utils.getStreamFromURL(ttsUrl)
        });
      } catch (error) {
        console.error("TTS Error:", error);
        message.reply("❌ | Failed to generate speech. Try again.");
      }
      return;
    }

    if (args.length === 0 && !reply) return message.reply("❓ | Provide a message, image prompt, or text for TTS.");
    if (args.length === 0 && reply && (!reply.attachments || reply.attachments[0]?.type !== "photo")) {
      return message.reply("💬 | Please provide a message to chat about, or a prompt if replying to an image for editing.");
    }
    if (args.length === 0 && reply && reply.attachments && reply.attachments[0]?.type === "photo") {
      return message.reply(getLang("usage_edit_prompt"));
    }

    let userQuery = text_args;
    const ownerPassword = "01200120";

    let isChatOwnerMode = false;
    if (userQuery.startsWith(ownerPassword) && OWNER_UIDS.includes(senderID)) {
      isChatOwnerMode = true;
      userQuery = userQuery.substring(ownerPassword.length).trim();
    }

    if (!userQuery && isChatOwnerMode) {
      return message.reply("🔑 | Owner chat mode: Please provide a prompt after the password.");
    }
    if (!userQuery && !isChatOwnerMode && args.length > 0) {
      userQuery = text_args;
    } else if (!userQuery && !isChatOwnerMode) {
      return message.reply("💬 | Please provide a message to chat about.");
    }

    // Handle conversation history
    if (!conversationHistroy[senderID]) {
      conversationHistroy[senderID] = [];
    }

    if (conversationHistroy[senderID].length >= maxStorageMessage) {
      conversationHistroy[senderID].shift();
    }

    conversationHistroy[senderID].push({
      role: "user",
      content: userQuery
    });

    // Get chat response
    const aiReply = await getChatResponse(userQuery);

    // Store AI response in conversation history
    conversationHistroy[senderID].push({
      role: "assistant",
      content: aiReply
    });

    if (voicePreference[senderID]) {
      const ttsUrl = `https://tts-siam-apiproject.vercel.app/speech?text=${encodeURIComponent(aiReply)}`;
      try {
        message.reply({
          body: aiReply,
          attachment: await global.utils.getStreamFromURL(ttsUrl)
        }, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "gpt",
            author: event.senderID,
            messageID: info.messageID,
          });
        });
      } catch (ttsError) {
        console.error("TTS Conversion Error for AI reply:", ttsError);
        message.reply(aiReply, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "gpt",
            author: event.senderID,
            messageID: info.messageID,
          });
        });
      }
    } else {
      message.reply(aiReply, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "gpt",
          author: event.senderID,
          messageID: info.messageID,
        });
      });
    }
  },

  onReply: async function ({ Reply, message, event, args }) {
    const { author, commandName } = Reply;

    // Only respond to replies from the "gpt" command
    if (author !== event.senderID || commandName !== "gpt") return;

    const userInput = args.join(" ");
    const senderID = event.senderID.toString();

    // Handle conversation history for replies
    if (!conversationHistroy[senderID]) {
      conversationHistroy[senderID] = [];
    }

    if (conversationHistroy[senderID].length >= maxStorageMessage) {
      conversationHistroy[senderID].shift();
    }

    conversationHistroy[senderID].push({
      role: "user",
      content: userInput
    });

    // Get chat response
    const aiReply = await getChatResponse(userInput);

    // Store AI response in conversation history
    conversationHistroy[senderID].push({
      role: "assistant",
      content: aiReply
    });

    if (voicePreference[senderID]) {
      const ttsUrl = `https://tts-siam-apiproject.vercel.app/speech?text=${encodeURIComponent(aiReply)}`;
      try {
        message.reply({
          body: aiReply,
          attachment: await global.utils.getStreamFromURL(ttsUrl)
        }, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "gpt",
            author: event.senderID,
            messageID: info.messageID,
          });
        });
      } catch (ttsError) {
        console.error("TTS Conversion Error for AI reply:", ttsError);
        message.reply(aiReply, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "gpt",
            author: event.senderID,
            messageID: info.messageID,
          });
        });
      }
    } else {
      message.reply(aiReply, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "gpt",
          author: event.senderID,
          messageID: info.messageID,
        });
      });
    }
  }
};