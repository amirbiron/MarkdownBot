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

    let helpText =
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
      `/markdown_guide - מדריך Markdown לטלגרם\n` +
      `/exit - צא ממצב מעבדה\n\n` +
      `💡 *טיפים:*\n` +
      `• השתמש באימון ממוקד (/train) לתרגל נושאים ספציפיים\n` +
      `• השתמש במעבדה (/sandbox) כדי לראות איך הקוד שלך נראה\n` +
      `• השתמש בתבניות (/templates) לקבלת נקודת פתיחה מקצועית\n` +
      `• תרגל כל יום כדי לשפר את הכישורים שלך`;

    if (this.isAdmin(userId)) {
      helpText += `\n\n🧰 *אדמין:*\n/reset_progress - אפס התקדמות (כדי לאפס משתמש אחר, שלח כ-reply)\n/statistics - הצג סטטיסטיקות משתמשים`;
    }

    helpText += `\n\nשאלות? צור קשר עם היוצר: @moominAmir`;

    try {
      await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending help message:', error);
      // Try without markdown parsing if it fails
      await this.bot.sendMessage(chatId, helpText.replace(/\*/g, ''));
    }
  }

  // ========================================
  // /reset_progress - Admin only: reset a user's progress
  // ========================================
  async handleResetProgress(msg) {
    const chatId = msg.chat.id;
    const fromUserId = msg.from.id;

    if (!this.isAdmin(fromUserId)) {
      await this.bot.sendMessage(chatId, '⛔ פקודה זו זמינה רק לאדמין.');
      return;
    }

    // If used as reply, target is the replied user's id; otherwise self
    const replyTo = msg.reply_to_message;
    const targetUserId = replyTo?.from?.id || fromUserId;

    const user = this.db.getUser(targetUserId);
    if (!user) {
      await this.bot.sendMessage(chatId, '❌ משתמש לא נמצא במסד הנתונים.');
      return;
    }

    try {
      this.db.resetUserProgress(targetUserId);
      await this.bot.sendMessage(chatId, `✅ ההתקדמות אופסה עבור משתמש ${targetUserId}.\nאפשר להתחיל מחדש עם /next`);
    } catch (e) {
      console.error('Error resetting progress:', e);
      await this.bot.sendMessage(chatId, '❌ שגיאה באיפוס ההתקדמות.');
    }
  }

  // Check admin by env var list (comma-separated IDs)
  isAdmin(userId) {
    const admins = (process.env.ADMIN_USER_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    return admins.includes(String(userId));
  }

  // ========================================
  // /statistics - Admin only: show user activity statistics
  // ========================================
  async handleStatistics(msg) {
    const chatId = msg.chat.id;
    const fromUserId = msg.from.id;

    if (!this.isAdmin(fromUserId)) {
      await this.bot.sendMessage(chatId, '⛔ פקודה זו זמינה רק לאדמין.');
      return;
    }

    try {
      const days = 7; // Last 7 days
      const totalUsers = this.db.getTotalUsers();
      const activeUsers = this.db.getActiveUsers(days);
      const userStats = this.db.getUserActivityStats(days);

      // Build header message
      let headerText = `📊 *סטטיסטיקות משתמשים - ${days} ימים אחרונים*\n\n`;
      headerText += `👥 סה"כ משתמשים במערכת: ${totalUsers}\n`;
      headerText += `✅ משתמשים פעילים (${days} ימים): ${activeUsers}\n`;
      headerText += `📈 אחוז פעילים: ${totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%\n\n`;

      if (userStats.length === 0) {
        headerText += '❌ אין משתמשים פעילים בתקופה זו.';
        await this.bot.sendMessage(chatId, headerText, { parse_mode: 'Markdown' });
        return;
      }

      // Send header
      headerText += `*פעילות משתמשים (${userStats.length} משתמשים):*\n`;
      headerText += `━━━━━━━━━━━━━━━━━━━━`;
      await this.bot.sendMessage(chatId, headerText, { parse_mode: 'Markdown' });

      // Split user stats into chunks to avoid message length limit
      const maxChunkSize = 3500; // Leave room for formatting
      let currentChunk = '';
      let messageCount = 0;

      for (let index = 0; index < userStats.length; index++) {
        const user = userStats[index];
        const name = user.first_name || user.username || `User ${user.user_id}`;
        const totalActions = (user.recent_lessons || 0) + (user.recent_training_sessions || 0);
        const totalAnswers = (user.correct_answers || 0) + (user.wrong_answers || 0);
        const accuracy = totalAnswers > 0 ? ((user.correct_answers / totalAnswers) * 100).toFixed(1) : 0;

        const userText = `\n${index + 1}. *${name}* (ID: ${user.user_id})\n` +
          `   📚 שיעורים: ${user.recent_lessons || 0} | 🎯 אימונים: ${user.recent_training_sessions || 0}\n` +
          `   💯 סה"כ פעולות: ${totalActions}\n` +
          `   ⭐ רמה: ${user.level || 'Beginner'} | נקודות: ${user.total_score || 0}\n` +
          `   ✅ דיוק כללי: ${accuracy}%\n` +
          `   🕐 פעילות אחרונה: ${this.formatDate(user.last_active)}\n`;

        // Check if adding this user would exceed the limit
        if (currentChunk.length + userText.length > maxChunkSize) {
          // Send current chunk
          await this.bot.sendMessage(chatId, currentChunk, { parse_mode: 'Markdown' });
          await this.sleep(500); // Small delay between messages
          currentChunk = userText;
          messageCount++;
        } else {
          currentChunk += userText;
        }
      }

      // Send remaining chunk if any
      if (currentChunk.length > 0) {
        await this.bot.sendMessage(chatId, currentChunk, { parse_mode: 'Markdown' });
      }

    } catch (e) {
      console.error('Error getting statistics:', e);
      await this.bot.sendMessage(chatId, '❌ שגיאה בשליפת הסטטיסטיקות.');
    }
  }

  // Helper function to format date
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'כרגע';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return date.toLocaleDateString('he-IL');
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
  // /markdown_guide - Show Telegram Markdown formatting guide for developers
  // ========================================
  async handleMarkdownGuide(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    // Build the complete developer guide as a single message with MarkdownV2
    const guide = this.buildTelegramDevGuide();

    try {
      await this.bot.sendMessage(chatId, guide, { parse_mode: 'MarkdownV2' });
    } catch (error) {
      console.error('Error sending Telegram dev guide:', error);
      // Fallback: try without parse mode
      await this.bot.sendMessage(chatId,
        'מדריך למפתחים - Markdown בטלגרם\n\n' +
        'מצטער, אירעה שגיאה בשליחת המדריך המעוצב. אנא נסה שוב מאוחר יותר.'
      );
    }
  }

  // Helper function to build the Telegram developer guide with proper MarkdownV2 escaping
  buildTelegramDevGuide() {
    return `🚀 *מדריך למפתחים \\- Markdown בטלגרם*

*✅ מתאים למפתחים שבונים בוטים*
*❌ לא מיועד למשתמשי קצה רגילים*

━━━━━━━━━━━━━━━━━━━━

✅ *למה אתה צריך את זה?*

Markdown רגיל בטלגרם לא מספיק\\. ה\\-Bot API משתמש ב\\-*MarkdownV2* \\- עם טעם משלו, וכל טעות קטנה \\= ההודעה לא נשלחת\\.

לפעמים אפילו המחרוזת הכי תמימה:

\`\`\`
שלום עולם.
\`\`\`

גורמת ל\\-400: Bad Request\\.
למה? בגלל הנקודה\\.

━━━━━━━━━━━━━━━━━━━━

✅ *תווים מסוכנים*

כל התווים האלו _חייבים escape_:

\`\`\`
_ * [ ] ( ) ~ \` > # + - = | { } . !
\`\`\`

כלומר: כששולחים טקסט מהבוט כל תו כזה צריך backslash\\.

━━━━━━━━━━━━━━━━━━━━

✅ *דוגמאות מהחיים*

*❌ דוגמה בעייתית*

\`\`\`
await update.message.reply_text(
    "קישור - לחץ כאן: https://example.com",
    parse_mode="MarkdownV2"
)
\`\`\`

נראה תמים, נכון?

*✅ נכון:*

\`\`\`
"קישור \\- לחץ כאן: https://example\\.com"
\`\`\`

━━━━━━━━━━━━━━━━━━━━

*❌ גם URLs יכולים לשבור*

\`\`\`
[test](https://example.com/test(1))
\`\`\`

*✅ נכון:*

\`\`\`
[test](https://example.com/test\\(1\\))
\`\`\`

━━━━━━━━━━━━━━━━━━━━

*❌ נקודה בסוף שורה*

\`\`\`
תודה שביקרתם.
\`\`\`

*✅ נכון:*

\`\`\`
תודה שביקרתם\\.
\`\`\`

━━━━━━━━━━━━━━━━━━━━

*❌ מילת קוד ללא escape*

צריך escape לסוגריים וסימן קריאה בתוך inline code

━━━━━━━━━━━━━━━━━━━━

✅ *איך לכתוב בלי להילחם בזה?*

טיפ: כשאפשר, השתמשו ב\\-Code Block\\.
הוא *מנטרל את רוב הבעיות* וחוסך ESCAPE\\.

\`\`\`
print("hello world")
\`\`\`

━━━━━━━━━━━━━━━━━━━━

✅ *פתרון מקצועי \\- Auto Escape*

פונקציה ש\\-escape את כל מה שצריך לפני שליחה:

\`\`\`
def escape_markdown_v2(text: str):
    specials = r"_*[]()~\`>#+-=|{}.!"
    for ch in specials:
        text = text.replace(ch, "\\\\" + ch)
    return text
\`\`\`

שימוש:

\`\`\`
safe_text = escape_markdown_v2("קישור - לחץ כאן.")
await update.message.reply_text(
    safe_text,
    parse_mode="MarkdownV2"
)
\`\`\`

✅ עובד על הכל
✅ פותר 99% מהבעיות
✅ חובה אם המשתמשים שלכם מקלידים טקסט חופשי

━━━━━━━━━━━━━━━━━━━━

✅ *טיפים לבלוק קוד*

לטלגרם יש שני סוגים:

*✅ Inline:* backtick בודד
*✅ מספר שורות:* שלושה backticks

\`\`\`
function test() {
    return true;
}
\`\`\`

━━━━━━━━━━━━━━━━━━━━

✅ *קישורים עם טקסט עברי*

*✅ נכון:*

\`\`\`
[לחץ כאן](https://example.com)
\`\`\`

*✅ עם פרמטרים:*

\`\`\`
[פתיחה](https://example.com/test\\?id\\=5)
\`\`\`

━━━━━━━━━━━━━━━━━━━━

✅ *תבנית הודעה מעוצבת*

\`\`\`
msg = (
    "*✅ ביצוע הושלם*\\n"
    "_הקובץ נשמר בהצלחה_\\n"
    "[קישור](https://example\\.com)"
)
\`\`\`

━━━━━━━━━━━━━━━━━━━━

✅ *מה עובד בלי MarkdownV2?*

החלק הזה מעניין משתמשים רגילים:

✔ Bold
✔ Italic
✔ Link
✔ Strikethrough
✔ Inline code
✔ Code block

כולם עובדים מתוך העורך המובנה של טלגרם \\- בלי שום Markdown\\.

━━━━━━━━━━━━━━━━━━━━

✅ *סיכום למפתחים*

\`\`\`
הודעות טקסט בסיסיות - לא צריך MarkdownV2
Bold/Italic - כן, צריך ESCAPE
קישורים - כן, לפעמים צריך ESCAPE
קוד - כן, אם יש תווים מיוחדים
טקסט חופשי - מומלץ Auto-Escape
\`\`\`

━━━━━━━━━━━━━━━━━━━━

💡 רוצה לתרגל Markdown רגיל? נסה:
• /sandbox \\- מעבדת תרגול
• /cheatsheet \\- מדריך מהיר
• /templates \\- תבניות מוכנות

מקור: @moominAmir`;
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

    const totalLessons = 14; // Total number of lessons (excluding tips)
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
    const totalLessons = 39; // We have 39 lessons total (14 lessons + 25 tips)

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
        await this.safeSendMarkdown(chatId, message);
        await this.sleep(1500);
      }

      // Send quiz if exists
      if (lesson.quiz) {
        console.log(`Sending lesson ${lesson.id} quiz to user ${userId}`);
        await this.sleep(1000);
        await this.safeSendMarkdown(chatId, lesson.quiz.question, {
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
        await this.safeSendMarkdown(chatId,
          `✨ הוספתי לך ${points} נקודות!\n\n` +
          `מוכן/ה לטיפ הבא? שלח /next! 🚀`
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

  // Attempt to send message with Markdown, fallback to plain text on parse errors
  async safeSendMarkdown(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
    } catch (err) {
      const desc = String(err?.response?.body?.description || err?.message || '').toLowerCase();
      if (desc.includes("can't parse entities") || desc.includes('parse') || desc.includes('entity')) {
        // Retry without parse mode
        return await this.bot.sendMessage(chatId, text, { ...options });
      }
      throw err;
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
        [{ text: '📖 מדריך טלגרם' }, { text: '❓ עזרה' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };
  }
}

module.exports = CommandHandler;
