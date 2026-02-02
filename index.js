require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ActivityReporter = require('./activityReporter');

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
// Activity Reporter (optional)
// ========================================
const reporterMongoUri = process.env.ACTIVITY_MONGODB_URI;
const reporterServiceId = process.env.ACTIVITY_SERVICE_ID;
const reporterServiceName = process.env.ACTIVITY_SERVICE_NAME || 'MarkdownBot';
const reporter =
  reporterMongoUri && reporterServiceId
    ? new ActivityReporter(reporterMongoUri, reporterServiceId, reporterServiceName)
    : null;

const reportUserActivity = (userId) => {
  if (!reporter || !userId) return;
  try {
    reporter.reportActivity(userId);
  } catch (_) {
    // אל תפיל את הבוט
  }
};

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
// Maintenance Mode Middleware
// ========================================
const isMaintenanceMode = () => {
  return process.env.MAINTENANCE_MODE === 'true';
};

const isAdmin = (userId) => {
  const admins = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return admins.includes(String(userId));
};

const maintenanceMiddleware = async (msg, next) => {
  if (!isMaintenanceMode() || isAdmin(msg.from.id)) {
    // Not in maintenance or user is admin - continue
    return next();
  }

  // In maintenance mode and user is not admin - send friendly message
  await bot.sendMessage(msg.chat.id,
    '🔧 *הבוט במצב תחזוקה*\n\n' +
    'אנחנו עושים שדרוג מהיר לבוט 🚀\n\n' +
    'הכל יחזור לעבוד תוך כמה דקות.\n\n' +
    'תודה על הסבלנות! 😊',
    { parse_mode: 'Markdown' }
  );
  return false; // Block further processing
};

// ========================================
// Bot Event Listeners
// ========================================

if (bot && commandHandler && messageHandler) {
  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleStart(msg);
    }
  });

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleHelp(msg);
    }
  });

  // Handle /sandbox command
  bot.onText(/\/sandbox/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleSandbox(msg);
    }
  });

  // Handle /exit command (exit sandbox mode)
  bot.onText(/\/exit/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleExit(msg);
    }
  });

  // Handle /themes command (select sandbox theme)
  bot.onText(/\/themes/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleThemes(msg);
    }
  });

  // Handle /cheatsheet command
  bot.onText(/\/cheatsheet/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleCheatsheet(msg);
    }
  });

  // Handle /didyouknow command (quick tips carousel)
  bot.onText(/\/didyouknow/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleDidYouKnow(msg);
    }
  });

  // Handle /markdown_guide command (Telegram Markdown guide)
  bot.onText(/\/markdown_guide/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleMarkdownGuide(msg);
    }
  });

  // Handle /templates command
  bot.onText(/\/templates/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleTemplates(msg);
    }
  });

  // Handle /progress command (show user progress)
  bot.onText(/\/progress/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleProgress(msg);
    }
  });

  // Handle /reset_progress command (admin only)
  bot.onText(/\/reset_progress/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleResetProgress(msg);
    }
  });

  // Handle /statistics command (admin only)
  bot.onText(/\/statistics/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleStatistics(msg);
    }
  });

  // Handle /next command (next lesson)
  bot.onText(/\/next/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleNext(msg);
    }
  });

  // Handle /restart_lessons command (reset and start lessons again)
  bot.onText(/\/restart_lessons/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleRestartLessons(msg);
    }
  });

  // Handle /train command (focused training mode)
  bot.onText(/\/train/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleTrain(msg);
    }
  });

  // Handle /cancel_training command (exit training mode)
  bot.onText(/\/cancel_training/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleCancelTraining(msg);
    }
  });

  // Handle /submit_template command (submit community template)
  bot.onText(/\/submit_template/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleSubmitTemplate(msg);
    }
  });

  // Handle /cancel_submission command (cancel template submission)
  bot.onText(/\/cancel_submission/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleCancelSubmission(msg);
    }
  });

  // Handle /my_submissions command (view user's submissions)
  bot.onText(/\/my_submissions/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleMySubmissions(msg);
    }
  });

  // Handle /review_templates command (admin only)
  bot.onText(/\/review_templates/, async (msg) => {
    reportUserActivity(msg?.from?.id);
    if (await maintenanceMiddleware(msg, () => true)) {
      commandHandler.handleReviewTemplates(msg);
    }
  });

  // Handle callback queries (button clicks)
  bot.on('callback_query', async (query) => {
    reportUserActivity(query?.from?.id);
    if (await maintenanceMiddleware(query.message, () => true)) {
      messageHandler.handleCallbackQuery(query);
    }
  });

  // Handle all text messages (for sandbox mode and general chat)
  bot.on('message', async (msg) => {
    reportUserActivity(msg?.from?.id);
    // Skip if it's a command
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }

    if (await maintenanceMiddleware(msg, () => true)) {
      messageHandler.handleTextMessage(msg);
    }
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
