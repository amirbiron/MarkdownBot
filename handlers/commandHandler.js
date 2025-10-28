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
        `השתמש בכפתורים למטה לניווט מהיר! 👇`,
        { reply_markup: this.getMainKeyboard() }
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
      `מוכנ/ה להתחיל? השתמש בכפתורים למטה או שלח /next לשיעור הראשון! 🚀`,
      { reply_markup: this.getMainKeyboard() }
    );
  }

  // ========================================
  // /help - Show help information
  // ========================================
  async handleHelp(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const helpText =
      `📚 *עזרה - Markdown Trainer Bot*\n\n` +
      `*פקודות זמינות:*\n\n` +
      `🎓 *למידה:*\n` +
      `/start - התחל מחדש\n` +
      `/next - עבור לשיעור הבא\n` +
      `/progress - הצג את ההתקדמות שלך\n\n` +
      `🎯 *אימון ממוקד:*\n` +
      `/train - התחל אימון בנושא ספציפי\n` +
      `/cancel_training - בטל אימון פעיל\n\n` +
      `🛠️ *כלים:*\n` +
      `/sandbox - פתח מעבדת תרגול (Markdown → תמונה)\n` +
      `/themes - בחר ערכת נושא לארגז החול\n` +
      `/templates - תבניות Markdown מוכנות לשימוש\n` +
      `/cheatsheet - הצג מדריך מהיר\n` +
      `/exit - צא ממצב מעבדה\n\n` +
      `💡 *טיפים:*\n` +
      `• השתמש באימון ממוקד (/train) לתרגל נושאים ספציפיים\n` +
      `• השתמש במעבדה (/sandbox) כדי לראות איך הקוד שלך נראה\n` +
      `• השתמש בתבניות (/templates) לקבלת נקודת פתיחה מקצועית\n` +
      `• תרגל כל יום כדי לשפר את הכישורים שלך\n\n` +
      `שאלות? צור קשר עם היוצר: @moominAmir`;

    try {
      await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending help message:', error);
      // Try without markdown parsing if it fails
      await this.bot.sendMessage(chatId, helpText.replace(/\*/g, ''));
    }
  }

  // ========================================
  // /themes - Select sandbox theme
  // ========================================
  async handleThemes(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    // Get current theme
    const currentTheme = this.db.getSandboxTheme(userId);
    const themeEmojis = {
      'github-light': '☀️',
      'github-dark': '🌙',
      'light-mode': '⚪',
      'dark-mode': '⚫',
      'notion': '📝'
    };

    await this.bot.sendMessage(chatId,
      `🎨 *בחירת ערכת נושא לארגז החול*\n\n` +
      `ערכת הנושא הנוכחית: ${themeEmojis[currentTheme] || '☀️'} ${this.getThemeName(currentTheme)}\n\n` +
      `בחר ערכת נושא חדשה:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '☀️ GitHub Light', callback_data: 'theme_github-light' },
              { text: '🌙 GitHub Dark', callback_data: 'theme_github-dark' }
            ],
            [
              { text: '⚪ Light Mode', callback_data: 'theme_light-mode' },
              { text: '⚫ Dark Mode', callback_data: 'theme_dark-mode' }
            ],
            [
              { text: '📝 Notion Style', callback_data: 'theme_notion' }
            ]
          ]
        }
      }
    );
  }

  getThemeName(themeId) {
    const names = {
      'github-light': 'GitHub Light',
      'github-dark': 'GitHub Dark',
      'light-mode': 'Light Mode',
      'dark-mode': 'Dark Mode',
      'notion': 'Notion Style'
    };
    return names[themeId] || 'GitHub Light';
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
      `💡 *טיפים:*\n` +
      `• כדי לשנות ערכת נושא, שלח /themes\n` +
      `• כדי לצאת מהמעבדה, שלח /exit`,
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
  // /templates - Show markdown templates library
  // ========================================
  async handleTemplates(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    await this.bot.sendMessage(chatId,
      `📚 *ספריית תבניות Markdown*\n\n` +
      `בחר תבנית מוכנה לשימוש:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 PRD - מסמך דרישות', callback_data: 'template_prd' }
            ],
            [
              { text: '📖 README - תיעוד פרויקט', callback_data: 'template_readme' }
            ],
            [
              { text: '🔍 Post Mortem - ניתוח תקלה', callback_data: 'template_postmortem' }
            ],
            [
              { text: '✍️ Blog Post - מאמר טכני', callback_data: 'template_blog' }
            ],
            [
              { text: '📝 Meeting Notes - פרוטוקול', callback_data: 'template_meeting' }
            ],
            [
              { text: '📄 One-Pager - מצגת רעיון', callback_data: 'template_onepager' }
            ],
            [
              { text: '🔌 API Reference - תיעוד API', callback_data: 'template_api' }
            ],
            [
              { text: '✅ QA Test Plan - תוכנית בדיקות', callback_data: 'template_test-plan' }
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
    const totalLessons = 40; // We have 40 lessons total (15 lessons + 25 tips)

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
    try {
      // Send lesson messages
      for (let i = 0; i < lesson.messages.length; i++) {
        const message = lesson.messages[i];
        console.log(`Sending lesson ${lesson.id} message ${i+1}/${lesson.messages.length} to user ${userId}`);
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        await this.sleep(1500);
      }

      // Send quiz if exists
      if (lesson.quiz) {
        console.log(`Sending lesson ${lesson.id} quiz to user ${userId}`);
        await this.sleep(1000);
        await this.bot.sendMessage(chatId, lesson.quiz.question, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: lesson.quiz.options.map((option, index) => [
              { text: option.text, callback_data: `answer_${lesson.id}_${index}` }
            ])
          }
        });
        console.log(`✅ Lesson ${lesson.id} sent successfully to user ${userId}`);
      } else {
        // This is a tip lesson (no quiz) - award points automatically
        console.log(`ℹ️ Lesson ${lesson.id} has no quiz (tip lesson) - awarding points automatically`);
        const points = lesson.points || 5;
        this.db.incrementScore(userId, points);
        this.db.incrementLessonsCompleted(userId);

        await this.sleep(1000);
        await this.bot.sendMessage(chatId,
          `✨ הוספתי לך ${points} נקודות!\n\n` +
          `מוכן/ה לטיפ הבא? שלח /next! 🚀`,
          { parse_mode: 'Markdown' }
        );
        console.log(`✅ Tip ${lesson.id} sent successfully to user ${userId}`);
      }
    } catch (error) {
      console.error(`❌ Error sending lesson ${lesson.id} to user ${userId}:`, error);
      await this.bot.sendMessage(chatId,
        '❌ אופס! משהו השתבש בשליחת השיעור.\n\n' +
        'נסה שוב עם /next או שלח /help לעזרה.'
      );
    }
  }

  // ========================================
  // /train - Start focused training mode
  // ========================================
  async handleTrain(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    // Check if user already in training mode
    const currentMode = this.db.getUserMode(userId);
    if (currentMode.current_mode === 'training') {
      await this.bot.sendMessage(chatId,
        '⚠️ אתה כבר באמצע אימון!\n\n' +
        'סיים את האימון הנוכחי או שלח /cancel_training לביטול.'
      );
      return;
    }

    // Show topic selection
    await this.bot.sendMessage(chatId,
      '🎯 *מצב אימון ממוקד*\n\n' +
      'בחר נושא שתרצה לתרגל:\n' +
      'תקבל 3-5 אתגרים ברמות קושי הולכות וגדלות עם משוב מיידי.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✨ עיצוב טקסט', callback_data: 'train_topic_text-formatting' }],
            [{ text: '📊 טבלאות', callback_data: 'train_topic_tables' }],
            [{ text: '🔗 קישורים ותמונות', callback_data: 'train_topic_links-images' }],
            [{ text: '📋 רשימות מתקדמות', callback_data: 'train_topic_advanced-lists' }],
            [{ text: '🐛 איתור באגים', callback_data: 'train_topic_bug-detection' }],
            [{ text: '📈 דיאגרמות Mermaid', callback_data: 'train_topic_mermaid' }]
          ]
        }
      }
    );
  }

  // ========================================
  // /cancel_training - Cancel current training session
  // ========================================
  async handleCancelTraining(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const mode = this.db.getUserMode(userId);

    if (mode.current_mode !== 'training') {
      await this.bot.sendMessage(chatId,
        'אתה לא באימון כרגע.\n\n' +
        'כדי להתחיל אימון, שלח /train'
      );
      return;
    }

    // Get training session and cancel it
    const session = this.db.getActiveTrainingSession(userId);
    if (session) {
      this.db.cancelTrainingSession(session.id);
    }

    // Clear user mode
    this.db.clearUserMode(userId);

    await this.bot.sendMessage(chatId,
      '✅ האימון בוטל בהצלחה.\n\n' +
      'אפשר להתחיל אימון חדש עם /train\n' +
      'או להמשיך בשיעורים עם /next'
    );
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

  // ========================================
  // Get main keyboard for easy access
  // ========================================
  getMainKeyboard() {
    return {
      keyboard: [
        [{ text: '📚 שיעור הבא' }, { text: '🧪 מעבדה' }],
        [{ text: '🎯 אימון' }, { text: '📊 התקדמות' }],
        [{ text: '📋 מדריך מהיר' }, { text: '📚 תבניות' }],
        [{ text: '❓ עזרה' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };
  }
}

module.exports = CommandHandler;
