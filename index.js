const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const config = require("./config");
const connectDB = require("./lib/mongo");
const { getAIResponse } = require("./lib/ai");
const { fb, tiktok, ytAudio, songSearch } = require("./plugins/downloader");

// Start Database
connectDB();

// Logger
const logger = pino({ level: "silent" });

// Start Function
async function startSHEN_MD() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    logger,
    auth: state,
    printQRInTerminal: false, // QR disabled
    browser: ["SHEN-MD", "Chrome", "1.0"],
  });

  // Connection Updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) {
        startSHEN_MD();
      }
    } else if (connection === "open") {
      console.log("✅ SHEN-MD CONNECTED (Session Login)");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Messages Handler
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;
      if (!messageContent) continue;

      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const isGroup = from.endsWith("@g.us");
      const prefix = config.PREFIX;

      // Command Parser
      const args = messageContent.trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      const body = args.join(" ");

      console.log(`CMD: ${cmd} | From: ${from}`);

      try {
        // === .menu ===
        if (cmd === `${prefix}menu`) {
          const menuText = `
*SHEN-MD COMMAND LIST*

▢ ${prefix}fb <link> - Download FB Video
▢ ${prefix}yt <link> - Download YT Audio
▢ ${prefix}tk <link> - Download TikTok Video
▢ ${prefix}.song <name/link> - Download Song

_Auto AI Chat enabled if no command used._
_Powered by SHEN-MD_
          `;
          await sock.sendMessage(from, { text: menuText }, { quoted: msg });
        }

        // === .fb ===
        else if (cmd === `${prefix}fb`) {
          if (!body) return await sock.sendMessage(from, { text: "Please provide a Facebook link." }, { quoted: msg });
          await sock.sendMessage(from, { text: "Downloading FB video..." }, { quoted: msg });
          const videoUrl = await fb(body);
          if (videoUrl) {
            await sock.sendMessage(from, { video: { url: videoUrl } }, { quoted: msg });
          } else {
            await sock.sendMessage(from, { text: "Failed to download. Link invalid or private." }, { quoted: msg });
          }
        }

        // === .tk ===
        else if (cmd === `${prefix}tk`) {
          if (!body) return await sock.sendMessage(from, { text: "Please provide a TikTok link." }, { quoted: msg });
          await sock.sendMessage(from, { text: "Downloading TikTok video..." }, { quoted: msg });
          const videoUrl = await tiktok(body);
          if (videoUrl) {
            await sock.sendMessage(from, { video: { url: videoUrl } }, { quoted: msg });
          } else {
            await sock.sendMessage(from, { text: "Failed to download TikTok." }, { quoted: msg });
          }
        }

        // === .yt ===
        else if (cmd === `${prefix}yt`) {
          if (!body) return await sock.sendMessage(from, { text: "Please provide a YouTube link." }, { quoted: msg });
          
          // Simple audio stream using ytdl
          if (!ytdl.validateURL(body)) return await sock.sendMessage(from, { text: "Invalid YouTube URL." }, { quoted: msg });
          
          await sock.sendMessage(from, { text: "🎵 Processing audio..." }, { quoted: msg });
          try {
            const info = await ytdl.getInfo(body);
            const audioStream = ytdl.downloadFromInfo(info, { quality: 'lowestaudio' });
            
            await sock.sendMessage(from, {
              audio: audioStream,
              mimetype: 'audio/mp4',
              fileName: `${info.videoDetails.title}.mp3`
            }, { quoted: msg });
          } catch (e) {
            await sock.sendMessage(from, { text: "Download failed. Video might be too long or restricted." }, { quoted: msg });
          }
        }

        // === .song ===
        else if (cmd === `${prefix}song`) {
          if (!body) return await sock.sendMessage(from, { text: "Provide song name or link." }, { quoted: msg });
          
          await sock.sendMessage(from, { text: "🔎 Searching..." }, { quoted: msg });
          
          let videoUrl = body;
          let title = "Song";

          // Check if input is a link, otherwise search
          if (!ytdl.validateURL(body)) {
            const result = await songSearch(body);
            if (!result) return await sock.sendMessage(from, { text: "Song not found." }, { quoted: msg });
            videoUrl = result.url;
            title = result.title;
          }

          try {
            const info = await ytdl.getInfo(videoUrl);
            const audioStream = ytdl.downloadFromInfo(info, { quality: 'lowestaudio' });
            
            await sock.sendMessage(from, { text: `Playing: ${title}` }, { quoted: msg });
            
            await sock.sendMessage(from, {
              audio: audioStream,
              mimetype: 'audio/mp4',
              fileName: `${title}.mp3`
            }, { quoted: msg });
          } catch (e) {
            console.log(e);
            await sock.sendMessage(from, { text: "Error downloading song." }, { quoted: msg });
          }
        }

        // === AI CHAT (If not command and not group chat optionally) ===
        else if (!cmd.startsWith(prefix)) {
          // Only reply to AI in PM (Optional: remove isGroup check to enable AI in groups)
          if (!isGroup) {
             await sock.sendPresenceUpdate('composing', from);
             const aiReply = await getAIResponse(messageContent);
             await sock.sendMessage(from, { text: aiReply }, { quoted: msg });
          }
        }

      } catch (error) {
        console.error("Error in handler:", error);
      }
    }
  });
}

startSHEN_MD();

// Keep process alive
process.on("unhandledRejection", (err) => console.log(err));
