const axios = require("axios");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

// Facebook Downloader
const fb = async (url) => {
  try {
    // Using a public API for FB
    const { data } = await axios.get(`https://api.dhamz.xyz/api/facebook?url=${url}`);
    if (!data.result) throw new Error("No video found");
    return data.result.url;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// TikTok Downloader (No Watermark)
const tiktok = async (url) => {
  try {
    const { data } = await axios.get(`https://api.dhamz.xyz/api/tiktok?url=${url}`);
    if (!data.result) throw new Error("No video found");
    return data.result.video.nowm; // No Watermark
  } catch (e) {
    console.error(e);
    return null;
  }
};

// YouTube Audio Downloader
const ytAudio = async (url) => {
  try {
    if (!ytdl.validateURL(url)) return null;
    const info = await ytdl.getInfo(url);
    return {
      title: info.videoDetails.title,
      url: url,
      thumb: info.videoDetails.thumbnails[0].url,
    };
  } catch (e) {
    return null;
  }
};

// Song Searcher
const songSearch = async (query) => {
  try {
    const results = await ytSearch(query);
    if (!results.videos.length) return null;
    return results.videos[0];
  } catch (e) {
    return null;
  }
};

module.exports = { fb, tiktok, ytAudio, songSearch };
