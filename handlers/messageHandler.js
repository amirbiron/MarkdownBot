const MarkdownRenderer = require('../services/markdownRenderer');

class MessageHandler {
  constructor(bot, db) {
    this.bot = bot;
    this.db = db;
    this.renderer = new MarkdownRenderer();
  }

  // ========================================
  // Handle Text Messages
  // ========================================
  async handleTextMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text) return;

    this.db.updateLastActive(userId);

    // Get user's current mode
    const mode = this.db.getUserMode(userId);

    if (mode.current_mode === 'sandbox') {
      // User is in sandbox mode - render their markdown
      await this.handleSandboxInput(chatId, userId, text);
    } else {
      // Normal conversation mode
      await this.handleNormalMessage(chatId, userId, text);
    }
  }

  // ========================================
  // Handle Sandbox Input
  // ========================================
  async handleSandboxInput(chatId, userId, markdownText) {
    try {
      // Send "processing" message
      const processingMsg = await this.bot.sendMessage(chatId, 
        '⏳ מעבד את הקוד שלך...'
      );

      // Render markdown to image
      const imagePath = await this.renderer.renderMarkdown(markdownText, userId);

      // Delete processing message
      await this.bot.deleteMessage(chatId, processingMsg.message_id);

      // Send rendered image
      await this.bot.sendPhoto(chatId, imagePath, {
        caption: '✅ הנה התוצאה המעוצבת של הקוד שלך!\n\n💡 שלח עוד קוד או /exit לצאת מהמעבדה.'
      });

    } catch (error) {
      console.error('Error rendering markdown:', error);
      
      await this.bot.sendMessage(chatId,
        '❌ אופס! משהו השתבש בעיבוד הקוד.\n\n' +
        'ייתכן שהקוד ארוך מדי או מכיל תווים לא נתמכים.\n\n' +
        'נסה שוב או שלח /exit לצאת מהמעבדה.'
      );
    }
  }

  // ========================================
  // Handle Normal Messages (not in sandbox)
  // ========================================
  async handleNormalMessage(chatId, userId, text) {
    // Friendly responses for common queries
    const lowerText = text.toLowerCase();

    if (lowerText.includes('תודה') || lowerText.includes('תנקס')) {
      await this.bot.sendMessage(chatId, 'בכיף! 😊 אם צריך עזרה, תמיד אפשר לשלוח /help');
    } else if (lowerText.includes('שלום') || lowerText.includes('היי') || lowerText.includes('הי')) {
      await this.bot.sendMessage(chatId, 'שלום! 👋 מה נלמד היום?\n\nשלח /next להמשיך בשיעורים או /help לעזרה.');
    } else {
      // Default response
      await this.bot.sendMessage(chatId,
        'לא הבנתי את הבקשה. 🤔\n\n' +
        'אתה יכול:\n' +
        '• /next - להמשיך בשיעורים\n' +
        '• /sandbox - לתרגל קוד Markdown\n' +
        '• /help - לקבל עזרה'
      );
    }
  }

  // ========================================
  // Handle Callback Queries (Button Clicks)
  // ========================================
  async handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const messageId = query.message.message_id;

    this.db.updateLastActive(userId);

    // Answer callback to remove loading state
    await this.bot.answerCallbackQuery(query.id);

    // Route based on callback data prefix
    if (data.startsWith('pace_')) {
      await this.handlePaceSelection(chatId, userId, data, messageId);
    } else if (data.startsWith('answer_')) {
      await this.handleQuizAnswer(chatId, userId, data, messageId);
    } else if (data.startsWith('cheat_')) {
      await this.handleCheatsheetTopic(chatId, userId, data, query.message.message_id);
    }
  }

  // ========================================
  // Handle Learning Pace Selection
  // ========================================
  async handlePaceSelection(chatId, userId, data, messageId) {
    const pace = data.replace('pace_', '');
    
    // Update user's learning pace
    this.db.updateLearningPace(userId, pace);

    // Remove the keyboard
    await this.bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: chatId, message_id: messageId }
    );

    let paceText = '';
    if (pace === 'slow') paceText = 'קצב רגוע - שיעור אחד ביום';
    if (pace === 'normal') paceText = 'קצב רגיל - 2-3 שיעורים ביום';
    if (pace === 'fast') paceText = 'קצב מהיר - כמה שתרצה';

    await this.bot.sendMessage(chatId,
      `מעולה! בחרת: ${paceText} 🎯\n\n` +
      `בוא נתחיל מהשיעור הראשון!`
    );

    await this.sleep(1500);

    // Load and send first lesson
    const LessonsData = require('../lessons/lessonsData');
    const firstLesson = LessonsData.getLesson(1);
    
    if (firstLesson) {
      this.db.updateCurrentLesson(userId, 1);
      await this.sendLesson(chatId, userId, firstLesson);
    }
  }

  // ========================================
  // Handle Quiz Answers
  // ========================================
  async handleQuizAnswer(chatId, userId, data, messageId) {
    // Parse answer data: answer_lessonId_optionIndex
    const parts = data.split('_');
    const lessonId = parseInt(parts[1]);
    const optionIndex = parseInt(parts[2]);

    // Load lesson to check correct answer
    const LessonsData = require('../lessons/lessonsData');
    const lesson = LessonsData.getLesson(lessonId);

    if (!lesson || !lesson.quiz) {
      await this.bot.sendMessage(chatId, 'שגיאה בטעינת השאלה.');
      return;
    }

    const selectedOption = lesson.quiz.options[optionIndex];
    const isCorrect = selectedOption.correct;

    // Remove the keyboard
    await this.bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: chatId, message_id: messageId }
    );

    // Record answer in database
    this.db.recordAnswer(userId, isCorrect);
    this.db.addLessonHistory(userId, lessonId, isCorrect, selectedOption.text);
    
    // Update topic performance if lesson has a topic
    if (lesson.topic) {
      this.db.updateTopicPerformance(userId, lesson.topic, isCorrect);
    }

    if (isCorrect) {
      // Correct answer!
      const points = lesson.points || 10;
      this.db.incrementScore(userId, points);
      this.db.incrementLessonsCompleted(userId);

      await this.bot.sendMessage(chatId,
        `✅ ${lesson.quiz.correctFeedback}\n\n` +
        `🎉 הוספתי לך ${points} נקודות!`
      );

      // Check if user leveled up
      await this.checkAndUpdateLevel(chatId, userId);

      await this.sleep(2000);

      // Prompt for next lesson
      await this.bot.sendMessage(chatId,
        'מוכן/ה להמשיך? שלח /next לשיעור הבא! 🚀'
      );

    } else {
      // Wrong answer
      await this.bot.sendMessage(chatId,
        `❌ ${lesson.quiz.wrongFeedback}\n\n` +
        `לא נורא, ככה לומדים! 💪\n\n` +
        `אפשר לנסות שוב עם /next או לתרגל במעבדה עם /sandbox`
      );
    }
  }

  // ========================================
  // Handle Cheatsheet Topic Selection
  // ========================================
  async handleCheatsheetTopic(chatId, userId, data, messageId) {
    const topic = data.replace('cheat_', '');

    const cheatsheets = {
      headers: {
        title: '📝 כותרות',
        content: 
          '*כותרות (Headers):*\n\n' +
          '`# כותרת רמה 1`\n' +
          '`## כותרת רמה 2`\n' +
          '`### כותרת רמה 3`\n' +
          '`#### כותרת רמה 4`\n\n' +
          '💡 חשוב: רווח אחרי הסולמיות!'
      },
      emphasis: {
        title: '✨ הדגשות',
        content:
          '*הדגשות:*\n\n' +
          '`**טקסט מודגש**` → *טקסט מודגש*\n' +
          '`*טקסט נטוי*` → _טקסט נטוי_\n' +
          '`***מודגש ונטוי***` → *מודגש ונטוי*\n' +
          '`~~טקסט מחוק~~` → ~טקסט מחוק~'
      },
      lists: {
        title: '📋 רשימות',
        content:
          '*רשימות:*\n\n' +
          '*רשימה לא ממוספרת:*\n' +
          '```\n' +
          '- פריט 1\n' +
          '- פריט 2\n' +
          '  - תת פריט\n' +
          '```\n\n' +
          '*רשימה ממוספרת:*\n' +
          '```\n' +
          '1. פריט ראשון\n' +
          '2. פריט שני\n' +
          '```'
      },
      links: {
        title: '🔗 קישורים',
        content:
          '*קישורים:*\n\n' +
          '`[טקסט לתצוגה](https://example.com)`\n\n' +
          '*קישור ישיר:*\n' +
          '`<https://example.com>`\n\n' +
          '*קישור הפניה:*\n' +
          '```\n' +
          '[טקסט][ref]\n' +
          '[ref]: https://example.com\n' +
          '```'
      },
      quotes: {
        title: '💬 ציטוטים',
        content:
          '*ציטוטים:*\n\n' +
          '`> זהו ציטוט`\n\n' +
          '*ציטוט מקונן:*\n' +
          '```\n' +
          '> ציטוט ראשי\n' +
          '>> ציטוט משני\n' +
          '```'
      },
      code: {
        title: '💻 קוד',
        content:
          '*קוד:*\n\n' +
          '*קוד בשורה:*\n' +
          '\\`code here\\`\n\n' +
          '*בלוק קוד:*\n' +
          '\\`\\`\\`\n' +
          'function hello() {\n' +
          '  console.log("Hello!");\n' +
          '}\n' +
          '\\`\\`\\`'
      },
      images: {
        title: '🖼️ תמונות',
        content:
          '*תמונות:*\n\n' +
          '`![תיאור התמונה](https://example.com/image.jpg)`\n\n' +
          '💡 כמו קישור, רק עם ! בהתחלה'
      },
      tables: {
        title: '📊 טבלאות',
        content:
          '*טבלאות:*\n\n' +
          '```\n' +
          '| עמודה 1 | עמודה 2 |\n' +
          '|---------|----------|\n' +
          '| תא 1    | תא 2     |\n' +
          '```\n\n' +
          '*יישור:*\n' +
          '`:---` שמאל\n' +
          '`:---:` מרכז\n' +
          '`---:` ימין'
      },
      tasks: {
        title: '✅ רשימות משימות',
        content:
          '*רשימות משימות:*\n\n' +
          '```\n' +
          '- [ ] משימה פתוחה\n' +
          '- [x] משימה שבוצעה\n' +
          '```'
      },
      lines: {
        title: '➖ קווים מפרידים',
        content:
          '*קווים מפרידים:*\n\n' +
          '`---` או `***` או `___`\n\n' +
          'כל אחד מהם יוצר קו אופקי'
      }
    };

    const sheet = cheatsheets[topic];

    if (sheet) {
      await this.bot.sendMessage(chatId, sheet.content, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ חזרה למדריך', callback_data: 'back_to_cheatsheet' }]
          ]
        }
      });
    }
  }

  // ========================================
  // Check and Update User Level
  // ========================================
  async checkAndUpdateLevel(chatId, userId) {
    const progress = this.db.getUserProgress(userId);
    const completedLessons = progress.lessons_completed;
    let newLevel = null;
    let levelEmoji = '';

    // Define level thresholds
    if (completedLessons >= 12 && progress.level !== 'Markdown Master') {
      newLevel = 'Markdown Master';
      levelEmoji = '🏆';
    } else if (completedLessons >= 8 && progress.level === 'Markdown Apprentice') {
      newLevel = 'Markdown Pro';
      levelEmoji = '⭐';
    } else if (completedLessons >= 4 && progress.level === 'Beginner') {
      newLevel = 'Markdown Apprentice';
      levelEmoji = '📚';
    }

    if (newLevel) {
      this.db.updateLevel(userId, newLevel);
      
      await this.sleep(1000);
      
      await this.bot.sendMessage(chatId,
        `${levelEmoji} *עלית דרגה!* ${levelEmoji}\n\n` +
        `הדרגה החדשה שלך: *${newLevel}*\n\n` +
        `כל הכבוד על ההתקדמות! 🎉`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  // ========================================
  // Helper: Send lesson to user
  // ========================================
  async sendLesson(chatId, userId, lesson) {
    // Send lesson messages
    for (const message of lesson.messages) {
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      await this.sleep(1500);
    }

    // Send quiz if exists
    if (lesson.quiz) {
      await this.sleep(1000);
      await this.bot.sendMessage(chatId, lesson.quiz.question, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: lesson.quiz.options.map((option, index) => [
            { text: option.text, callback_data: `answer_${lesson.id}_${index}` }
          ])
        }
      });
    }
  }

  // ========================================
  // Helper Functions
  // ========================================
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MessageHandler;
