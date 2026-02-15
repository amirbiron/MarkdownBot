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

    const normalizedText = this.reconstructMarkdownFromEntities(text, msg.entities);

    this.db.updateLastActive(userId);

    // Get user's current mode
    const mode = this.db.getUserMode(userId);

    // Check if message is from reply keyboard button (main menu buttons)
    const mainMenuButtons = [
      '📚 שיעור הבא',
      '🧪 מעבדה',
      '🎯 אימון',
      '📊 התקדמות',
      '📋 מדריך מהיר',
      '💡 הידעת?',
      '📚 תבניות',
      '📖 מדריך טלגרם',
      '❓ עזרה'
    ];

    // If user clicked a main menu button while in a special mode, exit that mode first
    if (
      mainMenuButtons.includes(text) &&
      (mode.current_mode === 'sandbox' || mode.current_mode === 'training' || mode.current_mode === 'submitting_template' || mode.current_mode === 'rejecting_template')
    ) {
      // Clear the mode first
      this.db.clearUserMode(userId);

      // Now handle the button press normally
      await this.handleNormalMessage(chatId, userId, text);
      return;
    }

    if (mode.current_mode === 'sandbox') {
      // User is in sandbox mode - render their markdown
      await this.handleSandboxInput(chatId, userId, normalizedText);
    } else if (mode.current_mode === 'training') {
      // User is in training mode - validate their answer
      await this.handleTrainingAnswer(chatId, userId, normalizedText, mode);
    } else if (mode.current_mode === 'submitting_template') {
      // User is submitting a template - collect input step by step
      await this.handleTemplateSubmissionInput(chatId, userId, normalizedText, mode);
    } else if (mode.current_mode === 'rejecting_template') {
      // Admin is rejecting a template - collect rejection reason
      await this.handleRejectTemplateWithReason(chatId, userId, normalizedText, mode);
    } else {
      // Normal conversation mode
      await this.handleNormalMessage(chatId, userId, normalizedText);
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
      // Trim input to avoid accidental indentation (which creates code blocks)
      let cleanMarkdown = this.normalizeSandboxMarkdown(markdownText).trim();

      // 1. Check for wrapped code block with more flexible regex
      // Allows optional language, and tolerant of whitespace/newlines around content
      const codeBlockRegex = /^```(\w*)\s*\n([\s\S]*?)```\s*$/;
      const match = cleanMarkdown.match(codeBlockRegex);

      const mermaidTypes = ['mermaid', 'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'gitGraph', 'mindmap', 'timeline', 'quadrantChart'];

      if (match) {
        // It IS a code block. Unwrap it to inspect content.
        const lang = (match[1] || '').trim().toLowerCase();
        let content = match[2]; // Content inside backticks

        // Remove "mermaid" keyword from the content itself if present at start (sometimes users double it)
        const firstLine = content.trim().split('\n')[0].trim();
        if (firstLine === 'mermaid') {
          content = content.replace(/^\s*mermaid\s*\n?/, '');
        }

        if (lang === 'mermaid' || mermaidTypes.some(type => firstLine.startsWith(type))) {
          // It is mermaid. Ensure it's wrapped in ```mermaid
          cleanMarkdown = '```mermaid\n' + content.trim() + '\n```';
        } else {
          // It's some other code block (or no lang).
          // Unwrap it so marked can render it as elements (e.g. table, headers)
          // UNLESS it looks like mermaid inside but user didn't specify lang?
          const innerFirstLine = content.trim().split('\n')[0].trim();
          if (mermaidTypes.some(type => innerFirstLine.startsWith(type))) {
             cleanMarkdown = '```mermaid\n' + content.trim() + '\n```';
          } else {
             // For tables and images, we generally want them unwrapped to render as HTML elements,
             // NOT as a pre/code block.
             // Ensure surrounding newlines for safety with tables/lists
             cleanMarkdown = '\n' + content.trim() + '\n';
          }
        }
      } else {
        // It is NOT wrapped in a code block.
        // Check if it starts with a mermaid keyword
        const firstLine = cleanMarkdown.trim().split('\n')[0].trim();
        const foundType = mermaidTypes.find(type => firstLine.startsWith(type));
        
        if (foundType) {
          let content = cleanMarkdown.trim();
          // If the type matched is explicitly "mermaid", remove it from the content
          // so we don't duplicate it inside the block or confuse the renderer
          if (firstLine === 'mermaid') {
             content = content.replace(/^mermaid\s*\n?/, '');
          }
          
          // Wrap it!
          cleanMarkdown = '```mermaid\n' + content + '\n```';
        }
        // If not mermaid, leave as is (tables/images work fine as plain text)
      }

      // Render markdown to image
      const imagePath = await this.renderer.renderMarkdown(cleanMarkdown, userId, theme);

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
    } else if (text === '💡 הידעת?') {
      await cmdHandler.handleDidYouKnow(msg);
      return;
    } else if (text === '📚 תבניות') {
      await cmdHandler.handleTemplates(msg);
      return;
    } else if (text === '📖 מדריך טלגרם') {
      await cmdHandler.handleMarkdownGuide(msg);
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
    } else if (data.startsWith('didyouknow_')) {
      await this.handleDidYouKnowNavigation(chatId, userId, data, messageId);
    } else if (data.startsWith('copy_')) {
      await this.handleCopyExample(chatId, userId, data);
    } else if (data.startsWith('download_')) {
      await this.handleTemplateDownload(chatId, userId, data);
    } else if (data === 'back_to_templates') {
      // Re-send the templates menu
      const CommandHandler = require('./commandHandler');
      const cmdHandler = new CommandHandler(this.bot, this.db);
      await cmdHandler.handleTemplates({ chat: { id: chatId }, from: { id: userId } });
    } else if (data.startsWith('community_template_')) {
      await this.handleCommunityTemplateSelection(chatId, userId, data);
    } else if (data.startsWith('template_')) {
      await this.handleTemplateSelection(chatId, userId, data);
    } else if (data.startsWith('tplcat_')) {
      await this.handleTemplateCategorySelection(chatId, userId, data, messageId);
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
    } else if (data.startsWith('review_sub_')) {
      await this.handleReviewSubmission(chatId, userId, data);
    } else if (data.startsWith('approve_sub_')) {
      await this.handleApproveSubmission(chatId, userId, data, messageId);
    } else if (data.startsWith('reject_sub_')) {
      await this.handleRejectSubmission(chatId, userId, data, messageId);
    } else if (data === 'restart_lessons') {
      await this.handleRestartLessons(chatId, userId, messageId);
    }
  }

  // ========================================
  // Restart lessons (reset progress)
  // ========================================
  async handleRestartLessons(chatId, userId, messageId) {
    // Try to remove the inline keyboard to prevent double taps
    try {
      await this.bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: messageId }
      );
    } catch (err) {
      const msg = String(err?.response?.body?.description || err?.message || '').toLowerCase();
      if (!msg.includes('message is not modified')) {
        console.warn('editMessageReplyMarkup failed:', msg);
      }
    }

    const CommandHandler = require('./commandHandler');
    const cmdHandler = new CommandHandler(this.bot, this.db);
    await cmdHandler.handleRestartLessons({ chat: { id: chatId }, from: { id: userId } });
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

      // Show share button only after milestone lessons (7, 12, 15)
      const milestones = [7, 12, 15];
      const shouldShowShare = milestones.includes(lessonId);

      // Prompt for next lesson with optional share button
      const message = 'מוכן/ה להמשיך? שלח /next לשיעור הבא! 🚀';

      if (shouldShowShare) {
        await this.bot.sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔖 שתף את ההישג', callback_data: 'share_lesson' }]
            ]
          }
        });
      } else {
        await this.bot.sendMessage(chatId, message);
      }

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
          '`![תיאור ברור](https://example.com/image.jpg)`\n' +
          '`![טקסט חלופי אמיתי](https://cdn.example.com/team.png)`\n\n' +
          '💡 כתוב טקסט שמתאר מה רואים בתמונה (נגישות!)\n\n' +
          '👇 לחץ על הכפתור להעתקת דוגמה',
        example: '![לוח משימות שבועי](https://placehold.co/600x320?text=Weekly+Tasks)\n![צילום מסך של האפליקציה](https://placehold.co/600x360?text=App+Screen)'
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
  // Handle Did-You-Know carousel navigation
  // ========================================
  async handleDidYouKnowNavigation(chatId, userId, data, messageId) {
    const DidYouKnowData = require('../lessons/didYouKnowData');
    const targetIndex = parseInt(data.replace('didyouknow_', ''), 10);
    const payload = DidYouKnowData.getCardPayload(Number.isNaN(targetIndex) ? 0 : targetIndex);

    if (!payload) {
      return;
    }

    const inlineKeyboard = [
      [
        {
          text: DidYouKnowData.NEXT_BUTTON_TEXT,
          callback_data: `didyouknow_${payload.nextIndex}`
        }
      ]
    ];

    try {
      await this.safeEditMarkdown(chatId, messageId, payload.fact.message, {
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: inlineKeyboard }
      });
    } catch (error) {
      console.error('Error updating Did You Know card:', error && error.message ? error.message : error);
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
      code: {
        preview: 'השתמש בפונקציה `console.log()` להדפסה.',
        copy: '```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```'
      },
      images: {
        copy: '![לוח משימות שבועי](https://placehold.co/600x320?text=Weekly+Tasks)\n![צילום מסך של האפליקציה](https://placehold.co/600x360?text=App+Screen)'
      },
      tables: '| שם | גיל | עיר |\n|:---|:---:|---:|\n| יוסי | 25 | תל אביב |\n| שרה | 30 | ירושלים |',
      tasks: '- [x] למדתי Markdown\n- [x] תרגלתי עם הבוט\n- [ ] בניתי פרויקט משלי',
      lines: 'חלק ראשון\n\n---\n\nחלק שני\n\n***\n\nחלק שלישי'
    };

    const exampleEntry = examples[topic];

    if (exampleEntry) {
      const previewText = typeof exampleEntry === 'string' ? '' : (exampleEntry.preview || '');
      const copyText = typeof exampleEntry === 'string' ? exampleEntry : exampleEntry.copy;

      if (!copyText) {
        return;
      }

      const escapedCopy = this.escapeHtml(copyText);
      let previewSection = '';

      if (previewText) {
        const escapedPreview = this.escapeHtml(previewText).replace(/\n/g, '<br>');
        previewSection = `${escapedPreview}\n\n`;
      }

      const htmlMessage =
        `<b>📋 דוגמה להעתקה:</b>\n` +
        `${previewSection}<pre><code>${escapedCopy}</code></pre>\n\n` +
        '💡 העתק את הטקסט למעלה ונסה אותו ב-/sandbox';

      await this.safeSendHtml(chatId, htmlMessage, { disable_web_page_preview: true });
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
  // Handle Community Template Selection
  // ========================================
  async handleCommunityTemplateSelection(chatId, userId, data) {
    const templateId = data.replace('community_template_', '');

    const template = this.db.getCommunityTemplateById(templateId);

    if (!template) {
      await this.bot.sendMessage(chatId, 'לא נמצאה תבנית זו.');
      return;
    }

    // Increment usage count
    this.db.incrementTemplateUsage(templateId);

    const authorName = template.first_name || template.username || 'קהילה';

    // Send template details
    await this.bot.sendMessage(chatId,
      `📄 *${template.title}*\n\n` +
      `${template.description}\n\n` +
      `קטגוריה: ${template.category}\n` +
      `👤 מאת: ${authorName}\n` +
      `📊 שימושים: ${template.usage_count + 1}`,
      { parse_mode: 'Markdown' }
    );

    await this.sleep(500);

    // Send content
    const content = template.content;
    if (content.length <= 4000) {
      await this.bot.sendMessage(chatId,
        '```markdown\n' + content + '\n```',
        { parse_mode: 'Markdown' }
      );
    } else {
      // Split into chunks
      const chunks = [];
      let currentChunk = '';
      const lines = content.split('\n');

      for (const line of lines) {
        if ((currentChunk + line + '\n').length > 3900) {
          chunks.push(currentChunk);
          currentChunk = line + '\n';
        } else {
          currentChunk += line + '\n';
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      for (let i = 0; i < chunks.length; i++) {
        await this.bot.sendMessage(chatId,
          `*חלק ${i + 1}/${chunks.length}*\n\n` +
          '```markdown\n' + chunks[i] + '\n```',
          { parse_mode: 'Markdown' }
        );
        await this.sleep(500);
      }
    }

    // Send helpful message
    await this.bot.sendMessage(chatId,
      '💡 *איך להשתמש בתבנית:*\n\n' +
      '1. העתק את התוכן למעלה\n' +
      '2. הדבק בעורך טקסט או ב-/sandbox\n' +
      '3. ערוך והתאם לצרכים שלך\n\n' +
      'רוצה תבנית אחרת? שלח /templates',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ חזרה לתבניות', callback_data: 'back_to_templates' }]
          ]
        }
      }
    );
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

  // Attempt to edit message with Markdown, ignoring "message is not modified"
  async safeEditMarkdown(chatId, messageId, text, options = {}) {
    try {
      return await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        ...options
      });
    } catch (err) {
      const desc = String(err?.response?.body?.description || err?.message || '').toLowerCase();
      if (desc.includes('message is not modified')) {
        return null;
      }
      if (desc.includes("can't parse entities") || desc.includes('parse') || desc.includes('entity')) {
        const fallbackOptions = { ...options };
        delete fallbackOptions.parse_mode;
        try {
          return await this.bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            ...fallbackOptions
          });
        } catch (fallbackError) {
          const fallbackDesc = String(fallbackError?.response?.body?.description || fallbackError?.message || '').toLowerCase();
          if (fallbackDesc.includes('message is not modified')) {
            return null;
          }
          throw fallbackError;
        }
      }
      throw err;
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
      `✏️ טיפ קטן: אני מזהה גם תשובות שמעוצבות על ידי טלגרם, ואם התשובה שלך כוללת סימוני Markdown – עטוף את כל ההודעה בתוך בלוק קוד עם שלושה backticks בתחילה ובסוף כדי לשמור על הסימנים.\n\n` +
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

        await this.safeSendMarkdown(chatId,
          `✅ *${currentChallenge.correctFeedback}*\n\n` +
          `📈 התקדמות: ${modeData.challengesCompleted}/${modeData.totalChallenges}`
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

        const escapedReason = validation.reason ? this.escapeMarkdownText(validation.reason) : '';
        await this.safeSendMarkdown(chatId,
          `❌ *${currentChallenge.wrongFeedback}*\n\n` +
          `${escapedReason ? '🔍 ' + escapedReason + '\n\n' : ''}` +
          `💡 רוצה לנסות שוב? שלח תשובה חדשה.\n` +
          `או לחץ על "רמז" לעזרה.`,
          {
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
    await this.safeSendMarkdown(chatId,
      `🎯 *אתגר ${challenge.difficulty === 'easy' ? 'קל' : challenge.difficulty === 'medium' ? 'בינוני' : challenge.difficulty === 'hard' ? 'קשה' : 'מאתגר'}*\n\n` +
      challenge.question,
      {
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

      await this.safeSendMarkdown(chatId,
        `💡 *רמז:*\n${currentChallenge.hint}\n\n` +
        `*דוגמה:*\n\`\`\`\n${currentChallenge.example}\n\`\`\``
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
      const shareMessage =
        `🎉 ${shareData.achievement}\n\n` +
        `לומד/ת Markdown שלב אחר שלב עם Markdown Trainer!\n` +
        `ממליץ בחום לכל מי שרוצה לשדרג את הכתיבה הטכנית שלו 👇\n\n` +
        `t.me/markdown_trainer_bot`;

      await this.bot.sendPhoto(chatId, imagePath, {
        caption:
          '🎉 *הנה התמונה שלך!*\n\n' +
          'העתק את ההודעה למטה ושתף עם החברים שלך:\n\n' +
          '```\n' +
          shareMessage +
          '\n```',
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
  // Template Submission Handlers
  // ========================================

  async handleTemplateSubmissionInput(chatId, userId, text, mode) {
    try {
      const modeData = JSON.parse(mode.mode_data || '{}');
      const step = modeData.step;

      if (step === 'title') {
        // Validate title length
        if (text.length < 3 || text.length > 100) {
          await this.bot.sendMessage(chatId,
            '❌ הכותרת צריכה להיות בין 3 ל-100 תווים.\n\nנסה שוב:'
          );
          return;
        }

        modeData.title = text;
        modeData.step = 'category';
        this.db.setUserMode(userId, 'submitting_template', JSON.stringify(modeData));

        await this.bot.sendMessage(chatId,
          `✅ כותרת נשמרה: "${text}"\n\n` +
          `📝 *שלב 2 מתוך 4: קטגוריה*\n` +
          `בחר קטגוריה באמצעות הכפתורים למטה:`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📋 תיעוד מוצר', callback_data: 'tplcat_product-docs' },
                  { text: '💻 קוד ופיתוח', callback_data: 'tplcat_code-dev' }
                ],
                [
                  { text: '📝 ניהול', callback_data: 'tplcat_management' },
                  { text: '✍️ כתיבה', callback_data: 'tplcat_writing' }
                ],
                [
                  { text: '🎯 אחר', callback_data: 'tplcat_other' }
                ]
              ]
            }
          }
        );

      } else if (step === 'category') {
        // Clean emoji from category if exists
        const category = text.replace(/[^\u0590-\u05fe\u0020-\u007e]/g, '').trim();

        if (category.length < 2) {
          await this.bot.sendMessage(chatId,
            '❌ הקטגוריה צריכה להיות לפחות 2 תווים.\n\nנסה שוב:'
          );
          return;
        }

        modeData.category = category;
        modeData.step = 'description';
        this.db.setUserMode(userId, 'submitting_template', JSON.stringify(modeData));

        await this.bot.sendMessage(chatId,
          `✅ קטגוריה נשמרה: "${category}"\n\n` +
          `📝 *שלב 3 מתוך 4: תיאור*\n` +
          `תאר בקצרה את התבנית (1-2 משפטים).\n` +
          `למשל: "תבנית לדו״ח שבועי עם סיכום משימות וסטטיסטיקות"`,
          { parse_mode: 'Markdown' }
        );

      } else if (step === 'description') {
        if (text.length < 10 || text.length > 200) {
          await this.bot.sendMessage(chatId,
            '❌ התיאור צריך להיות בין 10 ל-200 תווים.\n\nנסה שוב:'
          );
          return;
        }

        modeData.description = text;
        modeData.step = 'content';
        this.db.setUserMode(userId, 'submitting_template', JSON.stringify(modeData));

        await this.bot.sendMessage(chatId,
          `✅ תיאור נשמר!\n\n` +
          `📝 *שלב 4 מתוך 4: תוכן התבנית*\n` +
          `עכשיו שלח את תוכן התבנית ב-Markdown.\n\n` +
          `💡 טיפים:\n` +
          `• השתמש בסוגריים מרובעים [כמו כאן] למקומות למילוי\n` +
          `• הוסף הערות והסברים\n` +
          `• תבנית טובה = קלה להבנה וגמישה`,
          { parse_mode: 'Markdown' }
        );

      } else if (step === 'content') {
        if (text.length < 50) {
          await this.bot.sendMessage(chatId,
            '❌ התוכן קצר מדי. תבנית צריכה להיות לפחות 50 תווים.\n\nנסה שוב:'
          );
          return;
        }

        if (text.length > 10000) {
          await this.bot.sendMessage(chatId,
            '❌ התוכן ארוך מדי. מקסימום 10,000 תווים.\n\nנסה שוב:'
          );
          return;
        }

        // Generate template ID
        const templateId = `community_${Date.now()}_${userId}`;

        // Save submission to database
        this.db.createTemplateSubmission(
          userId,
          templateId,
          modeData.title,
          modeData.category,
          modeData.description,
          text
        );

        // Clear user mode
        this.db.clearUserMode(userId);

        await this.bot.sendMessage(chatId,
          `🎉 *תבנית נשלחה בהצלחה!*\n\n` +
          `תודה על התרומה לקהילה! 🙏\n\n` +
          `התבנית שלך תיבדק ותאושר בקרוב.\n` +
          `תקבל הודעה כשהיא תאושר!\n\n` +
          `צפה בהגשות שלך עם \`/my_submissions\``,
          { parse_mode: 'Markdown' }
        );

        // Notify admins about new submission
        await this.notifyAdminsNewSubmission(modeData.title, userId);
      }

    } catch (error) {
      console.error('Error handling template submission input:', error);
      await this.bot.sendMessage(chatId,
        '❌ אופס! משהו השתבש.\n\n' +
        'נסה שוב או שלח /cancel_submission לביטול.'
      );
    }
  }

  /**
   * Handle category selection via inline keyboard during template submission.
   */
  async handleTemplateCategorySelection(chatId, userId, data, messageId) {
    // Map callback keys to human-readable Hebrew categories
    const categoryMap = {
      'tplcat_product-docs': 'תיעוד מוצר',
      'tplcat_code-dev': 'קוד ופיתוח',
      'tplcat_management': 'ניהול',
      'tplcat_writing': 'כתיבה',
      'tplcat_other': 'אחר'
    };

    const key = data;
    const picked = categoryMap[key];
    if (!picked) {
      return; // Unknown key; ignore silently
    }

    // Try to remove the inline keyboard to prevent double taps
    try {
      await this.bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
    } catch (err) {
      const msg = String(err?.response?.body?.description || err?.message || '').toLowerCase();
      if (!msg.includes('message is not modified')) {
        // Only ignore the benign case
        console.warn('editMessageReplyMarkup failed:', msg);
      }
    }

    // Load mode; ensure we are indeed in submitting_template flow
    const mode = this.db.getUserMode(userId);
    if (mode.current_mode !== 'submitting_template') {
      return;
    }

    const modeData = JSON.parse(mode.mode_data || '{}');
    // Only proceed if waiting for category
    if (modeData.step !== 'category') {
      return;
    }

    // Persist category and advance to next step
    modeData.category = picked;
    modeData.step = 'description';
    this.db.setUserMode(userId, 'submitting_template', JSON.stringify(modeData));

    await this.bot.sendMessage(chatId,
      `✅ קטגוריה נשמרה: "${picked}"\n\n` +
      `📝 *שלב 3 מתוך 4: תיאור*\n` +
      `תאר בקצרה את התבנית (1-2 משפטים).\n` +
      `למשל: "תבנית לדו״ח שבועי עם סיכום משימות וסטטיסטיקות"`,
      { parse_mode: 'Markdown' }
    );
  }

  async notifyAdminsNewSubmission(title, userId) {
    const admins = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

    for (const adminId of admins) {
      try {
        await this.safeSendMarkdown(
          adminId,
          `🆕 *תבנית חדשה נשלחה לאישור*\n\n` +
          `כותרת: ${title}\n` +
          `מאת: משתמש ${userId}\n\n` +
          `שלח /review_templates לבדיקה`
        );
      } catch (error) {
        console.log(`Could not notify admin ${adminId}:`, error.message);
      }
    }
  }

  async handleReviewSubmission(chatId, userId, data) {
    const submissionId = parseInt(data.replace('review_sub_', ''));
    const submission = this.db.getTemplateSubmissionById(submissionId);

    if (!submission) {
      await this.bot.sendMessage(chatId, '❌ ההגשה לא נמצאה.');
      return;
    }

    const authorName = submission.first_name || submission.username || `משתמש ${submission.user_id}`;

    // Send submission details
    await this.safeSendMarkdown(
      chatId,
      `📋 *סקירת תבנית*\n\n` +
      `*כותרת:* ${submission.title}\n` +
      `*קטגוריה:* ${submission.category}\n` +
      `*תיאור:* ${submission.description}\n` +
      `*מאת:* ${authorName}\n` +
      `*תאריך:* ${new Date(submission.submitted_at).toLocaleDateString('he-IL')}\n\n` +
      `התוכן יישלח בהודעה הבאה...`
    );

    await this.sleep(500);

    // Send content
    const content = submission.content;
    if (content.length <= 4000) {
      await this.safeSendMarkdown(
        chatId,
        '```markdown\n' + content + '\n```'
      );
    } else {
      // Split into chunks
      const chunks = [];
      let currentChunk = '';
      const lines = content.split('\n');

      for (const line of lines) {
        if ((currentChunk + line + '\n').length > 3900) {
          chunks.push(currentChunk);
          currentChunk = line + '\n';
        } else {
          currentChunk += line + '\n';
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      for (let i = 0; i < chunks.length; i++) {
        await this.safeSendMarkdown(
          chatId,
          `*חלק ${i + 1}/${chunks.length}*\n\n` +
          '```markdown\n' + chunks[i] + '\n```'
        );
        await this.sleep(500);
      }
    }

    await this.sleep(500);

    // Send approval/rejection buttons
    await this.safeSendMarkdown(chatId, `*מה תרצה לעשות?*`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ אשר תבנית', callback_data: `approve_sub_${submissionId}` },
            { text: '❌ דחה תבנית', callback_data: `reject_sub_${submissionId}` }
          ]
        ]
      }
    });
  }

  async handleApproveSubmission(chatId, userId, data, messageId) {
    const submissionId = parseInt(data.replace('approve_sub_', ''));
    const submission = this.db.getTemplateSubmissionById(submissionId);

    if (!submission) {
      await this.bot.sendMessage(chatId, '❌ ההגשה לא נמצאה.');
      return;
    }

    try {
      // Approve the submission
      this.db.approveTemplateSubmission(submissionId, userId);

      // Remove buttons
      try {
        await this.bot.editMessageReplyMarkup(
          { inline_keyboard: [] },
          { chat_id: chatId, message_id: messageId }
        );
      } catch (e) {
        // Ignore if message is too old
      }

    await this.safeSendMarkdown(
      chatId,
      `✅ *התבנית אושרה!*\n\n` +
      `התבנית "${submission.title}" עכשיו זמינה לכל המשתמשים בספרייה הקהילתית!`
    );

      // Notify the author
      try {
        await this.safeSendMarkdown(
          submission.user_id,
          `🎉 *מזל טוב!*\n\n` +
          `התבנית שלך "${submission.title}" אושרה!\n\n` +
          `היא עכשיו זמינה לכל המשתמשים ב-/templates\n\n` +
          `תודה על התרומה לקהילה! 💚`
        );
      } catch (error) {
        console.log(`Could not notify author ${submission.user_id}:`, error.message);
      }

    } catch (error) {
      console.error('Error approving submission:', error);
      await this.bot.sendMessage(chatId,
        '❌ שגיאה באישור התבנית. נסה שוב.'
      );
    }
  }

  async handleRejectSubmission(chatId, userId, data, messageId) {
    const submissionId = parseInt(data.replace('reject_sub_', ''));
    const submission = this.db.getTemplateSubmissionById(submissionId);

    if (!submission) {
      await this.bot.sendMessage(chatId, '❌ ההגשה לא נמצאה.');
      return;
    }

    // Ask for rejection reason
    await this.bot.sendMessage(chatId,
      `❌ *דחיית תבנית*\n\n` +
      `שלח את הסיבה לדחייה (תישלח למשתמש).\n\n` +
      `או שלח "ללא סיבה" אם אין צורך בהסבר.`,
      { parse_mode: 'Markdown' }
    );

    // Set mode to collect rejection reason
    this.db.setUserMode(userId, 'rejecting_template', JSON.stringify({ submissionId, messageId }));
  }

  async handleRejectTemplateWithReason(chatId, userId, text, mode) {
    try {
      const modeData = JSON.parse(mode.mode_data);
      const submissionId = modeData.submissionId;
      const submission = this.db.getTemplateSubmissionById(submissionId);

      if (!submission) {
        await this.bot.sendMessage(chatId, '❌ ההגשה לא נמצאה.');
        this.db.clearUserMode(userId);
        return;
      }

      const reason = text === 'ללא סיבה' ? null : text;

      // Reject the submission
      this.db.rejectTemplateSubmission(submissionId, userId, reason);

      // Clear user mode
      this.db.clearUserMode(userId);

      // Remove buttons from original message
      if (modeData.messageId) {
        try {
          await this.bot.editMessageReplyMarkup(
            { inline_keyboard: [] },
            { chat_id: chatId, message_id: modeData.messageId }
          );
        } catch (e) {
          // Ignore if message is too old
        }
      }

    await this.safeSendMarkdown(
      chatId,
      `❌ *התבנית נדחתה*\n\n` +
      `התבנית "${submission.title}" נדחתה.\n` +
      (reason ? `סיבה: ${reason}` : '')
    );

      // Notify the author
      try {
        await this.safeSendMarkdown(
          submission.user_id,
          `😞 *התבנית שלך נדחתה*\n\n` +
          `התבנית "${submission.title}" לא אושרה להוספה לספרייה.\n\n` +
          (reason ? `*סיבה:* ${reason}\n\n` : '') +
          `אל תיואש! תוכל לשפר ולשלוח שוב עם /submit_template`
        );
      } catch (error) {
        console.log(`Could not notify author ${submission.user_id}:`, error.message);
      }

    } catch (error) {
      console.error('Error rejecting template:', error);
      await this.bot.sendMessage(chatId,
        '❌ שגיאה בדחיית התבנית. נסה שוב.'
      );
      this.db.clearUserMode(userId);
    }
  }

  // ========================================
  // Helper Functions
  // ========================================
  normalizeSandboxMarkdown(text = '') {
    if (!text) return '';
    return String(text)
      .replace(/\r\n/g, '\n')
      .replace(/[\u200f\u200e]/g, '')
      .replace(/\ufeff/g, '');
  }

  escapeHtml(text = '') {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  stripHtmlTags(text = '') {
    return String(text).replace(/<[^>]*>/g, '');
  }

  async safeSendHtml(chatId, html, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, html, { parse_mode: 'HTML', ...options });
    } catch (err) {
      const desc = String(err?.response?.body?.description || err?.message || '').toLowerCase();
      if (desc.includes('parse') || desc.includes('entity')) {
        const plain = this.stripHtmlTags(html)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, '\'');
        const fallbackOptions = { ...options };
        delete fallbackOptions.parse_mode;
        return await this.bot.sendMessage(chatId, plain, fallbackOptions);
      }
      throw err;
    }
  }

  escapeMarkdownText(text = '') {
    return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }

  reconstructMarkdownFromEntities(text, entities = []) {
    if (!text || !Array.isArray(entities) || entities.length === 0) {
      return text;
    }

    const openMap = Object.create(null);
    const closeMap = Object.create(null);

    const getPriority = (type) => {
      switch (type) {
        case 'pre':
          return 0;
        case 'code':
          return 10;
        case 'bold':
          return 20;
        case 'italic':
          return 30;
        case 'underline':
          return 40;
        case 'strikethrough':
          return 50;
        case 'text_link':
        case 'text_mention':
          return 60;
        case 'spoiler':
          return 70;
        default:
          return 100;
      }
    };

    for (const entity of entities) {
      if (!entity || typeof entity.offset !== 'number' || typeof entity.length !== 'number') {
        continue;
      }

      const start = entity.offset;
      const end = entity.offset + entity.length;

      if (start < 0 || end > text.length || start >= end) {
        continue;
      }

      let openWrapper = '';
      let closeWrapper = '';

      switch (entity.type) {
        case 'bold':
          openWrapper = '**';
          closeWrapper = '**';
          break;
        case 'italic':
          openWrapper = '*';
          closeWrapper = '*';
          break;
        case 'underline':
          openWrapper = '__';
          closeWrapper = '__';
          break;
        case 'strikethrough':
          openWrapper = '~~';
          closeWrapper = '~~';
          break;
        case 'code':
          // If Telegram marked a multi-line segment as "code", wrap it as a fenced block.
          // This plays nicer with the /sandbox flow (we often want to unwrap code formatting
          // and render the content as real Markdown, e.g. task lists / tables).
          if (String(text).slice(start, end).includes('\n')) {
            openWrapper = '```\n';
            closeWrapper = '\n```';
          } else {
            openWrapper = '`';
            closeWrapper = '`';
          }
          break;
        case 'pre': {
          const language = entity.language ? String(entity.language).trim() : '';
          openWrapper = '```' + (language || '') + '\n';
          closeWrapper = '\n```';
          break;
        }
        case 'spoiler':
          openWrapper = '||';
          closeWrapper = '||';
          break;
        case 'text_link':
          if (entity.url) {
            openWrapper = '[';
            closeWrapper = `](${entity.url})`;
          }
          break;
        case 'text_mention':
          if (entity.user && entity.user.id) {
            openWrapper = '[';
            closeWrapper = `](tg://user?id=${entity.user.id})`;
          }
          break;
        default:
          break;
      }

      if (!openWrapper && !closeWrapper) {
        continue;
      }

      const priority = getPriority(entity.type);

      if (!openMap[start]) openMap[start] = [];
      if (!closeMap[end]) closeMap[end] = [];

      openMap[start].push({ text: openWrapper, priority });
      closeMap[end].push({ text: closeWrapper, priority });
    }

    let result = '';

    for (let i = 0; i < text.length; i++) {
      if (closeMap[i]) {
        closeMap[i].sort((a, b) => b.priority - a.priority);
        for (const closer of closeMap[i]) {
          result += closer.text;
        }
      }

      if (openMap[i]) {
        openMap[i].sort((a, b) => a.priority - b.priority);
        for (const opener of openMap[i]) {
          result += opener.text;
        }
      }

      result += text[i];
    }

    if (closeMap[text.length]) {
      closeMap[text.length].sort((a, b) => b.priority - a.priority);
      for (const closer of closeMap[text.length]) {
        result += closer.text;
      }
    }

    return result;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MessageHandler;
