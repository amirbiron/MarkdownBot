# 🤖 Markdown Trainer Bot

בוט טלגרם אינטראקטיבי ללימוד Markdown באמצעות שיעורים יומיים, מבחנים ומעבדת תרגול בזמן אמת.

## ✨ תכונות עיקריות

### 📚 למידה מובנית
- **15 שיעורים מקיפים** - מהבסיס ועד מתקדם
- **מבחנים אינטראקטיביים** - עם משוב מיידי
- **3 רמות קושי**: בסיסי, מתקדם, אסתטיקה
- **מעקב אחר התקדמות** - ניקוד, דרגות וסטטיסטיקות

### 🧪 מעבדת תרגול (Sandbox)
- **המרת Markdown לתמונה** - ראה את התוצאה בזמן אמת
- **רינדור מלא** - תמיכה בכל תחביר Markdown
- **עיצוב מקצועי** - CSS מעוצב כמו GitHub
- **תמיכה בעברית** - כיווניות RTL מלאה

### 🎯 פיצ'רים מתקדמים
- **אימון ממוקד** - תרגול נושאים ספציפיים עם אתגרים מדורגים
- **למידה מותאמת אישית** - 3 קצבי למידה
- **זיהוי נקודות חולשה** - המלצות לחזרה
- **מערכת דרגות** - 4 רמות מומחיות
- **Cheatsheet אינטראקטיבי** - גישה מהירה למידע

## 🚀 התקנה מהירה

### דרישות מקדימות
- Node.js 18+ 
- npm או yarn
- חשבון בוט בטלגרם (דרך [@BotFather](https://t.me/botfather))

### שלב 1: שכפול והתקנת תלויות

```bash
# שכפול הפרויקט
git clone https://github.com/yourusername/markdown-trainer-bot.git
cd markdown-trainer-bot

# התקנת תלויות
npm install
```

### שלב 2: הגדרת משתני סביבה

צור קובץ `.env` בשורש הפרויקט:

```bash
cp .env.example .env
```

ערוך את `.env` והוסף את טוקן הבוט שלך:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
PORT=3000
DATABASE_PATH=./database/users.db
SANDBOX_ENABLED=true
```

### שלב 3: הרצת הבוט

```bash
# פיתוח (עם auto-restart)
npm run dev

# ייצור
npm start
```

## 📦 מבנה הפרויקט

```
markdown-trainer-bot/
├── index.js                 # נקודת כניסה ראשית
├── package.json             # תלויות והגדרות
├── .env.example             # דוגמה למשתני סביבה
├── .gitignore               # קבצים להתעלמות
│
├── database/
│   └── db.js                # מנהל מסד נתונים SQLite
│
├── handlers/
│   ├── commandHandler.js    # טיפול בפקודות (/start, /help, /train וכו')
│   └── messageHandler.js    # טיפול בהודעות ולחיצות כפתורים
│
├── lessons/
│   └── lessonsData.js       # כל תוכן 15 השיעורים
│
├── training/
│   └── trainingData.js      # בנק אתגרי האימון הממוקד
│
├── templates/
│   └── templatesData.js     # תבניות Markdown מוכנות לשימוש
│
└── services/
    └── markdownRenderer.js  # המרת Markdown לתמונה (Puppeteer)
```

## 🎮 שימוש בבוט

### פקודות זמינות

| פקודה | תיאור |
|-------|--------|
| `/start` | התחלה / איפוס הבוט |
| `/next` | עבור לשיעור הבא |
| `/train` | התחל אימון ממוקד בנושא ספציפי |
| `/cancel_training` | בטל אימון פעיל |
| `/sandbox` | פתח מעבדת תרגול |
| `/exit` | צא ממעבדת תרגול |
| `/templates` | גישה לתבניות Markdown מוכנות |
| `/progress` | הצג התקדמות וסטטיסטיקות |
| `/cheatsheet` | מדריך מהיר לתחביר |
| `/didyouknow` | כרטיסיות "הידעת?" חכמות |
| `/help` | הצג עזרה |

### זרימת למידה

1. **התחלה** - שלח `/start` לבוט
2. **בחירת קצב** - בחר קצב למידה (רגוע/רגיל/מהיר)
3. **שיעור ראשון** - קבל שיעור אוטומטי
4. **מבחן** - ענה על שאלת הבחנה
5. **התקדמות** - שלח `/next` להמשך
6. **תרגול** - השתמש ב-`/sandbox` לתרגול חופשי

### מצב אימון ממוקד

מצב האימון הממוקד (`/train`) מאפשר תרגול מכוון בנושאים ספציפיים:

1. **בחר נושא** - טבלאות, קישורים ותמונות, רשימות מתקדמות, או דיאגרמות Mermaid
2. **פתור אתגרים** - 3-5 אתגרים ברמות קושי הולכות וגדלות
3. **קבל משוב מיידי** - בדיקה אוטומטית עם הסבר על תשובות
4. **השתמש בעזרים** - רמזים, דילוג, או יציאה בכל שלב

**נושאי אימון זמינים:**
- 📊 **טבלאות** - יצירה, יישור, וטבלאות מורכבות
- 🔗 **קישורים ותמונות** - קישורים פשוטים, תמונות, וקישורי הפניה
- 📋 **רשימות מתקדמות** - תתי-רשימות, רשימות מעורבות, ורשימות משימות
- 📈 **דיאגרמות Mermaid** - תרשימי זרימה ודיאגרמות רצף

```
משתמש: /train
בוט: בחר נושא לתרגול...
משתמש: [בוחר "טבלאות"]
בוט: 🎯 אתגר קל - צור טבלה עם 2 עמודות...
משתמש: [שולח פתרון]
בוט: ✅ מצוין! התקדמות: 1/4
```

### דוגמת שימוש במעבדה

```
משתמש: /sandbox
בוט: 🧪 מצב מעבדה מופעל! שלח Markdown...

משתמש:
# כותרת ראשית
## כותרת משנה

זהו טקסט **מודגש** וזה *נטוי*.

- פריט 1
- פריט 2

בוט: [שולח תמונה של הטקסט המעוצב]
```

## 🌐 פריסה ל-Render.com

### שלב 1: הכנת הפרויקט

1. העלה את הקוד ל-GitHub
2. ודא שיש `package.json` עם:
   ```json
   {
     "scripts": {
       "start": "node index.js"
     }
   }
   ```

### שלב 2: יצירת Web Service ב-Render

1. היכנס ל-[Render.com](https://render.com)
2. לחץ **New +** → **Web Service**
3. חבר את ה-repository שלך מ-GitHub
4. הגדר:
   - **Name**: `markdown-trainer-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### שלב 3: הוספת משתני סביבה

בעמוד ההגדרות של Render, הוסף:

```
TELEGRAM_BOT_TOKEN = your_actual_bot_token
PORT = 3000
DATABASE_PATH = ./database/users.db
SANDBOX_ENABLED = true
```

### שלב 4: פריסה

1. לחץ **Create Web Service**
2. Render יבנה ויפרוס את הבוט אוטומטית
3. הבוט יתחיל לעבוד תוך 2-3 דקות

### ⚠️ שים לב

**Puppeteer על Render:**
הפעלת Puppeteer על Render דורשת תלויות נוספות. אם תקבל שגיאות, הוסף את זה ל-`package.json`:

```json
{
  "scripts": {
    "install": "npx puppeteer browsers install chrome"
  }
}
```

## 🛠️ טכנולוגיות

- **Node.js** - סביבת הרצה
- **Telegram Bot API** - ממשק בוט
- **SQLite** - מסד נתונים מקומי
- **Puppeteer** - רינדור דפדפן headless
- **Marked** - המרת Markdown ל-HTML
- **Express** - שרת HTTP (לבדיקות Render)

## 📊 מבנה מסד הנתונים

### טבלת `users`
- `user_id` - מזהה ייחודי
- `username`, `first_name`, `last_name`
- `created_at`, `last_active`

### טבלת `user_progress`
- `current_lesson` - שיעור נוכחי
- `total_score` - ניקוד כולל
- `level` - דרגה (Beginner → Master)
- `lessons_completed` - מספר שיעורים שהושלמו
- `correct_answers`, `wrong_answers`

### טבלת `lesson_history`
- תיעוד כל תשובה למבחן
- מועד השלמה

### טבלת `topic_performance`
- ביצועים לפי נושא (כותרות, קישורים וכו')
- זיהוי נקודות חולשה

### טבלת `training_sessions`
- מעקב אחר סשנים של אימון ממוקד
- נושא, מספר אתגרים, אחוז הצלחה
- סטטוס: active, completed, cancelled

### טבלת `user_modes`
- מעקב אחר מצב משתמש (normal, sandbox, training)
- נתוני מצב (JSON) לשמירת התקדמות

## 🎨 התאמה אישית

### שינוי עיצוב הסנדבוקס

ערוך את ה-CSS ב-`services/markdownRenderer.js` בפונקציה `createStyledHtml()`:

```javascript
// שנה צבעים
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// שנה גופנים
font-family: 'Assistant', sans-serif;
```

### הוספת שיעורים חדשים

ערוך את `lessons/lessonsData.js`:

```javascript
{
  id: 16,
  title: 'שיעור חדש',
  topic: 'new-topic',
  category: 'advanced',
  points: 10,
  messages: ['תוכן השיעור...'],
  quiz: {
    question: 'שאלה?',
    options: [...],
    correctFeedback: '...',
    wrongFeedback: '...'
  }
}
```

## 🐛 פתרון בעיות נפוצות

### הבוט לא מגיב
- בדוק שהטוקן ב-`.env` נכון
- ודא ש-polling פועל (אין שגיאות בקונסול)
- בדוק חיבור אינטרנט

### Puppeteer לא עובד
- הרץ: `npm install puppeteer --save`
- על Linux: התקן תלויות נוספות
  ```bash
  sudo apt-get install -y chromium-browser
  ```

### מסד הנתונים לא נשמר
- ודא שתיקיית `database/` קיימת
- בדוק הרשאות כתיבה

### תמונות לא נמחקות
- התיקייה `output/` תתמלא בתמונות
- הקוד מנקה אוטומטית קבצים ישנים מעל 24 שעות
- ניתן להריץ ניקוי ידני:
  ```javascript
  renderer.cleanupAllOldFiles();
  ```

## 📝 רישיון

MIT License - חופשי לשימוש ושינוי

## 🤝 תרומה

רוצה לתרום? מוזמן!

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit את השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📧 יצירת קשר

יוצר: Amir Biron  
טלגרם: [@amirbiron](https://t.me/amirbiron)

---

**נוצר עם ❤️ על ידי המפתח של Markdown Trainer Bot**

🌟 אם הבוט עזר לך, תן ⭐ ב-GitHub!
