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
      await this.sendWelcomeSequence(chatId, firstName, userId);
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
        { reply_markup: this.getMainKeyboard(userId) }
      );
    }
  }

  async sendWelcomeSequence(chatId, firstName, userId) {
    // Message 1: Welcome
    await this.bot.sendMessage(chatId,
      `היי ${firstName}, ברוכ/ה הבא/ה ל-Markdown Trainer! 🤖\n\n` +
      `אני הבוט שילמד אותך צעד אחר צעד איך לכתוב טקסטים יפים, מסודרים ומקצועיים באמצעות Markdown.\n\n` +
      `מה זה Markdown?\n` +
      `זו שפת סימון פשוטה שמאפשרת לך לעצב טקסט (כמו כותרות, רשימות והדגשות) באמצעות תווים פשוטים, בלי להסתבך עם תפריטים ועכבר.\n\n` +
      `מוכנ/ה להתחיל? השתמש בכפתורים למטה או שלח /next לשיעור הראשון! 🚀`,
      { reply_markup: this.getMainKeyboard(userId) }
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
      `/start - הודעת פתיחה\n` +
      `/next - עבור לשיעור הבא\n` +
      `/restart_lessons - אפס והתחל את השיעורים מהתחלה\n` +
      `/progress - הצג את ההתקדמות שלך\n\n` +
      `🎯 *אימון ממוקד:*\n` +
      `/train - התחל אימון בנושא ספציפי\n` +
      `/cancel_training - בטל אימון פעיל\n\n` +
      `🛠️ *כלים:*\n` +
      `/sandbox - פתח מעבדת תרגול (Markdown → תמונה)\n` +
      `/themes - בחר ערכת נושא לארגז החול\n` +
      `/templates - תבניות Markdown מוכנות לשימוש\n` +
      `/cheatsheet - הצג מדריך מהיר\n`;

    if (this.isAdmin(userId)) {
      helpText += `/didyouknow - כרטיסיות "הידעת?" קצרות\n`;
    }

    helpText +=
      `/markdown_guide - מדריך Markdown לטלגרם\n` +
      `/exit - צא ממצב מעבדה\n\n` +
      `👥 *ספרייה קהילתית:*\n` +
      `/submit_template - הגש תבנית משלך לספרייה\n` +
      `/my_submissions - צפה בהגשות שלך\n` +
      `/cancel_submission - בטל הגשת תבנית\n\n` +
      `💡 *טיפים:*\n` +
      `• השתמש באימון ממוקד (/train) לתרגל נושאים ספציפיים\n` +
      `• השתמש במעבדה (/sandbox) כדי לראות איך הקוד שלך נראה\n` +
      `• השתמש בתבניות (/templates) לקבלת נקודת פתיחה מקצועית\n` +
      `• תרגל כל יום כדי לשפר את הכישורים שלך`;

    if (this.isAdmin(userId)) {
      helpText += `\n\n🧰 *אדמין:*\n/reset_progress - אפס התקדמות (כדי לאפס משתמש אחר, שלח כ-reply)\n/statistics - הצג סטטיסטיקות משתמשים\n/review_templates - בדוק תבניות ממתינות לאישור`;
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
  // /didyouknow - Show rotating quick tips
  // ========================================
  async handleDidYouKnow(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    if (!this.isAdmin(userId)) {
      await this.bot.sendMessage(chatId, '⛔ קטגוריית "הידעת?" זמינה כרגע רק לחברי צוות.');
      return;
    }

    try {
      const DidYouKnowData = require('../lessons/didYouKnowData');
      const payload = DidYouKnowData.getCardPayload(0);

      if (!payload) {
        await this.bot.sendMessage(chatId,
          'אין כרגע כרטיסיות "הידעת?" להצגה. נסו שוב מאוחר יותר.'
        );
        return;
      }

      await this.safeSendMarkdown(chatId, payload.fact.message, {
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: DidYouKnowData.NEXT_BUTTON_TEXT,
                callback_data: `didyouknow_${payload.nextIndex}`
              }
            ]
          ]
        }
      });
    } catch (error) {
      console.error('Error sending Did You Know card:', error);
      await this.bot.sendMessage(chatId,
        '❌ אופס! לא הצלחתי להציג את הכרטיס. נסו שוב מאוחר יותר.'
      );
    }
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
      // Send in smaller, safe-to-parse sections; two sections use HTML code blocks.
      await this.sendTelegramGuideWithHtmlCodeBlocks(chatId, guide);
    } catch (error) {
      console.error('Error sending Telegram dev guide:', error);
      // Final fallback: send as plain text without MarkdownV2 escapes
      try {
        const plain = this.unescapeMarkdownV2(guide);
        await this.bot.sendMessage(chatId, plain);
      } catch (e2) {
        console.error('Fallback send of Telegram dev guide also failed:', e2);
        await this.bot.sendMessage(
          chatId,
          'מדריך למפתחים - Markdown בטלגרם\n\n' +
            'מצטער, אירעה שגיאה בשליחת המדריך. נסו שוב מאוחר יותר.'
        );
      }
    }
  }

  // Helper function to build the Telegram developer guide with proper MarkdownV2 escaping
  buildTelegramDevGuide() {
    return `🚀 *מדריך למפתחים \\- Markdown בטלגרם*

*✅ מתאים למפתחים שבונים בוטים*
*❌ לא מיועד למשתמשי קצה רגילים*

━━━━━━━━━━━━━━━━━━━━

✅ *למה אתה צריך את זה?*

Markdown רגיל בטלגרם לא מספיק\\. ה\\-Bot API משתמש ב\\-*MarkdownV2* – עם טעם משלו, וכל טעות קטנה → ההודעה לא נשלחת\\.

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

כלומר: כששולחים טקסט מהבוט → כל תו כזה צריך \`\\\`\\.

━━━━━━━━━━━━━━━━━━━━

✅ *דוגמאות מהחיים*

*❌ דוגמה בעייתית*

\`\`\`python
await update.message.reply_text(
    "קישור - לחץ כאן: https://example.com",
    parse_mode="MarkdownV2"
)
\`\`\`

נראה תמים, נכון?

*✅ נכון:*

\`\`\`python
" קישור \\\\- לחץ כאן: https://example\\\\.com "
\`\`\`

━━━━━━━━━━━━━━━━━━━━

*❌ גם URLs יכולים לשבור*

\`\`\`markdown
[test](https://example.com/test(1))
\`\`\`

*✅ נכון:*

\`\`\`markdown
[test](https://example.com/test\\\\(1\\\\))
\`\`\`

━━━━━━━━━━━━━━━━━━━━

*❌ נקודה בסוף שורה*

\`\`\`
תודה שביקרתם.
\`\`\`

*✅ נכון:*

\`\`\`
תודה שביקרתם\\\\.
\`\`\`

━━━━━━━━━━━━━━━━━━━━

*❌ מילת קוד ללא escape*

\`\`\`
\`print("hi!")\`
\`\`\`

צריך escape לסוגריים וסימן קריאה:

\`\`\`
\\\\\`print\\\\("hi\\\\!"\\\\)\\\\\`
\`\`\`

━━━━━━━━━━━━━━━━━━━━

✅ *איך לכתוב בלי להילחם בזה? — שימוש ב\\-Code Blocks*

טיפ: כשאפשר, השתמשו ב\\-Code Block\\.
הוא *מנטרל את רוב הבעיות* וחוסך ESCAPE\\.

\`\`\`python
print("hello world")
\`\`\`

━━━━━━━━━━━━━━━━━━━━

✅ *פתרון "מקצועי" — Auto\\-Escape*

פונקציה ש\\-escape את כל מה שצריך לפני שליחה:

\`\`\`
def escape_markdown_v2(text: str) -> str:
    specials = r"_*[]()~\`>#+-=|{}.!"
    for ch in specials:
        text = text.replace(ch, "\\\\" + ch)
    return text
\`\`\`

שימוש:

\`\`\`
safe_text = escape_markdown_v2("קישור - לחץ כאן. (הערה)")
await update.message.reply_text(safe_text, parse_mode="MarkdownV2")
\`\`\`

✅ עובד על הכל
✅ פותר 99% מהבעיות
✅ חובה אם המשתמשים שלכם מקלידים טקסט חופשי

━━━━━━━━━━━━━━━━━━━━

✅ *טיפים לבלוק קוד*

לטלגרם יש שני סוגים:

*✅ Inline:*

\`\`\`
\`value = 5\`
\`\`\`

*✅ מספר שורות:*

\`\`\`
function test() {
    return true;
}
\`\`\`

אם יש backticks בקוד → השתמשו בשלושה או ארבעה:

\`\`\`\`
print(\\\`hello\\\`)
\`\`\`\`

━━━━━━━━━━━━━━━━━━━━

✅ *קישורים עם טקסט עברי*

*✅ נכון:*

\`\`\`
[לחץ כאן](https://example.com)
\`\`\`

*✅ עם פרמטרים:*

\`\`\`
[פתיחה](https://example.com/test\\\\?id\\\\=5\\\\&ref\\\\=abc)
\`\`\`

━━━━━━━━━━━━━━━━━━━━

✅ *תבנית הודעה מעוצבת מורכבת*

\`\`\`python
msg = (
    "*✅ ביצוע הושלם*\\\\n"
    "_הקובץ נשמר בהצלחה_\\\\n"
    "[קישור לצפייה](https://example\\\\.com/view)"
)
await update.message.reply_text(msg, parse_mode="MarkdownV2")
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

כולם עובדים מתוך העורך המובנה של טלגרם — בלי שום Markdown\\.

 

💡 רוצה לתרגל Markdown רגיל? נסה:
• /sandbox \\- מעבדת תרגול
• /cheatsheet \\- מדריך מהיר
• /templates \\- תבניות מוכנות

מקור: @moominAmir`;
  }

  /**
   * Safely send a MarkdownV2-formatted message. If Telegram rejects due to
   * entity parsing (e.g., escaping issues), fall back to plain text while
   * preserving content readability by removing MarkdownV2 escape backslashes.
   */
  async safeSendMarkdownV2(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, {
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
        ...options,
      });
    } catch (err) {
      const desc = String(err?.response?.body?.description || err?.message || '').toLowerCase();
      if (desc.includes("can't parse entities") || desc.includes('parse') || desc.includes('entity')) {
        // Retry once without language hints in code fences (```lang → ```)
        const withoutLangFences = text.replace(/```[a-zA-Z0-9_+#-]+/g, '```');
        if (withoutLangFences !== text) {
          try {
            return await this.bot.sendMessage(chatId, withoutLangFences, {
              parse_mode: 'MarkdownV2',
              disable_web_page_preview: true,
              ...options,
            });
          } catch (_) {
            // fall through to plain text fallback
          }
        }
        const plain = this.unescapeMarkdownV2(text);
        return await this.bot.sendMessage(chatId, plain, { disable_web_page_preview: true, ...options });
      }
      throw err;
    }
  }

  /**
   * Convert a MarkdownV2-escaped string back to a readable plain-text string
   * by removing escape backslashes before special characters.
   */
  unescapeMarkdownV2(text) {
    if (!text) return text;
    // Remove backslash before any MarkdownV2 special char
    return text.replace(/\\([_*\[\]()~`>#\+\-=|{}\.!\\])/g, '$1');
  }

  /**
   * Send the Telegram developer guide while forcing two specific sections
   * to render code blocks via HTML (<pre><code>) for maximum stability.
   * Other sections continue to use MarkdownV2.
   */
  async sendTelegramGuideWithHtmlCodeBlocks(chatId, fullText) {
    const delimiter = '\n━━━━━━━━━━━━━━━━━━━━\n';
    const parts = fullText.split(delimiter);

    for (let i = 0; i < parts.length; i++) {
      const chunk = i === 0 ? parts[i] : '━━━━━━━━━━━━━━━━━━━━\n\n' + parts[i];

      // Detect and specially render the "תווים מסוכנים" section
      if (chunk.includes('✅ *תווים מסוכנים*')) {
        await this.sendDangerousCharsSection(chatId);
        await this.sleep(200);
        continue;
      }

      // Detect and specially render the Auto-Escape section
      if (chunk.includes('Auto\\-Escape') || chunk.includes('escape_markdown_v2')) {
        await this.sendAutoEscapeSection(chatId);
        await this.sleep(200);
        continue;
      }

      await this.safeSendMarkdownV2(chatId, chunk);
      await this.sleep(200);
    }
  }

  /** Escape minimal HTML entities to safely send via parse_mode=HTML */
  escapeHtmlEntities(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** Strip HTML tags for plain-text fallback */
  stripHtmlTags(html) {
    if (!html) return '';
    return String(html).replace(/<[^>]*>/g, '');
  }

  /** Safely send HTML message with fallback to plain text */
  async safeSendHtml(chatId, html, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, html, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      });
    } catch (err) {
      const desc = String(err?.response?.body?.description || err?.message || '').toLowerCase();
      if (desc.includes('parse') || desc.includes('entity')) {
        const plain = this.stripHtmlTags(html)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        return await this.bot.sendMessage(chatId, plain, { disable_web_page_preview: true, ...options });
      }
      throw err;
    }
  }

  /** Render a MarkdownV2 section into HTML with stable code blocks */
  renderGuideSectionToHtml(sectionText) {
    const source = this.unescapeMarkdownV2(sectionText || '');
    const fenceRegex = /```[a-zA-Z0-9_+#-]*\n([\s\S]*?)\n```/g;
    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = fenceRegex.exec(source)) !== null) {
      const before = source.slice(lastIndex, match.index);
      if (before) {
        result += this.escapeHtmlEntities(before).replace(/\n/g, '<br>');
      }
      const codeContent = match[1] || '';
      result += `<pre><code>${this.escapeHtmlEntities(codeContent)}</code></pre>`;
      lastIndex = fenceRegex.lastIndex;
    }

    // Append remaining non-code text
    const tail = source.slice(lastIndex);
    if (tail) {
      result += this.escapeHtmlEntities(tail).replace(/\n/g, '<br>');
    }
    return result;
  }

  /**
   * Send the guide as a few compact HTML messages, grouping multiple sections per message
   * while converting fenced code blocks into <pre><code> for reliability.
   */
  async sendTelegramGuideAsHtmlChunks(chatId, fullText) {
    const delimiter = '\n━━━━━━━━━━━━━━━━━━━━\n';
    const parts = fullText.split(delimiter);
    const maxLen = 4000; // larger chunks, still under Telegram's ~4096 char limit

    let current = '';
    for (let i = 0; i < parts.length; i++) {
      const section = i === 0 ? parts[i] : '━━━━━━━━━━━━━━━━━━━━\n\n' + parts[i];
      const htmlSection = this.renderGuideSectionToHtml(section);

      if (current && (current.length + 2 + htmlSection.length) > maxLen) {
        await this.safeSendHtml(chatId, current);
        await this.sleep(200);
        current = htmlSection;
      } else {
        current += (current ? '<br><br>' : '') + htmlSection;
      }
    }
    if (current) {
      await this.safeSendHtml(chatId, current);
    }
  }

  /** Send the "dangerous characters" section with a robust HTML code block */
  async sendDangerousCharsSection(chatId) {
    const codeLine = '_ * [ ] ( ) ~ ` > # + - = | { } . !';
    const html = [
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      '✅ <b>תווים מסוכנים</b>',
      '',
      'כל התווים האלו <i>חייבים escape</i>:',
      `<pre><code>${this.escapeHtmlEntities(codeLine)}</code></pre>`
    ].join('\n');
    await this.bot.sendMessage(chatId, html, { parse_mode: 'HTML', disable_web_page_preview: true });
  }

  /** Send the Auto-Escape section (function and usage) with HTML code blocks */
  async sendAutoEscapeSection(chatId) {
    const fnCode = [
      'def escape_markdown_v2(text: str) -> str:',
      '    specials = r"_*[]()~`>#+-=|{}.!"',
      '    for ch in specials:',
      '        text = text.replace(ch, "\\\\" + ch)',
      '    return text'
    ].join('\n');
    const usageCode = [
      'safe_text = escape_markdown_v2("קישור - לחץ כאן. (הערה)")',
      'await update.message.reply_text(safe_text, parse_mode="MarkdownV2")'
    ].join('\n');
    const html = [
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      '✅ <b>פתרון "מקצועי" — Auto‑Escape</b>',
      '',
      'פונקציה ש‑escape את כל מה שצריך לפני שליחה:',
      `<pre><code>${this.escapeHtmlEntities(fnCode)}</code></pre>`,
      '',
      '<b>שימוש:</b>',
      `<pre><code>${this.escapeHtmlEntities(usageCode)}</code></pre>`,
      '',
      '✅ עובד על הכל',
      '✅ פותר 99% מהבעיות',
      '✅ חובה אם המשתמשים שלכם מקלידים טקסט חופשי'
    ].join('\n');
    await this.bot.sendMessage(chatId, html, { parse_mode: 'HTML', disable_web_page_preview: true });
  }

  /**
   * Split a long MarkdownV2 message into logical sections and send sequentially.
   * Sections are split by the visual delimiter line used in the guide.
   */
  async sendMarkdownV2InSections(chatId, text) {
    const delimiter = '\n━━━━━━━━━━━━━━━━━━━━\n';
    const parts = text.split(delimiter);

    for (let i = 0; i < parts.length; i++) {
      const chunk = i === 0 ? parts[i] : '━━━━━━━━━━━━━━━━━━━━\n\n' + parts[i];
      await this.safeSendMarkdownV2(chatId, chunk);
      await this.sleep(200);
    }
  }

  // ========================================
  // /templates - Show markdown templates library
  // ========================================
  async handleTemplates(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    // Get community templates
    const communityTemplates = this.db.getCommunityTemplates();

    const keyboard = [
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
    ];

    // Add community templates if any
    if (communityTemplates.length > 0) {
      keyboard.push([
        { text: '━━━━ תבניות קהילתיות ━━━━', callback_data: 'noop' }
      ]);

      communityTemplates.forEach(template => {
        const authorName = template.first_name || template.username || 'קהילה';
        keyboard.push([
          {
            text: `👥 ${template.title} (${authorName})`,
            callback_data: `community_template_${template.template_id}`
          }
        ]);
      });
    }

    let message = `📚 *ספריית תבניות Markdown*\n\n` +
      `בחר תבנית מוכנה לשימוש:`;

    if (communityTemplates.length > 0) {
      message += `\n\n👥 *יש ${communityTemplates.length} תבניות קהילתיות!*`;
    }

    message += `\n\n💡 רוצה להוסיף תבנית משלך? שלח \`/submit_template\``;

    await this.safeSendMarkdown(chatId, message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
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

    const LessonsData = require('../lessons/lessonsData');
    const totalLessons = LessonsData.getTotalLessons();
    const completedLessons = Math.min(progress.lessons_completed || 0, totalLessons);
    const progressPercentage = totalLessons > 0
      ? ((completedLessons / totalLessons) * 100).toFixed(1)
      : '0.0';
    
    // Create progress bar
    const barLength = 10;
    const filledBars = totalLessons > 0
      ? Math.floor((completedLessons / totalLessons) * barLength)
      : 0;
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
      `${completedLessons}/${totalLessons} שיעורים הושלמו\n\n` +
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

    const LessonsData = require('../lessons/lessonsData');
    const lessons = LessonsData.getAllLessons();
    const totalLessons = lessons.length;

    if (!totalLessons) {
      await this.bot.sendMessage(chatId, 'אין כרגע שיעורים זמינים. נסה שוב מאוחר יותר.');
      return;
    }

    const currentLessonId = typeof progress.current_lesson === 'number'
      ? progress.current_lesson
      : parseInt(progress.current_lesson, 10) || 0;
    const currentIndex = lessons.findIndex(l => l && l.id === currentLessonId);
    const nextIndex = currentIndex + 1; // if not found (-1) -> starts from 0

    if (nextIndex >= totalLessons) {
      await this.bot.sendMessage(chatId,
        `🎉 *מזל טוב!*\n\n` +
        `סיימת את כל השיעורים!\n\n` +
        `אתה עכשיו אשף Markdown מוסמך! 🏆\n\n` +
        `רוצה להתחיל אותם שוב מההתחלה?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔁 להתחיל שוב מההתחלה', callback_data: 'restart_lessons' }]
            ]
          }
        }
      );
      return;
    }

    // Load and send the next lesson (by the configured order in lessonsData.js)
    const lesson = lessons[nextIndex];

    if (!lesson) {
      await this.bot.sendMessage(chatId, 'שגיאה בטעינת השיעור. נסה שוב מאוחר יותר.');
      return;
    }

    // Update current lesson
    this.db.updateCurrentLesson(userId, lesson.id);

    // Send lesson content
    await this.sendLesson(chatId, userId, lesson);
  }

  // ========================================
  // /restart_lessons - Reset and start lessons again
  // ========================================
  async handleRestartLessons(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const progress = this.db.getUserProgress(userId);
    if (!progress) {
      await this.bot.sendMessage(chatId, 'נסה קודם /start');
      return;
    }

    try {
      this.db.resetUserProgress(userId);
      await this.bot.sendMessage(
        chatId,
        '🔁 איפסתי את ההתקדמות שלך (כולל ניקוד והיסטוריה) והתחלנו מחדש מהשיעור הראשון!'
      );

      // Send lesson 1 immediately
      await this.handleNext(msg);
    } catch (e) {
      console.error('Error restarting lessons:', e);
      await this.bot.sendMessage(chatId, '❌ שגיאה באיפוס ההתקדמות. נסה שוב מאוחר יותר.');
    }
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
            [
              { text: '✨ עיצוב טקסט', callback_data: 'train_topic_text-formatting' },
              { text: '📊 טבלאות', callback_data: 'train_topic_tables' }
            ],
            [
              { text: '🔗 קישורים ותמונות', callback_data: 'train_topic_links-images' },
              { text: '📋 רשימות מתקדמות', callback_data: 'train_topic_advanced-lists' }
            ],
            [
              { text: '💻 קוד וסינטקס', callback_data: 'train_topic_code-blocks' },
              { text: '🛡️ תווים מיוחדים', callback_data: 'train_topic_escaping' }
            ],
            [
              { text: '🗨️ ציטוטים והתראות', callback_data: 'train_topic_quotes-alerts' },
              { text: '📐 HTML בתוך Markdown', callback_data: 'train_topic_html-markdown' }
            ],
            [
              { text: '📈 דיאגרמות Mermaid', callback_data: 'train_topic_mermaid' },
              { text: '🐛 איתור באגים', callback_data: 'train_topic_bug-detection' }
            ]
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
  // /submit_template - Submit a community template
  // ========================================
  async handleSubmitTemplate(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    // Ensure user exists (in case user didn't run /start yet)
    try {
      const existing = this.db.getUser(userId);
      if (!existing) {
        const username = msg.from.username || '';
        const firstName = msg.from.first_name || '';
        const lastName = msg.from.last_name || '';
        const languageCode = msg.from.language_code || 'he';
        this.db.createUser(userId, username, firstName, lastName, languageCode);
      }
    } catch (e) {
      // Continue even if creation fails; downstream flows still work without strict FKs
      console.warn('Could not ensure user exists before /submit_template:', e && e.message);
    }

    // Check if user is already submitting a template
    const mode = this.db.getUserMode(userId);
    if (mode.current_mode === 'submitting_template') {
      await this.bot.sendMessage(chatId,
        '⚠️ אתה כבר באמצע הגשת תבנית!\n\n' +
        'סיים את ההגשה הנוכחית או שלח /cancel_submission לביטול.'
      );
      return;
    }

    // Start template submission flow
    this.db.setUserMode(userId, 'submitting_template', JSON.stringify({ step: 'title' }));

    await this.safeSendMarkdown(chatId,
      '🎨 *הגשת תבנית לספרייה הקהילתית*\n\n' +
      'תודה שאתה רוצה לתרום לקהילה! 🙏\n\n' +
      'התבנית שלך תעבור בדיקה קצרה לפני שתהיה זמינה לכולם.\n\n' +
      '📝 *שלב 1 מתוך 4: כותרת*\n' +
      'מה שם התבנית? (לדוגמה: "דו״ח שבועי" או "תיעוד API")\n\n' +
      '💡 שלח /cancel_submission בכל שלב לביטול'
    );
  }

  // ========================================
  // /cancel_submission - Cancel template submission
  // ========================================
  async handleCancelSubmission(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const mode = this.db.getUserMode(userId);

    if (mode.current_mode !== 'submitting_template') {
      await this.bot.sendMessage(chatId,
        'אתה לא באמצע הגשת תבנית כרגע.\n\n' +
        'כדי להגיש תבנית חדשה, שלח /submit_template'
      );
      return;
    }

    // Clear user mode
    this.db.clearUserMode(userId);

    await this.bot.sendMessage(chatId,
      '✅ ההגשה בוטלה בהצלחה.\n\n' +
      'אפשר להגיש תבנית חדשה עם /submit_template בכל עת!'
    );
  }

  // ========================================
  // /review_templates - Admin: Review pending template submissions
  // ========================================
  async handleReviewTemplates(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!this.isAdmin(userId)) {
      await this.bot.sendMessage(chatId, '⛔ פקודה זו זמינה רק לאדמין.');
      return;
    }

    this.db.updateLastActive(userId);

    const pendingSubmissions = this.db.getPendingSubmissions(10);

    if (pendingSubmissions.length === 0) {
      await this.bot.sendMessage(chatId,
        '✅ אין תבניות ממתינות לאישור!\n\n' +
        'כל ההגשות טופלו.'
      );
      return;
    }

    await this.bot.sendMessage(chatId,
      `📋 *תבניות ממתינות לאישור* (${pendingSubmissions.length})\n\n` +
      'בחר תבנית לבדיקה:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: pendingSubmissions.map(sub => [
            {
              text: `${sub.title} - מאת ${sub.first_name || sub.username || 'אנונימי'}`,
              callback_data: `review_sub_${sub.id}`
            }
          ])
        }
      }
    );
  }

  // ========================================
  // /my_submissions - View user's template submissions
  // ========================================
  async handleMySubmissions(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    this.db.updateLastActive(userId);

    const submissions = this.db.getUserSubmissions(userId, 10);

    if (submissions.length === 0) {
      await this.bot.sendMessage(chatId,
        '📭 עדיין לא הגשת תבניות.\n\n' +
        'רוצה להגיש תבנית? שלח /submit_template'
      );
      return;
    }

    const statusEmoji = {
      'pending': '⏳',
      'approved': '✅',
      'rejected': '❌'
    };

    const statusText = {
      'pending': 'ממתין לאישור',
      'approved': 'אושר',
      'rejected': 'נדחה'
    };

    let message = `📝 *ההגשות שלך* (${submissions.length})\n\n`;

    submissions.forEach((sub, i) => {
      const status = statusEmoji[sub.status] || '❓';
      const statusLabel = statusText[sub.status] || sub.status;
      message += `${i + 1}. ${status} *${sub.title}*\n`;
      message += `   ${sub.category} | ${statusLabel}\n`;
      if (sub.status === 'rejected' && sub.rejection_reason) {
        message += `   💬 סיבה: ${sub.rejection_reason}\n`;
      }
      message += `   📅 ${new Date(sub.submitted_at).toLocaleDateString('he-IL')}\n\n`;
    });

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
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
  getMainKeyboard(userId) {
    const isAdmin = this.isAdmin(userId);
    const keyboard = [
      [{ text: '📚 שיעור הבא' }, { text: '🧪 מעבדה' }],
      [{ text: '🎯 אימון' }, { text: '📊 התקדמות' }],
      isAdmin
        ? [{ text: '📋 מדריך מהיר' }, { text: '💡 הידעת?' }]
        : [{ text: '📋 מדריך מהיר' }],
      [{ text: '📚 תבניות' }, { text: '📖 מדריך טלגרם' }],
      [{ text: '❓ עזרה' }]
    ];

    return {
      keyboard,
      resize_keyboard: true,
      one_time_keyboard: false
    };
  }
}

module.exports = CommandHandler;
