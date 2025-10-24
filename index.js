require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const Database = require('./database/db');
const CommandHandler = require('./handlers/commandHandler');
const MessageHandler = require('./handlers/messageHandler');

// ========================================
// Bot Initialization
// ========================================
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// ========================================
// Express Server (for Render.com health check)
// ========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Markdown Trainer Bot is running!');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// ========================================
// Database Initialization
// ========================================
const db = new Database();
console.log('✅ Database initialized');

// ========================================
// Initialize Handlers
// ========================================
const commandHandler = new CommandHandler(bot, db);
const messageHandler = new MessageHandler(bot, db);

// ========================================
// Bot Event Listeners
// ========================================

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

// Handle /cheatsheet command
bot.onText(/\/cheatsheet/, (msg) => {
  commandHandler.handleCheatsheet(msg);
});

// Handle /progress command (show user progress)
bot.onText(/\/progress/, (msg) => {
  commandHandler.handleProgress(msg);
});

// Handle /next command (next lesson)
bot.onText(/\/next/, (msg) => {
  commandHandler.handleNext(msg);
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

// ========================================
// Error Handling
// ========================================
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.code, error.message);
});

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
  
  bot.stopPolling();
  db.close();
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('🚀 Markdown Trainer Bot is now running!');
console.log('📚 Ready to teach Markdown to users...');
