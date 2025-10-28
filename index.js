require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Ensure Puppeteer knows where Chrome lives on Render
if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
  try {
    const baseCacheDir = process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer';
    const chromeRoot = path.join(baseCacheDir, 'chrome');
    let discoveredExecutablePath = '';
    if (fs.existsSync(chromeRoot)) {
      const platformPrefixes = ['linux-', 'mac-', 'win-'];
      const versions = fs
        .readdirSync(chromeRoot)
        .filter((entry) => platformPrefixes.some((p) => entry.startsWith(p)));
      // Newest first by mtime
      const versionEntriesSorted = versions
        .map((entry) => ({
          name: entry,
          time: fs.statSync(path.join(chromeRoot, entry)).mtimeMs,
        }))
        .sort((a, b) => b.time - a.time);
      for (const v of versionEntriesSorted) {
        const candidate = path.join(chromeRoot, v.name, 'chrome-linux64', 'chrome');
        if (fs.existsSync(candidate)) {
          discoveredExecutablePath = candidate;
          break;
        }
      }
    }
    if (discoveredExecutablePath) {
      process.env.PUPPETEER_EXECUTABLE_PATH = discoveredExecutablePath;
      // eslint-disable-next-line no-console
      console.log(`[boot] Using Puppeteer Chrome at: ${discoveredExecutablePath}`);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('[boot] Failed to resolve Puppeteer executable path:', e && e.message);
  }
}
const TelegramBot = require('node-telegram-bot-api');
const Database = require('./database/db');
const CommandHandler = require('./handlers/commandHandler');
const MessageHandler = require('./handlers/messageHandler');

// ========================================
// Bot Initialization
// ========================================
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (!token) {
  console.warn('⚠️ לא הוגדר TELEGRAM_BOT_TOKEN — השירות יעלה במצב בריאות בלבד (ללא בוט)');
} else {
  bot = new TelegramBot(token, { polling: true });
}

// ========================================
// Database Initialization
// ========================================
const db = new Database();
console.log('✅ Database initialized');

// ========================================
// Initialize Handlers
// ========================================
let commandHandler = null;
let messageHandler = null;

if (bot) {
  commandHandler = new CommandHandler(bot, db);
  messageHandler = new MessageHandler(bot, db);
}

// ========================================
// Bot Event Listeners
// ========================================

if (bot && commandHandler && messageHandler) {
  // Handle /start command
  bot.onText(/\/start/, (msg) => {
    commandHandler.handleStart(msg);
  });

  // Handle /help command
  bot.onText(/\/help/, (msg) => {
    commandHandler.handleHelp(msg);
  });

  // Handle /sandbox command
  bot.onText(/\/sandbox/, (msg) => {
    commandHandler.handleSandbox(msg);
  });

  // Handle /exit command (exit sandbox mode)
  bot.onText(/\/exit/, (msg) => {
    commandHandler.handleExit(msg);
  });

  // Handle /themes command (select sandbox theme)
  bot.onText(/\/themes/, (msg) => {
    commandHandler.handleThemes(msg);
  });

  // Handle /cheatsheet command
  bot.onText(/\/cheatsheet/, (msg) => {
    commandHandler.handleCheatsheet(msg);
  });

  // Handle /templates command
  bot.onText(/\/templates/, (msg) => {
    commandHandler.handleTemplates(msg);
  });

  // Handle /progress command (show user progress)
  bot.onText(/\/progress/, (msg) => {
    commandHandler.handleProgress(msg);
  });

  // Handle /reset_progress command (admin only)
  bot.onText(/\/reset_progress/, (msg) => {
    commandHandler.handleResetProgress(msg);
  });

  // Handle /next command (next lesson)
  bot.onText(/\/next/, (msg) => {
    commandHandler.handleNext(msg);
  });

  // Handle /train command (focused training mode)
  bot.onText(/\/train/, (msg) => {
    commandHandler.handleTrain(msg);
  });

  // Handle /cancel_training command (exit training mode)
  bot.onText(/\/cancel_training/, (msg) => {
    commandHandler.handleCancelTraining(msg);
  });

  // Handle callback queries (button clicks)
  bot.on('callback_query', (query) => {
    messageHandler.handleCallbackQuery(query);
  });

  // Handle all text messages (for sandbox mode and general chat)
  bot.on('message', (msg) => {
    // Skip if it's a command
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }
    
    messageHandler.handleTextMessage(msg);
  });
}

// ========================================
// Error Handling
// ========================================
if (bot) {
  bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error.code, error.message);
  });
}

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ========================================
// Graceful Shutdown
// ========================================
const gracefulShutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  if (bot) {
    bot.stopPolling();
  }
  db.close();
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('🚀 Markdown Trainer Bot is now running!');
console.log('📚 Ready to teach Markdown to users...');
