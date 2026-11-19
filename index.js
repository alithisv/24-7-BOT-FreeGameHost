"use strict";

const mineflayer = require("mineflayer");
const config = require("./settings.json");

let bot = null;
let intervals = [];
let reconnectTimer = null;
let attempts = 0;

function clearTimers() {
  intervals.forEach(clearInterval);
  intervals = [];
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  clearTimers();
  attempts++;
  const base = (config.utils && config.utils["auto-reconnect-delay"]) || 5000;
  const max = (config.utils && config.utils["max-reconnect-delay"]) || 60000;
  const delay = Math.min(base * Math.pow(2, attempts - 1), max) + Math.floor(Math.random() * 2000);
  console.log(`[Bot] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt #${attempts})`);
  reconnectTimer = setTimeout(createBot, delay);
}

function createBot() {
  clearTimers();
  if (bot) {
    try {
      bot.removeAllListeners();
      bot.end();
    } catch (_) {}
    bot = null;
  }

  const host = config.server.ip || "lisoso.myserver.host";
  const port = config.server.port || 25565;
  const version =
    config.server.version && config.server.version.trim() !== ""
      ? config.server.version
      : false;

  console.log(`[Bot] Connecting to ${host}:${port}...`);

  bot = mineflayer.createBot({
    username: config["bot-account"].username,
    password: config["bot-account"].password || undefined,
    auth: config["bot-account"].type || "offline",
    host,
    port,
    version,
    checkTimeoutInterval: 600000,
  });

  bot.once("spawn", () => {
    attempts = 0;
    console.log(`[Bot] Spawned successfully (MC ${bot.version})`);

    if (config.utils && config.utils["auto-auth"] && config.utils["auto-auth"].enabled) {
      const pwd = config.utils["auto-auth"].password;
      setTimeout(() => {
        if (bot) bot.chat(`/login ${pwd}`);
      }, 3000);
    }

    // 基础防踢：每 25 秒随机转头并挥手
    intervals.push(
      setInterval(() => {
        if (!bot || !bot.entity) return;
        try {
          const yaw = Math.random() * Math.PI * 2 - Math.PI;
          const pitch = (Math.random() - 0.5) * 0.5;
          bot.look(yaw, pitch, false);
          bot.swingArm();
        } catch (_) {}
      }, 25000)
    );
  });

  bot.on("kicked", (reason) => {
    console.log(`[Bot] Kicked: ${typeof reason === "object" ? JSON.stringify(reason) : reason}`);
  });

  bot.on("error", (err) => {
    console.log(`[Bot] Error: ${err.message}`);
  });

  bot.on("end", (reason) => {
    console.log(`[Bot] Disconnected: ${reason || "socketClosed"}`);
    scheduleReconnect();
  });
}

process.on("uncaughtException", (err) => {
  console.log(`[FATAL] ${err.message}`);
  scheduleReconnect();
});

process.on("unhandledRejection", (reason) => {
  console.log(`[FATAL] ${reason}`);
});

createBot();
