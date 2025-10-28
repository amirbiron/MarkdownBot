const MarkdownRenderer = require('../services/markdownRenderer');
const ShareImageGenerator = require('../services/shareImageGenerator');
const fs = require('fs');
const path = require('path');

class MessageHandler {
  constructor(bot, db) {
    this.bot = bot;
    this.db = db;
    this.renderer = new MarkdownRenderer();
    this.shareGenerator = new ShareImageGenerator();

    // Create temp directory for template files if not exists
    this.tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Clean up old share images periodically
    setInterval(() => {
      this.shareGenerator.cleanupOldImages();
    }, 60 * 60 * 1000); // Every hour
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
    } else if (mode.current_mode === 'training') {
      // User is in training mode - validate their answer
      await this.handleTrainingAnswer(chatId, userId, text, mode);
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

      // Get user's theme preference
      const theme = this.db.getSandboxTheme(userId);

      // Render markdown to image
      const imagePath = await this.renderer.renderMarkdown(markdownText, userId, theme);

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
    // Check if message is from reply keyboard button
    const CommandHandler = require('./commandHandler');
    const cmdHandler = new CommandHandler(this.bot, this.db);

    const msg = { chat: { id: chatId }, from: { id: userId } };

    // Handle keyboard button presses
    if (text === '📚 שיעור הבא') {
      await cmdHandler.handleNext(msg);
      return;
    } else if (text === '🧪 מעבדה') {
      await cmdHandler.handleSandbox(msg);
      return;
    } else if (text === '🎯 אימון') {
      await cmdHandler.handleTrain(msg);
      return;
    } else if (text === '📊 התקדמות') {
      await cmdHandler.handleProgress(msg);
      return;
    } else if (text === '📋 מדריך מהיר') {
      await cmdHandler.handleCheatsheet(msg);
      return;
    } else if (text === '📚 תבניות') {
      await cmdHandler.handleTemplates(msg);
      return;
    } else if (text === '❓ עזרה') {
      await cmdHandler.handleHelp(msg);
      return;
    }

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
    } else if (data.startsWith('theme_')) {
      await this.handleThemeSelection(chatId, userId, data, messageId);
    } else if (data.startsWith('cheat_')) {
      await this.handleCheatsheetTopic(chatId, userId, data, query.message.message_id);
    } else if (data.startsWith('copy_')) {
      await this.handleCopyExample(chatId, userId, data);
    } else if (data.startsWith('download_')) {
      await this.handleTemplateDownload(chatId, userId, data);
    } else if (data === 'back_to_templates') {
      // Re-send the templates menu
      const CommandHandler = require('./commandHandler');
      const cmdHandler = new CommandHandler(this.bot, this.db);
      await cmdHandler.handleTemplates({ chat: { id: chatId }, from: { id: userId } });
    } else if (data.startsWith('template_')) {
      await this.handleTemplateSelection(chatId, userId, data);
    } else if (data.startsWith('train_topic_')) {
      await this.handleTrainingTopicSelection(chatId, userId, data, messageId);
    } else if (data === 'train_hint') {
      await this.handleTrainingHint(chatId, userId);
    } else if (data === 'train_skip') {
      await this.handleTrainingSkip(chatId, userId);
    } else if (data === 'train_exit') {
      await this.handleTrainingExit(chatId, userId);
    } else if (data.startsWith('share_')) {
      await this.handleShareAchievement(chatId, userId, data, query.from);
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

      // Prompt for next lesson with share button
      await this.bot.sendMessage(chatId,
        'מוכן/ה להמשיך? שלח /next לשיעור הבא! 🚀',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔖 שתף את ההישג', callback_data: 'share_lesson' }]
            ]
          }
        }
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
          '💡 חשוב: רווח אחרי הסולמיות!\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '# כותרת ראשית שלי\n## כותרת משנית\n### כותרת קטנה יותר'
      },
      emphasis: {
        title: '✨ הדגשות',
        content:
          '*הדגשות:*\n\n' +
          '`**טקסט מודגש**` → *טקסט מודגש*\n' +
          '`*טקסט נטוי*` → _טקסט נטוי_\n' +
          '`***מודגש ונטוי***` → *מודגש ונטוי*\n' +
          '`~~טקסט מחוק~~` → ~טקסט מחוק~\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '**זה טקסט מודגש**\n*זה טקסט נטוי*\n***זה מודגש ונטוי***\n~~זה טקסט מחוק~~'
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
          '```\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '- פירות\n- ירקות\n  - עגבניה\n  - מלפפון\n\n1. ראשון\n2. שני\n3. שלישי'
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
          '```\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '[גוגל](https://google.com)\n<https://github.com>\n\n[המדריך שלי][guide]\n[guide]: https://example.com'
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
          '```\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '> זה ציטוט חשוב\n> המשך הציטוט\n\n> ציטוט ראשי\n>> ציטוט בתוך ציטוט'
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
          '\\`\\`\\`\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: 'השתמש בפונקציה `console.log()` להדפסה.\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```'
      },
      images: {
        title: '🖼️ תמונות',
        content:
          '*תמונות:*\n\n' +
          '`![תיאור התמונה](https://example.com/image.jpg)`\n\n' +
          '💡 כמו קישור, רק עם ! בהתחלה\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '![לוגו של החברה](https://via.placeholder.com/150)\n![תמונה יפה](https://example.com/photo.jpg)'
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
          '`---:` ימין\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '| שם | גיל | עיר |\n|:---|:---:|---:|\n| יוסי | 25 | תל אביב |\n| שרה | 30 | ירושלים |'
      },
      tasks: {
        title: '✅ רשימות משימות',
        content:
          '*רשימות משימות:*\n\n' +
          '```\n' +
          '- [ ] משימה פתוחה\n' +
          '- [x] משימה שבוצעה\n' +
          '```\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '- [x] למדתי Markdown\n- [x] תרגלתי עם הבוט\n- [ ] בניתי פרויקט משלי'
      },
      lines: {
        title: '➖ קווים מפרידים',
        content:
          '*קווים מפרידים:*\n\n' +
          '`---` או `***` או `___`\n\n' +
          'כל אחד מהם יוצר קו אופקי\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: 'חלק ראשון\n\n---\n\nחלק שני\n\n***\n\nחלק שלישי'
      }
    };

    const sheet = cheatsheets[topic];

    if (sheet) {
      await this.bot.sendMessage(chatId, sheet.content, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 העתק דוגמה', callback_data: `copy_${topic}` }],
            [{ text: '◀️ חזרה למדריך', callback_data: 'back_to_cheatsheet' }]
          ]
        }
      });
    }
  }

  // ========================================
  // Handle Copy Example Button
  // ========================================
  async handleCopyExample(chatId, userId, data) {
    const topic = data.replace('copy_', '');

    const examples = {
      headers: '# כותרת ראשית שלי\n## כותרת משנית\n### כותרת קטנה יותר',
      emphasis: '**זה טקסט מודגש**\n*זה טקסט נטוי*\n***זה מודגש ונטוי***\n~~זה טקסט מחוק~~',
      lists: '- פירות\n- ירקות\n  - עגבניה\n  - מלפפון\n\n1. ראשון\n2. שני\n3. שלישי',
      links: '[גוגל](https://google.com)\n<https://github.com>\n\n[המדריך שלי][guide]\n[guide]: https://example.com',
      quotes: '> זה ציטוט חשוב\n> המשך הציטוט\n\n> ציטוט ראשי\n>> ציטוט בתוך ציטוט',
      code: 'השתמש בפונקציה `console.log()` להדפסה.\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```',
      images: '![לוגו של החברה](https://via.placeholder.com/150)\n![תמונה יפה](https://example.com/photo.jpg)',
      tables: '| שם | גיל | עיר |\n|:---|:---:|---:|\n| יוסי | 25 | תל אביב |\n| שרה | 30 | ירושלים |',
      tasks: '- [x] למדתי Markdown\n- [x] תרגלתי עם הבוט\n- [ ] בניתי פרויקט משלי',
      lines: 'חלק ראשון\n\n---\n\nחלק שני\n\n***\n\nחלק שלישי'
    };

    const example = examples[topic];

    if (example) {
      await this.bot.sendMessage(chatId,
        '📋 *דוגמה להעתקה:*\n\n' +
        '```\n' +
        example +
        '\n```\n\n' +
        '💡 העתק את הטקסט למעלה ונסה אותו ב-/sandbox',
        { parse_mode: 'Markdown' }
      );
    }
  }

  // ========================================
  // Handle Template Download
  // ========================================
  async handleTemplateDownload(chatId, userId, data) {
    const templateId = data.replace('download_', '');

    // Load templates data
    const TemplatesData = require('../templates/templatesData');
    const template = TemplatesData.getTemplateById(templateId);

    if (!template) {
      await this.bot.sendMessage(chatId, 'לא נמצאה תבנית זו.');
      return;
    }

    try {
      // Save template to temp file
      const filename = `${templateId}_template.md`;
      const filePath = path.join(this.tempDir, `${userId}_${filename}`);

      fs.writeFileSync(filePath, template.content, 'utf-8');

      // Send as document (file)
      await this.bot.sendDocument(chatId, filePath, {
        caption: `📄 ${template.title}\n\n💡 הורד את הקובץ, ערוך אותו בעורך טקסט, והתאם לצרכים שלך!`
      });

      // Clean up temp file after sending
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);

    } catch (error) {
      console.error('Error sending template file:', error);
      await this.bot.sendMessage(chatId, '❌ שגיאה בשליחת הקובץ. נסה שוב מאוחר יותר.');
    }
  }

  // ========================================
  // Handle Template Selection
  // ========================================
  async handleTemplateSelection(chatId, userId, data) {
    const templateId = data.replace('template_', '');

    // Load templates data
    const TemplatesData = require('../templates/templatesData');
    const template = TemplatesData.getTemplateById(templateId);

    if (!template) {
      await this.bot.sendMessage(chatId, 'לא נמצאה תבנית זו.');
      return;
    }

    // For templates that are too long for Telegram display (Blog Post, One-Pager, API Reference, README)
    // Send them as downloadable files directly
    const downloadOnlyTemplates = ['blog', 'onepager', 'api', 'readme'];

    if (downloadOnlyTemplates.includes(templateId)) {
      // Send template as downloadable file
      await this.bot.sendMessage(chatId,
        `📄 *${template.title}*\n\n` +
        `${template.description}\n\n` +
        `קטגוריה: ${template.category}\n\n` +
        `מוריד את התבנית כקובץ...`,
        { parse_mode: 'Markdown' }
      );

      await this.sleep(500);

      try {
        // Save template to temp file
        const filename = `${templateId}_template.md`;
        const filePath = path.join(this.tempDir, `${userId}_${filename}`);

        fs.writeFileSync(filePath, template.content, 'utf-8');

        // Send as document (file)
        await this.bot.sendDocument(chatId, filePath, {
          caption: '💡 הורד את הקובץ, ערוך אותו בעורך טקסט, והתאם לצרכים שלך!'
        });

        // Clean up temp file after sending
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);

      } catch (error) {
        console.error('Error sending template file:', error);
        await this.bot.sendMessage(chatId, '❌ שגיאה בשליחת הקובץ. נסה שוב מאוחר יותר.');
        return;
      }

    } else {
      // For other templates, send as text with option to download
      await this.bot.sendMessage(chatId,
        `📄 *${template.title}*\n\n` +
        `${template.description}\n\n` +
        `קטגוריה: ${template.category}`,
        { parse_mode: 'Markdown' }
      );

      await this.sleep(500);

      // Split template content into chunks if too long (Telegram limit ~4096 chars)
      const maxLength = 4000;
      const content = template.content;

      if (content.length <= maxLength) {
        // Send as single message
        await this.bot.sendMessage(chatId,
          '```markdown\n' + content + '\n```',
          { parse_mode: 'Markdown' }
        );
      } else {
        // Split into multiple messages
        const chunks = [];
        let currentChunk = '';
        const lines = content.split('\n');

        for (const line of lines) {
          if ((currentChunk + line + '\n').length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = line + '\n';
          } else {
            currentChunk += line + '\n';
          }
        }
        if (currentChunk) chunks.push(currentChunk);

        // Send each chunk
        for (let i = 0; i < chunks.length; i++) {
          await this.bot.sendMessage(chatId,
            `📄 *חלק ${i + 1}/${chunks.length}*\n\n` +
            '```markdown\n' + chunks[i] + '\n```',
            { parse_mode: 'Markdown' }
          );
          await this.sleep(500);
        }
      }

      // Send helpful message with download option
      await this.bot.sendMessage(chatId,
        '💡 *איך להשתמש בתבנית:*\n\n' +
        '1. העתק את התוכן למעלה\n' +
        '2. הדבק בעורך טקסט או ב-/sandbox\n' +
        '3. ערוך והתאם לצרכים שלך\n' +
        '4. מלא את החלקים המסומנים ב-[סוגריים]\n\n' +
        'רוצה תבנית אחרת? שלח /templates',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬇️ הורד כקובץ', callback_data: `download_${templateId}` }],
              [{ text: '◀️ חזרה לתבניות', callback_data: 'back_to_templates' }]
            ]
          }
        }
      );
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
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔖 שתף את ההישג', callback_data: 'share_level' }]
            ]
          }
        }
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
  // Training Mode Handlers
  // ========================================

  async handleTrainingTopicSelection(chatId, userId, data, messageId) {
    const topic = data.replace('train_topic_', '');

    // Load training data
    const TrainingData = require('../training/trainingData');
    const challenges = TrainingData.getChallengesByTopic(topic);

    if (!challenges || challenges.length === 0) {
      await this.bot.sendMessage(chatId, 'לא נמצאו אתגרים לנושא זה.');
      return;
    }

    // Remove the keyboard
    await this.bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: chatId, message_id: messageId }
    );

    // Create training session in DB
    const sessionId = this.db.createTrainingSession(userId, topic);

    // Set user to training mode with session data
    const modeData = JSON.stringify({
      sessionId,
      topic,
      currentChallengeIndex: 0,
      challengesCompleted: 0,
      challengesCorrect: 0,
      totalChallenges: Math.min(challenges.length, 5) // Maximum 5 challenges
    });

    this.db.setUserMode(userId, 'training', modeData);

    // Send welcome message
    const topicName = TrainingData.getTopicDisplayName(topic);
    await this.bot.sendMessage(chatId,
      `🎯 *אימון ממוקד: ${topicName}*\n\n` +
      `תקבל ${Math.min(challenges.length, 5)} אתגרים ברמות קושי הולכות וגדלות.\n\n` +
      `💡 אפשר לבקש רמז, לדלג או לצאת בכל שלב.\n\n` +
      `בואו נתחיל! 🚀`,
      { parse_mode: 'Markdown' }
    );

    await this.sleep(1500);

    // Send first challenge
    await this.sendTrainingChallenge(chatId, userId, challenges[0]);
  }

  async handleTrainingAnswer(chatId, userId, text, mode) {
    try {
      const modeData = JSON.parse(mode.mode_data);
      const TrainingData = require('../training/trainingData');
      const challenges = TrainingData.getChallengesByTopic(modeData.topic);

      const currentChallenge = challenges[modeData.currentChallengeIndex];

      // Validate answer
      const validation = TrainingData.validateAnswer(currentChallenge, text);

      if (validation.isCorrect) {
        // Correct answer!
        modeData.challengesCorrect++;
        modeData.challengesCompleted++;

        // Update database
        this.db.updateTrainingProgress(
          modeData.sessionId,
          modeData.challengesCompleted,
          modeData.challengesCorrect
        );

        // Update topic performance
        this.db.updateTopicPerformance(userId, modeData.topic, true);

        await this.bot.sendMessage(chatId,
          `✅ *${currentChallenge.correctFeedback}*\n\n` +
          `📈 התקדמות: ${modeData.challengesCompleted}/${modeData.totalChallenges}`,
          { parse_mode: 'Markdown' }
        );

        await this.sleep(2000);

        // Check if training completed
        if (modeData.challengesCompleted >= modeData.totalChallenges) {
          await this.completeTraining(chatId, userId, modeData);
        } else {
          // Move to next challenge
          modeData.currentChallengeIndex++;
          this.db.setUserMode(userId, 'training', JSON.stringify(modeData));

          await this.sendTrainingChallenge(chatId, userId, challenges[modeData.currentChallengeIndex]);
        }

      } else {
        // Wrong answer
        modeData.challengesCompleted++;

        // Update database
        this.db.updateTrainingProgress(
          modeData.sessionId,
          modeData.challengesCompleted,
          modeData.challengesCorrect
        );

        // Update topic performance
        this.db.updateTopicPerformance(userId, modeData.topic, false);

        await this.bot.sendMessage(chatId,
          `❌ *${currentChallenge.wrongFeedback}*\n\n` +
          `${validation.reason ? '🔍 ' + validation.reason + '\n\n' : ''}` +
          `💡 רוצה לנסות שוב? שלח תשובה חדשה.\n` +
          `או לחץ על "רמז" לעזרה.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '💡 רמז', callback_data: 'train_hint' },
                  { text: '⏭️ דלג', callback_data: 'train_skip' }
                ],
                [
                  { text: '❌ צא מהאימון', callback_data: 'train_exit' }
                ]
              ]
            }
          }
        );
      }

    } catch (error) {
      console.error('Error handling training answer:', error);
      await this.bot.sendMessage(chatId,
        '❌ שגיאה בבדיקת התשובה. נסה שוב או שלח /cancel_training לצאת.'
      );
    }
  }

  async sendTrainingChallenge(chatId, userId, challenge) {
    await this.bot.sendMessage(chatId,
      `🎯 *אתגר ${challenge.difficulty === 'easy' ? 'קל' : challenge.difficulty === 'medium' ? 'בינוני' : challenge.difficulty === 'hard' ? 'קשה' : 'מאתגר'}*\n\n` +
      challenge.question,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💡 רמז', callback_data: 'train_hint' },
              { text: '⏭️ דלג', callback_data: 'train_skip' }
            ],
            [
              { text: '❌ צא מהאימון', callback_data: 'train_exit' }
            ]
          ]
        }
      }
    );
  }

  async handleTrainingHint(chatId, userId) {
    const mode = this.db.getUserMode(userId);

    if (mode.current_mode !== 'training') return;

    try {
      const modeData = JSON.parse(mode.mode_data);
      const TrainingData = require('../training/trainingData');
      const challenges = TrainingData.getChallengesByTopic(modeData.topic);
      const currentChallenge = challenges[modeData.currentChallengeIndex];

      await this.bot.sendMessage(chatId,
        `💡 *רמז:*\n${currentChallenge.hint}\n\n` +
        `*דוגמה:*\n\`\`\`\n${currentChallenge.example}\n\`\`\``,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error showing hint:', error);
    }
  }

  async handleTrainingSkip(chatId, userId) {
    const mode = this.db.getUserMode(userId);

    if (mode.current_mode !== 'training') return;

    try {
      const modeData = JSON.parse(mode.mode_data);
      modeData.challengesCompleted++;

      // Update database
      this.db.updateTrainingProgress(
        modeData.sessionId,
        modeData.challengesCompleted,
        modeData.challengesCorrect
      );

      await this.bot.sendMessage(chatId,
        `⏭️ דילגת על האתגר.\n\n` +
        `📈 התקדמות: ${modeData.challengesCompleted}/${modeData.totalChallenges}`
      );

      await this.sleep(1500);

      // Check if training completed
      if (modeData.challengesCompleted >= modeData.totalChallenges) {
        await this.completeTraining(chatId, userId, modeData);
      } else {
        // Move to next challenge
        const TrainingData = require('../training/trainingData');
        const challenges = TrainingData.getChallengesByTopic(modeData.topic);

        modeData.currentChallengeIndex++;
        this.db.setUserMode(userId, 'training', JSON.stringify(modeData));

        await this.sendTrainingChallenge(chatId, userId, challenges[modeData.currentChallengeIndex]);
      }
    } catch (error) {
      console.error('Error skipping challenge:', error);
    }
  }

  async handleTrainingExit(chatId, userId) {
    const mode = this.db.getUserMode(userId);

    if (mode.current_mode !== 'training') return;

    try {
      const modeData = JSON.parse(mode.mode_data);

      // Cancel session
      this.db.cancelTrainingSession(modeData.sessionId);
      this.db.clearUserMode(userId);

      await this.bot.sendMessage(chatId,
        '❌ האימון בוטל.\n\n' +
        'אפשר להתחיל אימון חדש עם /train'
      );
    } catch (error) {
      console.error('Error exiting training:', error);
    }
  }

  async completeTraining(chatId, userId, modeData) {
    // Complete session in database
    this.db.completeTrainingSession(modeData.sessionId);
    this.db.clearUserMode(userId);

    const TrainingData = require('../training/trainingData');
    const topicName = TrainingData.getTopicDisplayName(modeData.topic);
    const successRate = ((modeData.challengesCorrect / modeData.totalChallenges) * 100).toFixed(0);

    let emoji = '🎉';
    let message = 'כל הכבוד!';

    if (successRate >= 80) {
      emoji = '🏆';
      message = 'מצוין! ביצועים מרשימים!';
    } else if (successRate >= 60) {
      emoji = '⭐';
      message = 'יפה מאוד!';
    } else if (successRate >= 40) {
      emoji = '👍';
      message = 'התחלה טובה!';
    } else {
      emoji = '💪';
      message = 'המשך להתאמן!';
    }

    await this.bot.sendMessage(chatId,
      `${emoji} *סיימת את האימון!* ${emoji}\n\n` +
      `*${message}*\n\n` +
      `📊 *תוצאות האימון ב${topicName}:*\n` +
      `✅ תשובות נכונות: ${modeData.challengesCorrect}/${modeData.totalChallenges}\n` +
      `📈 אחוז הצלחה: ${successRate}%\n\n` +
      `מה הלאה?\n` +
      `🎯 /train - אימון נוסף בנושא אחר\n` +
      `📚 /next - המשך בשיעורים\n` +
      `📊 /progress - הצג התקדמות כללית`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔖 שתף את ההישג', callback_data: 'share_training' }]
          ]
        }
      }
    );
  }

  // ========================================
  // Handle Share Achievement
  // ========================================
  async handleShareAchievement(chatId, userId, data, fromUser) {
    try {
      // Parse share data: share_type_extraData
      const parts = data.split('_');
      const shareType = parts[1]; // 'lesson', 'level', or 'training'

      const progress = this.db.getUserProgress(userId);
      const userName = fromUser.first_name || 'משתמש';

      let shareData = {
        userName,
        level: progress.level,
        score: progress.total_score
      };

      // Customize message based on type
      if (shareType === 'lesson') {
        shareData.type = 'lesson';
        shareData.achievement = 'עוד שיעור הושלם בהצלחה!';
        shareData.details = `${progress.lessons_completed} שיעורים הושלמו`;
      } else if (shareType === 'level') {
        shareData.type = 'level_up';
        shareData.achievement = 'עליתי דרגה!';
        shareData.details = `הדרגה החדשה: ${progress.level}`;
      } else if (shareType === 'training') {
        shareData.type = 'training';
        shareData.achievement = 'סיימתי אימון ממוקד!';
        shareData.details = 'התאמנתי והשתפרתי';
      }

      // Show loading message
      const loadingMsg = await this.bot.sendMessage(chatId,
        '🖼️ מכין לך תמונה יפה לשיתוף...'
      );

      // Generate share image
      const imagePath = await this.shareGenerator.generateShareImage(shareData, userId);

      // Delete loading message
      await this.bot.deleteMessage(chatId, loadingMsg.message_id);

      // Send the share image with sharing options
      await this.bot.sendPhoto(chatId, imagePath, {
        caption:
          '🎉 *הנה התמונה שלך!*\n\n' +
          'העתק את ההודעה למטה ושתף עם החברים שלך:\n\n' +
          '━━━━━━━━━━━━\n\n' +
          `🎉 ${shareData.achievement}\n\n` +
          'לומד/ת Markdown שלב אחר שלב עם Markdown Trainer!\n' +
          'ממליץ בחום לכל מי שרוצה לשדרג את הכתיבה הטכנית שלו 👇\n\n' +
          't.me/MarkdownTrainerBot\n\n' +
          '━━━━━━━━━━━━',
        parse_mode: 'Markdown'
      });

      // Clean up image after a delay
      setTimeout(() => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }, 60000); // Delete after 1 minute

    } catch (error) {
      console.error('Error generating share image:', error);
      await this.bot.sendMessage(chatId,
        '❌ אופס! משהו השתבש ביצירת תמונת השיתוף.\n\n' +
        'נסה שוב מאוחר יותר.'
      );
    }
  }

  // ========================================
  // Handle Theme Selection
  // ========================================
  async handleThemeSelection(chatId, userId, data, messageId) {
    // Extract theme ID from callback data: theme_github-dark
    const themeId = data.replace('theme_', '');

    // Update user's theme preference
    this.db.setSandboxTheme(userId, themeId);

    // Get theme display name
    const themeNames = {
      'github-light': 'GitHub Light',
      'github-dark': 'GitHub Dark',
      'light-mode': 'Light Mode',
      'dark-mode': 'Dark Mode',
      'notion': 'Notion Style'
    };
    const themeName = themeNames[themeId] || 'GitHub Light';
    const themeEmojis = {
      'github-light': '☀️',
      'github-dark': '🌙',
      'light-mode': '⚪',
      'dark-mode': '⚫',
      'notion': '📝'
    };
    const emoji = themeEmojis[themeId] || '☀️';

    // Remove the keyboard
    try {
      await this.bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: messageId }
      );
    } catch (error) {
      // Ignore if message is too old or already edited
      console.log('Could not edit message markup:', error.message);
    }

    // Send confirmation
    await this.bot.sendMessage(chatId,
      `${emoji} *ערכת הנושא עודכנה בהצלחה!*\n\n` +
      `ערכת הנושא החדשה: *${themeName}*\n\n` +
      `כל קוד שתשלח עכשיו ב-/sandbox יוצג בסגנון זה. 🎨`,
      { parse_mode: 'Markdown' }
    );
  }

  // ========================================
  // Helper Functions
  // ========================================
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MessageHandler;
