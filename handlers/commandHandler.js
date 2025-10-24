class CommandHandler {
  constructor(bot, db) {
    this.bot = bot;
    this.db = db;
  }

  // ========================================
  // /start - Welcome new users
  // ========================================
  async handleStart(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || '';
    const firstName = msg.from.first_name || '';
    const lastName = msg.from.last_name || '';
    const languageCode = msg.from.language_code || 'he';

    // Update last active
    this.db.updateLastActive(userId);

    // Check if user exists
    let user = this.db.getUser(userId);
    
    if (!user) {
      // New user - create record
      this.db.createUser(userId, username, firstName, lastName, languageCode);
      
      // Send welcome message for new users
      await this.sendWelcomeSequence(chatId, firstName);
    } else {
      // Existing user - send welcome back message
      const progress = this.db.getUserProgress(userId);
      
      await this.bot.sendMessage(chatId, 
        `שלום שוב ${firstName}! 👋\n\n` +
        `שמח לראות אותך חוזר/ת.\n\n` +
        `📊 הסטטיסטיקה שלך:\n` +
        `🎯 דרגה: ${progress.level}\n` +
        `⭐ ניקוד: ${progress.total_score}\n` +
        `📚 שיעורים שהושלמו: ${progress.lessons_completed}\n\n` +
        `מה תרצה לעשות?\n\n` +
        `/next - להמשיך לשיעור הבא\n` +
        `/progress - לראות את ההתקדמות שלך\n` +
        `/sandbox - לתרגל במעבדה\n` +
        `/cheatsheet - לראות מדריך מהיר\n` +
        `/help - לקבל עזרה`
      );
    }
  }

  async sendWelcomeSequence(chatId, firstName) {
    // Message 1: Welcome
    await this.bot.sendMessage(chatId,
      `היי ${firstName}, ברוכ/ה הבא/ה ל-Markdown Trainer! 🤖\n\n` +
      `אני הבוט שילמד אותך צעד אחר צעד איך לכתוב טקסטים יפים, מסודרים ומקצועיים באמצעות Markdown.\n\n` +
      `מה זה Markdown?\n` +
      `זו שפת סימון פשוטה שמאפשרת לך לעצב טקסט (כמו כותרות, רשימות והדגשות) באמצעות תווים פשוטים, בלי להסתבך עם תפריטים ועכבר.\n\n` +
      `כל יום אשלח לך טיפ קצר או אתגר קטן. מוכנ/ה להתחיל?`
    );

    await this.sleep(2000);

    // Message 2: Learning pace selection
    await this.bot.sendMessage(chatId,
      `👋 לפני שנתחיל, איך אתה רוצה ללמוד?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🐌 קצב רגוע (שיעור אחד ביום)', callback_data: 'pace_slow' }],
            [{ text: '🚶 קצב רגיל (2-3 ביום)', callback_data: 'pace_normal' }],
            [{ text: '🏃 קצב מהיר (כמה שרוצה)', callback_data: 'pace_fast' }]
          ]
        }
      }
    );
  }

  // ========================================
  // /help - Show help information
  // ========================================
  async handleHelp(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const helpText = `📚 *עזרה - Markdown Trainer Bot*\n\n` +
      `*פקודות זמינות:*\n\n` +
      `🎓 *למידה:*\n` +
      `/start - התחל מחדש\n` +
      `/next - עבור לשיעור הבא\n` +
      `/progress - הצג את ההתקדמות שלך\n\n` +
      `🛠️ *כלים:*\n` +
      `/sandbox - פתח מעבדת תרגול (Markdown → תמונה)\n` +
      `/cheatsheet - הצג מדריך מהיר\n` +
      `/exit - צא ממצב מעבדה\n\n` +
      `💡 *טיפים:*\n` +
      `• השתמש במעבדה (/sandbox) כדי לראות איך הקוד שלך נראה\n` +
      `• תרגל כל יום כדי לשפר את הכישורים שלך\n` +
      `• אם תקעת, תמיד אפשר לחזור על שיעורים קודמים\n\n` +
      `שאלות? צור קשר עם היוצר: @amirbiron`;

    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  // ========================================
  // /sandbox - Enter sandbox mode
  // ========================================
  async handleSandbox(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    // Set user to sandbox mode
    this.db.setUserMode(userId, 'sandbox');

    await this.bot.sendMessage(chatId,
      `🧪 *מצב מעבדה מופעל!*\n\n` +
      `שלח לי כל טקסט ב-Markdown, ואני אחזיר לך תמונה של איך הוא נראה מעוצב.\n\n` +
      `*דוגמה:*\n` +
      `\`\`\`\n` +
      `# כותרת ראשית\n` +
      `## כותרת משנה\n\n` +
      `זהו טקסט **מודגש** וזה טקסט *נטוי*.\n\n` +
      `- פריט ראשון\n` +
      `- פריט שני\n` +
      `\`\`\`\n\n` +
      `💡 *טיפ:* כדי לצאת מהמעבדה, שלח /exit`,
      { parse_mode: 'Markdown' }
    );
  }

  // ========================================
  // /exit - Exit sandbox mode
  // ========================================
  async handleExit(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const mode = this.db.getUserMode(userId);

    if (mode.current_mode === 'sandbox') {
      this.db.clearUserMode(userId);
      await this.bot.sendMessage(chatId,
        `✅ יצאת ממצב המעבדה.\n\n` +
        `אפשר להמשיך ללמוד עם /next או לראות התקדמות עם /progress`
      );
    } else {
      await this.bot.sendMessage(chatId,
        `אתה לא במצב מעבדה כרגע.\n\n` +
        `כדי להיכנס למעבדה, שלח /sandbox`
      );
    }
  }

  // ========================================
  // /cheatsheet - Show quick reference
  // ========================================
  async handleCheatsheet(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    await this.bot.sendMessage(chatId,
      `📋 *מדריך מהיר ל-Markdown*`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📝 כותרות', callback_data: 'cheat_headers' },
              { text: '✨ הדגשות', callback_data: 'cheat_emphasis' }
            ],
            [
              { text: '📋 רשימות', callback_data: 'cheat_lists' },
              { text: '🔗 קישורים', callback_data: 'cheat_links' }
            ],
            [
              { text: '💬 ציטוטים', callback_data: 'cheat_quotes' },
              { text: '💻 קוד', callback_data: 'cheat_code' }
            ],
            [
              { text: '🖼️ תמונות', callback_data: 'cheat_images' },
              { text: '📊 טבלאות', callback_data: 'cheat_tables' }
            ],
            [
              { text: '✅ משימות', callback_data: 'cheat_tasks' },
              { text: '➖ קווים', callback_data: 'cheat_lines' }
            ]
          ]
        }
      }
    );
  }

  // ========================================
  // /progress - Show user progress
  // ========================================
  async handleProgress(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const stats = this.db.getUserStats(userId);
    const progress = stats.progress;

    if (!progress) {
      await this.bot.sendMessage(chatId, 'לא נמצא מידע על ההתקדמות שלך. נסה /start');
      return;
    }

    const totalLessons = 15; // Total number of lessons
    const progressPercentage = ((progress.lessons_completed / totalLessons) * 100).toFixed(1);
    
    // Create progress bar
    const barLength = 10;
    const filledBars = Math.floor((progress.lessons_completed / totalLessons) * barLength);
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);

    let levelEmoji = '🌱';
    if (progress.level === 'Markdown Apprentice') levelEmoji = '📚';
    if (progress.level === 'Markdown Pro') levelEmoji = '⭐';
    if (progress.level === 'Markdown Master') levelEmoji = '🏆';

    const message = 
      `📊 *ההתקדמות שלך*\n\n` +
      `${levelEmoji} *דרגה:* ${progress.level}\n` +
      `⭐ *ניקוד כולל:* ${progress.total_score}\n\n` +
      `📈 *התקדמות בשיעורים:*\n` +
      `${progressBar} ${progressPercentage}%\n` +
      `${progress.lessons_completed}/${totalLessons} שיעורים הושלמו\n\n` +
      `✅ *תשובות נכונות:* ${progress.correct_answers}\n` +
      `❌ *תשובות שגויות:* ${progress.wrong_answers}\n` +
      `🎯 *דיוק:* ${stats.accuracy}%\n\n` +
      `⏱️ *קצב למידה:* ${this.getPaceText(progress.learning_pace)}\n\n` +
      `💪 המשך כך! כל שיעור מקרב אותך לשליטה מלאה ב-Markdown.`;

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    // Show weak topics if any
    const weakTopics = this.db.getWeakTopics(userId, 3);
    if (weakTopics && weakTopics.length > 0) {
      const topicsText = weakTopics
        .map((t, i) => `${i + 1}. ${t.topic} (${(t.error_rate * 100).toFixed(0)}% טעויות)`)
        .join('\n');

      await this.bot.sendMessage(chatId,
        `💡 *נושאים לחזרה:*\n${topicsText}\n\n` +
        `מומלץ לתרגל נושאים אלו במעבדה (/sandbox)`
      , { parse_mode: 'Markdown' });
    }
  }

  // ========================================
  // /next - Move to next lesson
  // ========================================
  async handleNext(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const progress = this.db.getUserProgress(userId);
    
    if (!progress) {
      await this.bot.sendMessage(chatId, 'נסה קודם /start');
      return;
    }

    const nextLessonId = progress.current_lesson + 1;
    
    // Check if there are more lessons
    const totalLessons = 15; // We have 15 lessons total
    
    if (nextLessonId > totalLessons) {
      await this.bot.sendMessage(chatId,
        `🎉 *מזל טוב!*\n\n` +
        `סיימת את כל השיעורים!\n\n` +
        `אתה עכשיו אשף Markdown מוסמך! 🏆\n\n` +
        `המשך לתרגל במעבדה (/sandbox) או עזור לחברים ללמוד Markdown.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Load and send the next lesson
    const LessonsData = require('../lessons/lessonsData');
    const lesson = LessonsData.getLesson(nextLessonId);

    if (!lesson) {
      await this.bot.sendMessage(chatId, 'שגיאה בטעינת השיעור. נסה שוב מאוחר יותר.');
      return;
    }

    // Update current lesson
    this.db.updateCurrentLesson(userId, nextLessonId);

    // Send lesson content
    await this.sendLesson(chatId, userId, lesson);
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
  // Helper functions
  // ========================================

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getPaceText(pace) {
    const paceTexts = {
      slow: '🐌 רגוע (שיעור אחד ביום)',
      normal: '🚶 רגיל (2-3 ביום)',
      fast: '🏃 מהיר (כמה שרוצה)'
    };
    return paceTexts[pace] || paceTexts.normal;
  }
}

module.exports = CommandHandler;
