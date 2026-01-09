// Training Challenges Data - מאגר אתגרי האימון הממוקד

/**
 * מבנה אתגר:
 * - id: מזהה ייחודי
 * - topic: נושא האתגר (tables, links-images, advanced-lists, mermaid)
 * - difficulty: רמת קושי (easy, medium, hard, very-hard)
 * - question: תיאור האתגר
 * - validationRules: כללי בדיקה (מה חייב להופיע בתשובה)
 * - hint: רמז עזרה
 * - correctFeedback: משוב על תשובה נכונה
 * - wrongFeedback: משוב על תשובה שגויה
 * - example: דוגמת פתרון
 */

const challenges = {
  // ====================================
  // 📊 Tables - טבלאות
  // ====================================
  tables: [
    {
      id: 'table_easy_1',
      topic: 'tables',
      difficulty: 'easy',
      question: '📊 *אתגר קל - טבלה בסיסית*\n\nצור טבלה עם 2 עמודות ו-2 שורות.\nהעמודות: "שם" ו-"גיל"\nהשורה הראשונה: "יוסי" בן 25',
      validationRules: {
        mustInclude: ['|', 'שם', 'גיל', 'יוסי', '25'],
        minLines: 3, // header + separator + 1 row
        mustHaveSeparator: true
      },
      hint: 'זכור: שורת כותרת, שורת מפריד עם מקפים, ושורת נתונים',
      correctFeedback: 'מצוין! יצרת טבלה פשוטה בהצלחה. זה הבסיס לכל הטבלאות ב-Markdown.',
      wrongFeedback: 'כמעט! טבלה צריכה שורת כותרת, שורת מפריד (|---|---|) ושורות נתונים.',
      example: '| שם | גיל |\n|-----|-----|\n| יוסי | 25 |'
    },
    {
      id: 'table_easy_2',
      topic: 'tables',
      difficulty: 'easy',
      question: '📊 *אתגר קל - הוספת שורה*\n\nצור טבלה עם 3 עמודות: "מוצר", "מחיר", "כמות"\nהוסף 2 שורות עם מוצרים לבחירתך.',
      validationRules: {
        mustInclude: ['|', 'מוצר', 'מחיר', 'כמות'],
        minLines: 4 // header + separator + 2 rows
      },
      hint: 'כל שורה מתחילה ומסתיימת ב-|, ותאים מופרדים ב-|',
      correctFeedback: 'יפה! שלטת ביצירת טבלה עם מספר שורות.',
      wrongFeedback: 'נסה שוב. ודא ש-3 עמודות ו-2 שורות של נתונים.',
      example: '| מוצר | מחיר | כמות |\n|------|------|------|\n| תפוח | 5 | 10 |\n| בננה | 3 | 15 |'
    },
    {
      id: 'table_medium_1',
      topic: 'tables',
      difficulty: 'medium',
      question: '📊 *אתגר בינוני - יישור*\n\nצור טבלה עם 3 עמודות: "שם", "ציון", "הערות"\n- יישר את "שם" לשמאל (:---)\n- יישר את "ציון" למרכז (:---:)\n- יישר את "הערות" לימין (---:)\n\nהוסף שורה אחת עם נתונים.',
      validationRules: {
        mustInclude: ['|', 'שם', 'ציון', 'הערות', ':---', ':---:', '---:'],
        minLines: 3
      },
      hint: 'הסימנים : קובעים את כיוון היישור בשורת המפריד',
      correctFeedback: 'מעולה! שלטת ביישור עמודות - מיומנות חשובה לטבלאות מקצועיות.',
      wrongFeedback: 'שים לב ליישור: :--- (שמאל), :---: (מרכז), ---: (ימין)',
      example: '| שם | ציון | הערות |\n|:---|:---:|---:|\n| דני | 95 | מצוין |'
    },
    {
      id: 'table_hard_1',
      topic: 'tables',
      difficulty: 'hard',
      question: '📊 *אתגר מתקדם - טבלה מורכבת*\n\nצור טבלה של לוח זמנים שבועי:\n- 4 עמודות: "יום", "בוקר", "צהריים", "ערב"\n- 3 שורות (3 ימים)\n- השתמש ביישור מרכז לכל העמודות\n- הוסף תוכן משמעותי (פעילויות/שיעורים)',
      validationRules: {
        mustInclude: ['|', 'יום', ':---:'],
        minLines: 5 // header + separator + 3 days
      },
      hint: 'לוח זמנים צריך להיות ברור וקריא. השתמש ב-:---: ליישור מרכז בכל העמודות.',
      correctFeedback: 'יפה מאוד! יצרת טבלה מורכבת ומעוצבת. זה כבר ברמה מקצועית!',
      wrongFeedback: 'קרוב! ודא שיש 4 עמודות, 3 שורות, ויישור מרכז לכולם.',
      example: '| יום | בוקר | צהריים | ערב |\n|:---:|:---:|:---:|:---:|\n| ראשון | ספורט | עבודה | מנוחה |\n| שני | לימודים | פגישות | קריאה |\n| שלישי | קניות | בישול | סרט |'
    }
  ],

  // ====================================
  // 🔗 Links and Images - קישורים ותמונות
  // ====================================
  'links-images': [
    {
      id: 'link_easy_1',
      topic: 'links-images',
      difficulty: 'easy',
      question: '🔗 *אתגר קל - קישור פשוט*\n\nצור קישור לאתר גוגל (https://google.com) עם הטקסט "חיפוש בגוגל"',
      validationRules: {
        mustInclude: ['[', ']', '(', ')', 'google.com'],
        pattern: /\[.+\]\(.+\)/
      },
      hint: 'התחביר: [טקסט לתצוגה](כתובת URL)',
      correctFeedback: 'נהדר! יצרת קישור בסיסי. זה השימוש הנפוץ ביותר ב-Markdown.',
      wrongFeedback: 'זכור: הטקסט בסוגריים מרובעים [], וה-URL בסוגריים עגולים ()',
      example: '[חיפוש בגוגל](https://google.com)'
    },
    {
      id: 'link_easy_2',
      topic: 'links-images',
      difficulty: 'easy',
      question: '🖼️ *אתגר קל - הוספת תמונה*\n\nהוסף תמונה עם התיאור "לוגו החברה" מהכתובת:\nhttps://via.placeholder.com/150',
      validationRules: {
        mustInclude: ['![', ']', '(', ')', 'placeholder'],
        pattern: /!\[.+\]\(.+\)/
      },
      hint: 'תמונה זה כמו קישור, רק עם ! בהתחלה',
      correctFeedback: 'מושלם! הוספת תמונה ב-Markdown - כמו קישור עם סימן קריאה.',
      wrongFeedback: 'זכור: תמונה מתחילה ב-! ואז [תיאור](כתובת)',
      example: '![לוגו החברה](https://via.placeholder.com/150)'
    },
    {
      id: 'link_medium_1',
      topic: 'links-images',
      difficulty: 'medium',
      question: '🔗 *אתגר בינוני - קישורים מרובים*\n\nצור פסקה עם 3 קישורים שונים:\n1. קישור ל-GitHub\n2. קישור ל-Stack Overflow\n3. קישור לאתר לבחירתך\n\nהטקסט: "למדתי דרך [GitHub], [Stack Overflow] ו[אתר נוסף]"',
      validationRules: {
        mustInclude: ['[', ']', '(', ')'],
        minLinks: 3
      },
      hint: 'אפשר לשלב כמה קישורים במשפט אחד. כל אחד עם הסינטקס [טקסט](url)',
      correctFeedback: 'כל הכבוד! שילבת מספר קישורים בטקסט אחד בצורה טבעית.',
      wrongFeedback: 'נסה ליצור 3 קישורים נפרדים באותה שורה.',
      example: 'למדתי דרך [GitHub](https://github.com), [Stack Overflow](https://stackoverflow.com) ו[MDN](https://developer.mozilla.org)'
    },
    {
      id: 'link_hard_1',
      topic: 'links-images',
      difficulty: 'hard',
      question: '🔗 *אתגר מתקדם - קישורי הפניה*\n\nצור 3 קישורים בסגנון הפניה (reference-style):\n1. קישור לדוקומנטציה עם מזהה [docs]\n2. קישור לפורום עם מזהה [forum]\n3. קישור לבלוג עם מזהה [blog]\n\nהגדר את כל ההפניות בסוף.',
      validationRules: {
        mustInclude: ['[docs]', '[forum]', '[blog]', ':'],
        pattern: /\[.+\]:\s*https?:\/\//
      },
      hint: 'סגנון הפניה: [טקסט][ref] ובסוף: [ref]: url',
      correctFeedback: 'מרשים! שלטת בקישורי הפניה - שיטה מתקדמת לארגון קישורים.',
      wrongFeedback: 'זכור: בטקסט [טקסט][מזהה], ובסוף [מזהה]: כתובת',
      example: 'ראה [דוקומנטציה][docs], [פורום][forum] ו[בלוג][blog]\n\n[docs]: https://docs.example.com\n[forum]: https://forum.example.com\n[blog]: https://blog.example.com'
    }
  ],

  // ====================================
  // 📋 Advanced Lists - רשימות מתקדמות
  // ====================================
  'advanced-lists': [
    {
      id: 'list_easy_1',
      topic: 'advanced-lists',
      difficulty: 'easy',
      question: '📋 *אתגר קל - רשימה עם תתי-רשימה*\n\nצור רשימה של פירות עם תתי-רשימה:\n- פירות\n  - תפוח\n  - בננה\n- ירקות\n  - עגבנייה',
      validationRules: {
        mustInclude: ['-', 'פירות', 'תפוח', 'בננה', 'ירקות'],
        hasIndentation: true
      },
      hint: 'תת-רשימה נוצרת עם 2 רווחים לפני ה-',
      correctFeedback: 'מעולה! יצרת היררכיה ברשימה עם הזחה נכונה.',
      wrongFeedback: 'זכור: תת-פריטים צריכים 2 רווחים לפני ה-',
      example: '- פירות\n  - תפוח\n  - בננה\n- ירקות\n  - עגבנייה'
    },
    {
      id: 'list_medium_1',
      topic: 'advanced-lists',
      difficulty: 'medium',
      question: '📋 *אתגר בינוני - רשימה מעורבת*\n\nצור רשימה ממוספרת עם תת-רשימות לא ממוספרות:\n1. משימה ראשונה\n   - תת-משימה א\n   - תת-משימה ב\n2. משימה שנייה\n   - תת-משימה ג',
      validationRules: {
        mustInclude: ['1.', '2.', '-'],
        hasNumberedAndBulleted: true
      },
      hint: 'אפשר לשלב רשימה ממוספרת (1.) עם תת-רשימות לא ממוספרות (-)',
      correctFeedback: 'יפה! שילבת רשימות ממוספרות ולא ממוספרות בהצלחה.',
      wrongFeedback: 'נסה שוב. הרשימה הראשית ממוספרת (1. 2.) והתתיות עם מקף (-)',
      example: '1. משימה ראשונה\n   - תת-משימה א\n   - תת-משימה ב\n2. משימה שנייה\n   - תת-משימה ג'
    },
    {
      id: 'list_medium_2',
      topic: 'advanced-lists',
      difficulty: 'medium',
      question: '✅ *אתגר בינוני - רשימת משימות*\n\nצור רשימת משימות (checklist) עם 4 פריטים:\n- 2 משימות שהושלמו (מסומנות)\n- 2 משימות שעדיין פתוחות',
      validationRules: {
        mustInclude: ['- [x]', '- [ ]'],
        minCheckboxes: 4
      },
      hint: 'רשימת משימות: - [ ] לא הושלם, - [x] הושלם',
      correctFeedback: 'כל הכבוד! שלטת ברשימות משימות - כלי מעולה למעקב אחר התקדמות.',
      wrongFeedback: 'זכור: - [ ] למשימה פתוחה, - [x] למשימה שהושלמה',
      example: '- [x] למדתי Markdown\n- [x] תרגלתי עם הבוט\n- [ ] בניתי פרויקט\n- [ ] שיתפתי עם אחרים'
    },
    {
      id: 'list_hard_1',
      topic: 'advanced-lists',
      difficulty: 'hard',
      question: '📋 *אתגר מתקדם - רשימה היררכית עמוקה*\n\nצור מבנה פרויקט עם 3 רמות עומק:\n- Frontend\n  - React\n    - Components\n    - Hooks\n  - CSS\n- Backend\n  - Node.js\n    - Express\n    - Database',
      validationRules: {
        mustInclude: ['-', 'Frontend', 'Backend'],
        minDepthLevels: 3
      },
      hint: 'כל רמת עומק = 2 רווחים נוספים. רמה 1: -, רמה 2: 2 רווחים+-, רמה 3: 4 רווחים+-',
      correctFeedback: 'מדהים! יצרת היררכיה עמוקה ומובנית - ברמה מקצועית!',
      wrongFeedback: 'שים לב למספר הרווחים: רמה 1=0, רמה 2=2, רמה 3=4',
      example: '- Frontend\n  - React\n    - Components\n    - Hooks\n  - CSS\n- Backend\n  - Node.js\n    - Express\n    - Database'
    }
  ],

  // ====================================
  // ✨ Text Formatting - עיצוב טקסט
  // ====================================
  'text-formatting': [
    {
      id: 'format_easy_1',
      topic: 'text-formatting',
      difficulty: 'easy',
      question: '✨ *אתגר קל - הדגשה בסיסית*\n\nעצב את המשפט הבא כך שהמילה "חשוב" תהיה מודגשת (bold):\n"זה טקסט חשוב מאוד"',
      validationRules: {
        mustInclude: ['**חשוב**', 'זה טקסט'],
        pattern: /\*\*חשוב\*\*/
      },
      hint: 'הדגשה נוצרת עם שתי כוכביות לפני ואחרי: **טקסט**',
      correctFeedback: 'מצוין! ידעת להדגיש טקסט נכון.',
      wrongFeedback: 'נסה שוב. זכור: **טקסט** להדגשה.',
      example: 'זה טקסט **חשוב** מאוד'
    },
    {
      id: 'format_easy_2',
      topic: 'text-formatting',
      difficulty: 'easy',
      question: '✨ *אתגר קל - טקסט נטוי*\n\nעצב את המשפט הבא כך שהמילה "מיוחד" תהיה בנטוי (italic):\n"זה יום מיוחד"',
      validationRules: {
        mustInclude: ['*מיוחד*', 'זה יום'],
        pattern: /\*מיוחד\*/
      },
      hint: 'נטוי נוצר עם כוכבית אחת לפני ואחרי: *טקסט*',
      correctFeedback: 'יפה! יצרת טקסט נטוי.',
      wrongFeedback: 'זכור: *טקסט* לנטוי (כוכבית אחת).',
      example: 'זה יום *מיוחד*'
    },
    {
      id: 'format_medium_1',
      topic: 'text-formatting',
      difficulty: 'medium',
      question: '✨ *אתגר בינוני - שילוב הדגשות*\n\nעצב את המשפט הבא:\n- המילה "מאוד" - מודגשת\n- המילה "חשוב" - נטויה\n- המילה "לקרוא" - מודגשת ונטויה\n\n"זה מאוד חשוב לקרוא את המסמך"',
      validationRules: {
        mustInclude: ['**מאוד**', '*חשוב*', '***לקרוא***'],
        minPatterns: 3
      },
      hint: 'שלוש כוכביות (***) ליצירת מודגש+נטוי',
      correctFeedback: 'מעולה! שילבת סוגי עיצוב שונים.',
      wrongFeedback: 'זכור: ** למודגש, * לנטוי, *** לשניהם.',
      example: 'זה **מאוד** *חשוב* ***לקרוא*** את המסמך'
    },
    {
      id: 'format_medium_2',
      topic: 'text-formatting',
      difficulty: 'medium',
      question: '✨ *אתגר בינוני - קוד בתוך משפט*\n\nעצב את המשפט הבא כך שהפונקציה תוצג כקוד:\n"השתמש בפונקציה console.log להדפסה"',
      validationRules: {
        mustInclude: ['`console.log`', 'השתמש'],
        pattern: /`console\.log`/
      },
      hint: 'קוד בתוך משפט נוצר עם backticks: `קוד`',
      correctFeedback: 'נהדר! ידעת לעצב קוד בתוך משפט.',
      wrongFeedback: 'זכור: `קוד` עם backticks (לא גרש רגיל).',
      example: 'השתמש בפונקציה `console.log` להדפסה'
    },
    {
      id: 'format_hard_1',
      topic: 'text-formatting',
      difficulty: 'hard',
      question: '✨ *אתגר קשה - ציטוט מעוצב*\n\nצור ציטוט (blockquote) שמכיל:\n- שורה ראשונה: "זה ציטוט חשוב" (חשוב מודגש)\n- שורה שנייה: "מאת פלוני" (פלוני בנטוי)',
      validationRules: {
        mustInclude: ['>', '**חשוב**', '*פלוני*'],
        hasBlockquote: true
      },
      hint: 'ציטוט מתחיל ב->, ואפשר להוסיף עיצוב בתוכו',
      correctFeedback: 'מצוין! שילבת ציטוט עם עיצוב טקסט.',
      wrongFeedback: 'זכור: > בתחילת שורה לציטוט, ואפשר להוסיף ** ו-* בתוכו.',
      example: '> זה ציטוט **חשוב**\n> *מאת פלוני*'
    }
  ],

  // ====================================
  // 🐛 Bug Detection - איתור באגים
  // ====================================
  'bug-detection': [
    {
      id: 'bug_easy_1',
      topic: 'bug-detection',
      difficulty: 'easy',
      question: '🐛 *אתגר קל - תיקון כותרת*\n\nמה לא בסדר בכותרת הזו?\n`#כותרת ראשית`\n\nתקן את הבעיה.',
      validationRules: {
        mustInclude: ['#', 'כותרת', ' '],
        pattern: /# כותרת/
      },
      hint: 'כותרת צריכה רווח אחרי ה-#',
      correctFeedback: 'נכון! חייב רווח אחרי הסימן #.',
      wrongFeedback: 'זכור: # רווח טקסט',
      example: '# כותרת ראשית'
    },
    {
      id: 'bug_easy_2',
      topic: 'bug-detection',
      difficulty: 'easy',
      question: '🐛 *אתגר קל - תיקון רשימה*\n\nמה לא בסדר ברשימה הזו?\n`-פריט ראשון\n-פריט שני`\n\nתקן את הבעיה.',
      validationRules: {
        mustInclude: ['- ', 'פריט ראשון'],
        pattern: /- פריט/
      },
      hint: 'רשימה צריכה רווח אחרי ה--',
      correctFeedback: 'מעולה! רשימה צריכה רווח אחרי המקף.',
      wrongFeedback: 'זכור: - רווח טקסט',
      example: '- פריט ראשון\n- פריט שני'
    },
    {
      id: 'bug_medium_1',
      topic: 'bug-detection',
      difficulty: 'medium',
      question: '🐛 *אתגר בינוני - קישור שבור*\n\nמה לא בסדר בקישור הזה?\n`[גוגל](www.google.com)`\n\nתקן את הבעיה.',
      validationRules: {
        mustInclude: ['[גוגל]', 'https://'],
        pattern: /https?:\/\//
      },
      hint: 'כתובת URL צריכה להתחיל ב-http:// או https://',
      correctFeedback: 'נכון! URL צריך פרוטוקול (https://).',
      wrongFeedback: 'זכור: כתובת צריכה להתחיל ב-https://',
      example: '[גוגל](https://www.google.com)'
    },
    {
      id: 'bug_hard_1',
      topic: 'bug-detection',
      difficulty: 'hard',
      question: '🐛 *אתגר קשה - טבלה שבורה*\n\nתקן את הטבלה הזו:\n```\n| שם | גיל\n|---|---|\n| יוסי | 25 |\n```',
      validationRules: {
        mustInclude: ['| שם |', '| גיל |', '|---|'],
        pattern: /\| גיל \|/
      },
      hint: 'כל שורה בטבלה צריכה להתחיל ולהסתיים ב-|',
      correctFeedback: 'מצוין! תיקנת את הטבלה.',
      wrongFeedback: 'שורת הכותרות צריכה | בהתחלה ובסוף.',
      example: '| שם | גיל |\n|---|---|\n| יוסי | 25 |'
    }
  ],

  // ====================================
  // 📈 Mermaid - דיאגרמות
  // ====================================
  mermaid: [
    {
      id: 'mermaid_easy_1',
      topic: 'mermaid',
      difficulty: 'easy',
      question: '📈 *אתגר קל - תרשים זרימה פשוט*\n\nצור תרשים זרימה (flowchart) עם 3 צמתים:\nהתחלה → עיבוד → סיום\n\nהשתמש בסינטקס:\n```mermaid\nflowchart LR\n```',
      validationRules: {
        mustInclude: ['```mermaid', 'flowchart', '-->'],
        hasMermaidBlock: true
      },
      hint: 'תרשים זרימה: flowchart LR\nA[התחלה] --> B[עיבוד]',
      correctFeedback: 'יפה! יצרת תרשים זרימה בסיסי - דרך מעולה להמחיש תהליכים.',
      wrongFeedback: 'זכור: פתח בלוק mermaid עם שלוש backticks + המילה mermaid וסגור אותו שוב בשלוש backticks. השתמש ב--> כדי לחבר בין הצמתים.',
      example: '```mermaid\nflowchart LR\n    A[התחלה] --> B[עיבוד]\n    B --> C[סיום]\n```'
    },
    {
      id: 'mermaid_medium_1',
      topic: 'mermaid',
      difficulty: 'medium',
      question: '📈 *אתגר בינוני - תרשים זרימה עם תנאי*\n\nצור תרשים זרימה עם החלטה:\nהתחלה → בדיקה → (אם כן → הצלחה, אם לא → כישלון)\n\nהשתמש בצורות שונות:\n- [] למלבן רגיל\n- {} למעויין (החלטה)',
      validationRules: {
        mustInclude: ['```mermaid', 'flowchart', '{}', '-->'],
        hasDecisionNode: true
      },
      hint: 'מעויין להחלטה: {טקסט}, חיצים עם תווית: -->|כן| B',
      correctFeedback: 'מעולה! שילבת צמתי החלטה בתרשים - זה כבר ברמה מקצועית.',
      wrongFeedback: 'נסה להשתמש ב-{} להחלטה ובחיצים עם תוויות כן/לא',
      example: '```mermaid\nflowchart TD\n    A[התחלה] --> B{בדיקה}\n    B -->|כן| C[הצלחה]\n    B -->|לא| D[כישלון]\n```'
    },
    {
      id: 'mermaid_hard_1',
      topic: 'mermaid',
      difficulty: 'hard',
      question: '📈 *אתגר מתקדם - Sequence Diagram*\n\nצור דיאגרמת רצף של תהליך התחברות:\n- משתמש שולח בקשה לשרת\n- שרת בודק במסד נתונים\n- מסד נתונים מחזיר תשובה\n- שרת מחזיר תשובה למשתמש',
      validationRules: {
        mustInclude: ['```mermaid', 'sequenceDiagram', '->>'],
        hasSequenceDiagram: true
      },
      hint: 'Sequence diagram: participant A\nA->>B: הודעה',
      correctFeedback: 'מדהים! יצרת דיאגרמת רצף מורכבת - כלי חזק לתיאור תקשורת בין רכיבים.',
      wrongFeedback: 'זכור: sequenceDiagram, participant שם, והודעות עם ->>',
      example: '```mermaid\nsequenceDiagram\n    participant U as משתמש\n    participant S as שרת\n    participant DB as מסד נתונים\n    U->>S: בקשת התחברות\n    S->>DB: בדיקת פרטים\n    DB->>S: אישור\n    S->>U: הצלחה\n```'
    }
  ],

  // ====================================
  // 💻 Code Blocks - קוד וסינטקס
  // ====================================
  'code-blocks': [
    {
      id: 'code_easy_1',
      topic: 'code-blocks',
      difficulty: 'easy',
      question: '💻 *אתגר קל - קוד בתוך שורה*\n\nכתוב את המשפט הבא, וסמן את הפקודה כקוד:\nכדי לראות את הסטטוס, השתמש בפקודה git status',
      validationRules: {
        mustInclude: ['`git status`'],
        pattern: /`git status`/
      },
      hint: 'השתמש ב-Backticks (`) סביב הפקודה',
      correctFeedback: 'מצוין! שימוש ב-Backticks הוא הדרך להציג קוד בתוך שורה.',
      wrongFeedback: 'זכור לעטוף את הפקודה בגרש הפוך (`).',
      example: 'כדי לראות את הסטטוס, השתמש בפקודה `git status`'
    },
    {
      id: 'code_medium_1',
      topic: 'code-blocks',
      difficulty: 'medium',
      question: '💻 *אתגר בינוני - בלוק קוד*\n\nצור בלוק קוד בשפת Python שמדפיס "Hello World".',
      validationRules: {
        mustInclude: ['```python', 'print("Hello World")', '```'],
        minLines: 3
      },
      hint: 'התחל עם שלוש backticks ושם השפה (python)',
      correctFeedback: 'מעולה! יצרת בלוק קוד עם הגדרת שפה.',
      wrongFeedback: 'השתמש ב-```python בהתחלה ו-``` בסוף.',
      example: '```python\nprint("Hello World")\n```'
    },
    {
      id: 'code_hard_1',
      topic: 'code-blocks',
      difficulty: 'hard',
      question: '💻 *אתגר מתקדם - בלוק Diff*\n\nצור בלוק קוד שמציג שינויים (Diff):\n- שורה שנמחקה: hello world\n- שורה שנוספה: hello universe',
      validationRules: {
        mustInclude: ['```diff', '- hello world', '+ hello universe', '```'],
        minLines: 4
      },
      hint: 'השתמש ב-```diff, מינוס (-) למחיקה ופלוס (+) להוספה',
      correctFeedback: 'מדהים! Diff הוא כלי חשוב להצגת שינויים בקוד.',
      wrongFeedback: 'זכור: שפת diff, - למחיקה, + להוספה.',
      example: '```diff\n- hello world\n+ hello universe\n```'
    }
  ],

  // ====================================
  // 🛡️ Escaping - תווים מיוחדים
  // ====================================
  'escaping': [
    {
      id: 'escape_easy_1',
      topic: 'escaping',
      difficulty: 'easy',
      question: '🛡️ *אתגר קל - ביטול עיצוב*\n\nכתוב את המשפט: "השתמש בתו * כדי לציין שדה חובה"\nודא שהכוכבית מוצגת כרגיל ולא כנטוי.',
      validationRules: {
        mustInclude: ['\\*', '*'],
        pattern: /\\\*/
      },
      hint: 'השתמש בלוכסן שמאלי (\\) לפני הכוכבית',
      correctFeedback: 'נכון! הלוכסן השמאלי מבטל את המשמעות המיוחדת של התו.',
      wrongFeedback: 'השתמש ב-\\* כדי להציג כוכבית רגילה.',
      example: 'השתמש בתו \\* כדי לציין שדה חובה'
    },
    {
      id: 'escape_medium_1',
      topic: 'escaping',
      difficulty: 'medium',
      question: '🛡️ *אתגר בינוני - הצגת קישור*\n\nהצג את התחביר של הקישור הבא כקוד (כך שלא יהיה לחיץ):\n[Google](https://google.com)',
      validationRules: {
        mustInclude: ['`[Google](https://google.com)`'],
        pattern: /`\[Google\]\(https:\/\/google\.com\)`/
      },
      hint: 'עטוף את הקישור כולו ב-Backticks (` `)',
      correctFeedback: 'יפה! עטיפה ב-code מונעת מהקישור להיות פעיל.',
      wrongFeedback: 'עטוף את הכל בגרש הפוך (`).',
      example: '`[Google](https://google.com)`'
    },
    {
      id: 'escape_hard_1',
      topic: 'escaping',
      difficulty: 'hard',
      question: '🛡️ *אתגר מתקדם - שם קובץ*\n\nכתוב את שם הקובץ `my_final_script_v2.py` בתוך משפט.\nודא שהקווים התחתונים לא גורמים להטיית הטקסט.',
      validationRules: {
        mustInclude: ['`my_final_script_v2.py`'],
         pattern: /`my_final_script_v2\.py`/
      },
      hint: 'שימוש ב-Backticks הוא הדרך הטובה ביותר לשמות קבצים',
      correctFeedback: 'מצוין! קוד בתוך שורה פותר בעיות של תווים מיוחדים בשמות קבצים.',
      wrongFeedback: 'עטוף את שם הקובץ ב-` `.',
      example: 'הקובץ הוא `my_final_script_v2.py`'
    }
  ],

  // ====================================
  // 🗨️ Quotes & Alerts - ציטוטים והתראות
  // ====================================
  'quotes-alerts': [
    {
      id: 'quote_easy_1',
      topic: 'quotes-alerts',
      difficulty: 'easy',
      question: '🗨️ *אתגר קל - ציטוט*\n\nצור ציטוט עם הטקסט: "זהו שינוי משמעותי בפרויקט"',
      validationRules: {
        mustInclude: ['> זהו שינוי', '>'],
        hasBlockquote: true
      },
      hint: 'השתמש בסימן > בתחילת השורה',
      correctFeedback: 'מעולה! > יוצר ציטוט.',
      wrongFeedback: 'התחל את השורה ב->.',
      example: '> זהו שינוי משמעותי בפרויקט'
    },
    {
      id: 'quote_medium_1',
      topic: 'quotes-alerts',
      difficulty: 'medium',
      question: '🗨️ *אתגר בינוני - ציטוט מקונן*\n\nצור ציטוט בתוך ציטוט (תגובה לתגובה) עם הטקסט: "אני מסכים עם זה"',
      validationRules: {
        mustInclude: ['>>', 'אני מסכים'],
        pattern: />\s*>/
      },
      hint: 'השתמש בפעמיים > (>>)',
      correctFeedback: 'יפה! ציטוט מקונן שימושי לדיונים.',
      wrongFeedback: 'השתמש ב->> לציטוט כפול.',
      example: '>> אני מסכים עם זה'
    },
    {
      id: 'quote_hard_1',
      topic: 'quotes-alerts',
      difficulty: 'hard',
      question: '🗨️ *אתגר מתקדם - התראת GitHub*\n\nצור התראת Warning בסגנון GitHub עם הטקסט: "יש לבדוק תאימות לאחור"',
      validationRules: {
        mustInclude: ['> [!WARNING]', 'יש לבדוק'],
        pattern: />\s*\[!WARNING\]/
      },
      hint: 'התחביר הוא > [!WARNING] ואז הטקסט',
      correctFeedback: 'מדהים! Alerts הם דרך מעולה להדגיש מידע ב-GitHub.',
      wrongFeedback: 'השתמש בפורמט: > [!WARNING] טקסט',
      example: '> [!WARNING] יש לבדוק תאימות לאחור'
    }
  ],

  // ====================================
  // 📐 HTML in Markdown - שילוב HTML
  // ====================================
  'html-markdown': [
    {
      id: 'html_easy_1',
      topic: 'html-markdown',
      difficulty: 'easy',
      question: '📐 *אתגר קל - טקסט תחתי*\n\nכתוב את הנוסחה הכימית H₂O כאשר ה-2 הוא בכתב תחתי (Subscript).',
      validationRules: {
        mustInclude: ['H<sub>2</sub>O', '<sub>', '</sub>'],
        pattern: /<sub>2<\/sub>/
      },
      hint: 'השתמש בתגיות <sub>...</sub>',
      correctFeedback: 'נכון! HTML מאפשר עיצובים ש-Markdown לא תומך בהם ישירות.',
      wrongFeedback: 'עטוף את ה-2 ב-<sub> ו-</sub>.',
      example: 'H<sub>2</sub>O'
    },
    {
      id: 'html_medium_1',
      topic: 'html-markdown',
      difficulty: 'medium',
      question: '📐 *אתגר בינוני - טקסט נסתר*\n\nצור "אקורדיון" (Details) עם הכותרת "פרטים נוספים" והתוכן "מידע מוסתר".',
      validationRules: {
        mustInclude: ['<details>', '<summary>', '</details>', '</summary>'],
        pattern: /<details>.*<summary>.*<\/summary>.*<\/details>/s
      },
      hint: 'השתמש ב-<details> שעוטף את הכל, ובתוכו <summary> לכותרת',
      correctFeedback: 'מעולה! זה כלי מצוין להסתרת מידע טכני ארוך.',
      wrongFeedback: 'ודא שיש לך <details> ובתוכו <summary>.',
      example: '<details>\n<summary>פרטים נוספים</summary>\nמידע מוסתר\n</details>'
    },
    {
      id: 'html_hard_1',
      topic: 'html-markdown',
      difficulty: 'hard',
      question: '📐 *אתגר מתקדם - יישור למרכז*\n\nמרכז את הטקסט "טקסט במרכז" באמצעות HTML.',
      validationRules: {
        mustInclude: ['align="center"', 'div'],
        pattern: /<div.*align="center".*>/
      },
      hint: 'השתמש ב-<div align="center">',
      correctFeedback: 'מצוין! שילוב HTML נותן שליטה מלאה על העיצוב.',
      wrongFeedback: 'השתמש ב-div עם align="center".',
      example: '<div align="center">טקסט במרכז</div>'
    }
  ]
};

/**
 * Get challenges by topic
 */
function getChallengesByTopic(topic) {
  return challenges[topic] || [];
}

/**
 * Get all topics
 */
function getAllTopics() {
  return Object.keys(challenges);
}

/**
 * Get topic display name
 */
function getTopicDisplayName(topic) {
  const names = {
    'tables': '📊 טבלאות',
    'links-images': '🔗 קישורים ותמונות',
    'advanced-lists': '📋 רשימות מתקדמות',
    'mermaid': '📈 דיאגרמות Mermaid',
    'text-formatting': '✨ עיצוב טקסט',
    'bug-detection': '🐛 איתור באגים',
    'code-blocks': '💻 קוד וסינטקס',
    'escaping': '🛡️ תווים מיוחדים',
    'quotes-alerts': '🗨️ ציטוטים והתראות',
    'html-markdown': '📐 HTML בתוך Markdown'
  };
  return names[topic] || topic;
}

/**
 * Validate user answer against challenge rules
 */
function validateAnswer(challenge, userAnswer) {
  const rules = challenge.validationRules;
  const answer = userAnswer.trim();

  // Check if answer contains required strings
  if (rules.mustInclude) {
    for (const required of rules.mustInclude) {
      if (!answer.includes(required)) {
        return {
          isCorrect: false,
          reason: `חסר: ${required}`
        };
      }
    }
  }

  // Check if answer matches pattern
  if (rules.pattern && !rules.pattern.test(answer)) {
    return {
      isCorrect: false,
      reason: 'התבנית לא תואמת'
    };
  }

  // Check minimum lines
  if (rules.minLines) {
    const lines = answer.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < rules.minLines) {
      return {
        isCorrect: false,
        reason: `צריך לפחות ${rules.minLines} שורות`
      };
    }
  }

  // Check for table separator
  if (rules.mustHaveSeparator) {
    if (!answer.includes('---')) {
      return {
        isCorrect: false,
        reason: 'חסרה שורת המפריד של הטבלה'
      };
    }
  }

  // Check for mermaid block
  if (rules.hasMermaidBlock) {
    if (!answer.includes('```mermaid') || !answer.includes('```')) {
      return {
        isCorrect: false,
        reason: 'חסר בלוק mermaid תקין'
      };
    }
  }

  // Check for blockquote
  if (rules.hasBlockquote) {
    if (!answer.trim().startsWith('>')) {
      return {
        isCorrect: false,
        reason: 'חייב להתחיל בסימן >'
      };
    }
  }

  // All checks passed
  return {
    isCorrect: true,
    reason: 'הכל תקין!'
  };
}

module.exports = {
  challenges,
  getChallengesByTopic,
  getAllTopics,
  getTopicDisplayName,
  validateAnswer
};
