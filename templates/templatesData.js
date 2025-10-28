// ========================================
// Markdown Templates Library
// ========================================

const templates = [
  {
    id: 'prd',
    title: '📋 PRD - מסמך דרישות מוצר',
    category: 'תיעוד מוצר',
    description: 'תבנית למסמך דרישות מוצר מקצועי',
    content: `# [שם המוצר/פיצ'ר] - PRD

## 📌 TL;DR
[סיכום בן 2-3 שורות של מה בונים ולמה]

## 🎯 מטרה
**מה הבעיה שאנחנו פותרים?**
- בעיה 1
- בעיה 2

**למה עכשיו?**
[הקשר עסקי, שוק, תזמון]

## 👥 קהל יעד
- **משתמש ראשי**: [תיאור]
- **משתמש משני**: [תיאור]

## ✨ פיצ'רים ודרישות

### Must Have (חובה)
- [ ] דרישה 1
- [ ] דרישה 2

### Should Have (רצוי)
- [ ] דרישה 3
- [ ] דרישה 4

### Nice to Have (בונוס)
- [ ] דרישה 5

## 📖 User Stories

### Story #1: [שם]
**As a** [תפקיד]
**I want** [פעולה]
**So that** [תוצאה/ערך]

**Acceptance Criteria:**
- [ ] קריטריון 1
- [ ] קריטריון 2

## 🎨 UX/UI Guidelines
[תיאור חוויית משתמש, wireframes, זרימות]

## 🔧 Technical Considerations
- **API Requirements**: [רשימה]
- **Performance**: [יעדי ביצועים]
- **Security**: [שיקולי אבטחה]

## 📊 Success Metrics
| מדד | יעד | מדידה |
|-----|-----|-------|
| מדד 1 | 80% | Google Analytics |
| מדד 2 | 500 | Database query |

## 🚀 Timeline
- **Week 1**: Design + Review
- **Week 2-3**: Development
- **Week 4**: Testing + Launch

## ⚠️ Risks & Mitigation
| סיכון | הסתברות | השפעה | פתרון |
|--------|----------|--------|--------|
| סיכון 1 | גבוהה | בינונית | פתרון 1 |

## 📚 References
- [קישור למחקר]
- [קישור לדוקומנטציה]

---
**Owner**: [שם]
**Last Updated**: [תאריך]
`
  },
  {
    id: 'readme',
    title: '📖 README - תיעוד פרויקט',
    category: 'קוד ופיתוח',
    description: 'תבנית README מקצועית לפרויקטים',
    content: `# 🚀 [שם הפרויקט]

[תיאור קצר בן שורה אחת של מה הפרויקט עושה]

## ✨ Features

- 🎯 פיצ'ר 1 - תיאור קצר
- 💡 פיצ'ר 2 - תיאור קצר
- ⚡ פיצ'ר 3 - תיאור קצר

## 🛠️ Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/username/project.git

# Navigate to directory
cd project

# Install dependencies
npm install

# Start the application
npm start
\`\`\`

## 📦 Prerequisites

- Node.js 18+
- npm או yarn
- [דרישות נוספות]

## 🎮 Usage

### Basic Example

\`\`\`javascript
const project = require('project');

// דוגמה לשימוש בסיסי
project.doSomething({
  option1: 'value',
  option2: true
});
\`\`\`

### Advanced Example

\`\`\`javascript
// דוגמה מתקדמת
const result = await project.advancedFeature({
  config: {
    timeout: 5000,
    retries: 3
  }
});
\`\`\`

## 🔧 Configuration

צור קובץ \`.env\`:

\`\`\`env
API_KEY=your_api_key_here
PORT=3000
DATABASE_URL=postgresql://localhost/mydb
\`\`\`

## 📚 API Documentation

### \`functionName(params)\`

**Parameters:**
- \`param1\` (string) - תיאור
- \`param2\` (number) - תיאור

**Returns:** \`Promise<Result>\`

**Example:**
\`\`\`javascript
const result = await functionName('test', 42);
\`\`\`

## 🧪 Running Tests

\`\`\`bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.js
\`\`\`

## 🤝 Contributing

תרומות מתקבלות בברכה!

1. Fork את הפרויקט
2. צור branch חדש (\`git checkout -b feature/amazing-feature\`)
3. Commit את השינויים (\`git commit -m 'Add amazing feature'\`)
4. Push ל-branch (\`git push origin feature/amazing-feature\`)
5. פתח Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@username](https://github.com/username)
- Email: your.email@example.com

## 🙏 Acknowledgments

- תודה ל-[שם] על [תרומה]
- השראה מ-[פרויקט]

---
⭐ אם הפרויקט עזר לך, תן כוכב ב-GitHub!
`
  },
  {
    id: 'postmortem',
    title: '🔍 Post Mortem - ניתוח אירוע',
    category: 'ניהול',
    description: 'תבנית לניתוח תקלות ואירועים',
    content: `# Post Mortem: [שם האירוע/תקלה]

**תאריך**: [DD/MM/YYYY]
**חומרה**: 🔴 Critical / 🟡 High / 🟢 Medium / ⚪ Low
**משך השבתה**: [זמן]
**כותב**: [שם]

---

## 📌 TL;DR
[סיכום בן 2-3 שורות: מה קרה, למה, ואיך תיקנו]

## 📊 Impact Summary

| פרמטר | ערך |
|-------|-----|
| משתמשים מושפעים | X,XXX |
| אובדן הכנסות משוער | $X,XXX |
| זמן שבתה כולל | X שעות Y דקות |
| שירותים מושפעים | [רשימה] |

## 🕐 Timeline (כל הזמנים ב-GMT+2)

**13:45** - 🚨 התראה ראשונית מ-monitoring
**13:47** - צוות זוהה והחל בחקירה
**14:00** - זוהתה סיבת השורש
**14:15** - החל rollback
**14:30** - ✅ השירות חזר לפעולה תקינה
**14:45** - אימות מלא הושלם

## 🔍 Root Cause Analysis

### מה קרה?
[תיאור טכני של הבעיה]

### למה זה קרה?
[ניתוח סיבת שורש - הבעיה האמיתית מאחורי הסימפטום]

### למה זה לא נתפס קודם?
- חסרה בדיקה אוטומטית ל-[X]
- Monitoring לא כיסה את [Y]
- אין alerting על [Z]

## ✅ מה עבד טוב

- ✅ הצוות הגיב תוך 2 דקות
- ✅ Rollback היה זמין ופשוט
- ✅ תקשורת ברורה עם לקוחות

## ❌ מה לא עבד

- ❌ Monitoring לא זיהה את הבעיה מוקדם מספיק
- ❌ תיעוד Runbook לא היה עדכני
- ❌ חסרה בדיקת Smoke Test אוטומטית

## 🛠️ Action Items

| משימה | אחראי | Priority | Due Date | Status |
|-------|-------|----------|----------|--------|
| הוסף smoke test אוטומטי | @dev1 | 🔴 High | 01/01 | ⏳ In Progress |
| עדכן runbook | @dev2 | 🟡 Medium | 05/01 | ⬜ Todo |
| שפר alerting | @ops | 🔴 High | 03/01 | ⬜ Todo |

## 📚 Lessons Learned

1. **תמיד להריץ smoke tests** - גם על שינויים "קטנים"
2. **Monitoring חייב לכסות edge cases** - לא רק happy path
3. **Runbooks חייבים להיות חיים** - עדכון אחרי כל deploy

## 🔗 Links & Resources

- [Dashboard](link)
- [Incident Slack Thread](link)
- [Monitoring Graph](link)

---
**סטטוס**: ✅ Resolved
**בעלות**: [שם הצוות]
`
  },
  {
    id: 'blog',
    title: '✍️ Blog Post - מאמר טכני',
    category: 'כתיבה',
    description: 'תבנית למאמר טכני או פוסט בבלוג',
    content: `# [כותרת מושכת ומעניינת]

**TL;DR**: [סיכום בן שורה אחת של מה המאמר מלמד]

---

## 🎯 הבעיה

האם פעם חוויתם [תיאור בעיה שהקורא מזדהה איתה]?

זה בדיוק מה שקרה לי כש-[סיפור אישי קצר].

בפוסט הזה אראה לכם איך [הפתרון במשפט אחד].

## 🤔 למה זה חשוב?

[הסבר למה הבעיה הזו חשובה ולמה כדאי לקורא להשקיע זמן בפתרון]

**מה תלמדו במאמר:**
- 📝 [נקודה 1]
- 🚀 [נקודה 2]
- 💡 [נקודה 3]

---

## 🛠️ הפתרון

### שלב 1: [שם השלב]

[הסבר טקסטואלי]

\`\`\`javascript
// דוגמת קוד מוסברת
const example = "עם הערות בקוד";
console.log(example);
\`\`\`

**למה זה עובד?**
[הסבר מעמיק]

### שלב 2: [שם השלב]

[המשך ההסבר...]

---

## 📊 התוצאות

| Before | After |
|--------|-------|
| ❌ בעיה 1 | ✅ תוצאה 1 |
| ❌ בעיה 2 | ✅ תוצאה 2 |

או בגרף:
\`\`\`
Performance Improvement:
████████████████░░░░ 80% faster
\`\`\`

---

## 🆚 אלטרנטיבות

### גישה A (מה שהראיתי)
✅ **יתרונות**: [רשימה]
❌ **חסרונות**: [רשימה]

### גישה B (אלטרנטיבה)
✅ **יתרונות**: [רשימה]
❌ **חסרונות**: [רשימה]

**המלצה שלי**: השתמשו ב-A אם [תנאי], אחרת B.

---

## 💡 טיפים נוספים

1. 🎯 **טיפ 1**: [הסבר קצר]
2. ⚡ **טיפ 2**: [הסבר קצר]
3. 🔧 **טיפ 3**: [הסבר קצר]

---

## 🎬 סיכום

[פסקת סיכום - מה למדנו, מה הצעד הבא]

**Key Takeaways:**
- ✅ [נקודה 1]
- ✅ [נקודה 2]
- ✅ [נקודה 3]

---

## 📚 קריאה נוספת

- [מאמר קשור 1](link)
- [תיעוד רלוונטי](link)
- [כלי שימושי](link)

---

**רוצים לדבר על זה?**
💬 תגיבו למטה או צרו איתי קשר ב-[רשת חברתית]

**האם המאמר עזר לכם?**
⭐ שתפו עם מישהו שיכול להפיק מזה ערך!
`
  },
  {
    id: 'meeting',
    title: '📝 Meeting Notes - פרוטוקול ישיבה',
    category: 'ניהול',
    description: 'תבנית לתיעוד ישיבות',
    content: `# 📝 [שם הישיבה] - Meeting Notes

**תאריך**: [DD/MM/YYYY]
**שעה**: [HH:MM - HH:MM]
**מיקום**: [Zoom / משרד / היברידי]

## 👥 Participants

**נוכחים**:
- [שם] - [תפקיד]
- [שם] - [תפקיד]

**לא הגיעו**:
- [שם] - [סיבה אם ידועה]

---

## 🎯 Agenda

1. [נושא 1]
2. [נושא 2]
3. [נושא 3]
4. [פתוח]

---

## 💬 Discussion Summary

### 1. [נושא ראשון]
**מה דובר**:
- נקודה 1
- נקודה 2

**שאלות שעלו**:
- ❓ שאלה 1 → תשובה / עדיין פתוח
- ❓ שאלה 2 → תשובה / עדיין פתוח

### 2. [נושא שני]
[תיאור הדיון...]

---

## ✅ Decisions Made

| # | החלטה | בעלות | Context |
|---|--------|-------|---------|
| 1 | [טקסט ההחלטה] | @person | [למה החלטנו כך] |
| 2 | [טקסט ההחלטה] | @person | [למה החלטנו כך] |

---

## 🎯 Action Items

| משימה | אחראי | Deadline | Priority | Status |
|-------|-------|----------|----------|--------|
| [תיאור משימה 1] | @person | 10/01 | 🔴 High | ⬜ Todo |
| [תיאור משימה 2] | @person | 15/01 | 🟡 Medium | ⬜ Todo |
| [תיאור משימה 3] | @person | 20/01 | 🟢 Low | ⬜ Todo |

---

## 🅿️ Parking Lot (נושאים לישיבה הבאה)

- [ ] נושא 1 - לא היה זמן לדון
- [ ] נושא 2 - צריך יותר מידע
- [ ] נושא 3 - תלוי בתוצאת משימה X

---

## 📅 Next Meeting

**מתי**: [תאריך] בשעה [שעה]
**נושאים מתוכננים**:
1. Review של Action Items מהיום
2. [נושא חדש 1]
3. [נושא חדש 2]

---

**Notes taken by**: [שם]
**Distributed to**: [רשימת מייל/ערוץ]
`
  },
  {
    id: 'onepager',
    title: '📄 One-Pager - מסמך תמציתי',
    category: 'תיעוד מוצר',
    description: 'תבנית למצגת רעיון בעמוד אחד',
    content: `# 💡 [שם הרעיון/פרויקט] - One Pager

## 🎯 TL;DR
[משפט אחד מרכזי: מה, למה, ערך]

---

## 📊 Problem vs Solution

| 🔴 The Problem | 🟢 Our Solution |
|----------------|-----------------|
| משתמשים מתקשים ב-[X] | אנחנו נותנים [Y] |
| זה גורם ל-[השפעה שלילית] | זה מביא ל-[השפעה חיובית] |
| עולה [זמן/כסף] | חוסך [זמן/כסף] |

---

## 👥 Target Audience

**Primary**: [תיאור קהל ראשי]
- גיל, תפקיד, pain points

**Secondary**: [תיאור קהל משני]
- למי עוד זה רלוונטי

📈 **Market Size**: [X,XXX users/companies]

---

## 🚀 The Solution

[פסקה קצרה - איך הפתרון עובד]

**Core Features**:
1. 🎯 [פיצ'ר 1] - [ערך למשתמש]
2. ⚡ [פיצ'ר 2] - [ערך למשתמש]
3. 💡 [פיצ'ר 3] - [ערך למשתמש]

---

## 💰 Business Impact

| Metric | Baseline | Target | Impact |
|--------|----------|--------|--------|
| Revenue | $X | $Y | +Z% |
| Users | X,XXX | Y,YYY | +Z% |
| Conversion | X% | Y% | +Z pp |

**ROI**: [חישוב משוער]

---

## 📅 Timeline & Milestones

\`\`\`
Week 1-2   ████░░░░░░  Research & Design
Week 3-6   ░░░░████░░  Development
Week 7     ░░░░░░░░██  Testing & Launch
\`\`\`

🏁 **Launch Date**: [DD/MM/YYYY]

---

## ⚠️ Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| [סיכון 1] | 🟡 Medium | [איך מתמודדים] |
| [סיכון 2] | 🟢 Low | [איך מתמודדים] |

---

## 📦 What We Need

- 💰 **Budget**: $X,XXX
- 👥 **Team**: X developers, Y designers
- ⏰ **Time**: X weeks
- 🛠️ **Resources**: [רשימה]

---

## 🎬 Next Steps

1. ✅ [צעד שכבר בוצע]
2. 🔄 [צעד בביצוע]
3. ⬜ [צעד הבא]

**Decision needed by**: [תאריך]

---

**Owner**: [שם] | **Status**: 🟡 Proposal
**Last Updated**: [DD/MM/YYYY]
`
  },
  {
    id: 'api',
    title: '🔌 API Reference - תיעוד API',
    category: 'קוד ופיתוח',
    description: 'תבנית לתיעוד API מקצועי',
    content: `# 🔌 [API Name] - API Reference

**Base URL**: \`https://api.example.com/v1\`
**Version**: v1.0.0
**Last Updated**: [DD/MM/YYYY]

---

## 🔐 Authentication

כל הבקשות דורשות authentication באמצעות API Key.

### Getting Your API Key

1. היכנס ל-[Dashboard](https://dashboard.example.com)
2. נווט ל-Settings → API Keys
3. לחץ "Create New Key"

### Using the API Key

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.example.com/v1/endpoint
\`\`\`

**Headers Required:**
\`\`\`
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
\`\`\`

---

## 📊 Rate Limiting

| Plan | Requests/Hour | Burst |
|------|--------------|-------|
| Free | 100 | 10/min |
| Pro | 10,000 | 100/min |
| Enterprise | Unlimited | Unlimited |

**Rate Limit Headers:**
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
\`\`\`

---

## 📡 Endpoints

### GET /users

קבל רשימת משתמשים.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| \`page\` | integer | No | Page number (default: 1) |
| \`limit\` | integer | No | Items per page (default: 20) |
| \`sort\` | string | No | Sort field (default: created_at) |

**Example Request:**

\`\`\`bash
curl -X GET "https://api.example.com/v1/users?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

**Example Response:** \`200 OK\`

\`\`\`json
{
  "data": [
    {
      "id": "usr_123",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
\`\`\`

---

### POST /users

צור משתמש חדש.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| \`name\` | string | Yes | Full name |
| \`email\` | string | Yes | Email address |
| \`role\` | string | No | User role (default: user) |

**Example Request:**

\`\`\`bash
curl -X POST "https://api.example.com/v1/users" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin"
  }'
\`\`\`

**Example Response:** \`201 Created\`

\`\`\`json
{
  "id": "usr_456",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "admin",
  "created_at": "2024-01-01T11:00:00Z"
}
\`\`\`

---

## ❌ Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | בדוק את פרמטרי הבקשה |
| 401 | Unauthorized | בדוק את ה-API Key |
| 403 | Forbidden | אין הרשאות מספיקות |
| 404 | Not Found | המשאב לא קיים |
| 429 | Too Many Requests | חכה ל-rate limit reset |
| 500 | Internal Server Error | צור קשר עם תמיכה |

**Error Response Format:**

\`\`\`json
{
  "error": {
    "code": "invalid_request",
    "message": "Missing required field: email",
    "details": {
      "field": "email",
      "type": "required"
    }
  }
}
\`\`\`

---

## 🔔 Webhooks

הירשם לקבל התראות על אירועים.

**Supported Events:**
- \`user.created\`
- \`user.updated\`
- \`user.deleted\`

**Webhook Payload:**

\`\`\`json
{
  "event": "user.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "id": "usr_789",
    "name": "New User"
  }
}
\`\`\`

---

## 📚 SDKs

**JavaScript/Node.js:**
\`\`\`bash
npm install @example/api-client
\`\`\`

**Python:**
\`\`\`bash
pip install example-api
\`\`\`

**Example Usage (Node.js):**
\`\`\`javascript
const ExampleAPI = require('@example/api-client');

const client = new ExampleAPI('YOUR_API_KEY');

const users = await client.users.list({ limit: 10 });
console.log(users);
\`\`\`

---

## 🆘 Support

- 📧 Email: api-support@example.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 📖 Docs: https://docs.example.com
`
  },
  {
    id: 'test-plan',
    title: '✅ QA Test Plan - תוכנית בדיקות',
    category: 'קוד ופיתוח',
    description: 'תבנית לתוכנית בדיקות QA',
    content: `# ✅ QA Test Plan - [Feature Name]

**Version**: 1.0
**Date**: [DD/MM/YYYY]
**Tester**: [שם]
**Environment**: [Staging / Production]

---

## 🎯 Test Objectives

**What are we testing?**
- [תיאור הפיצ'ר/שינוי]

**Success Criteria:**
- [ ] כל הטסטים עוברים
- [ ] אין bugs חוסמים
- [ ] Performance עומד ביעדים

---

## 🧪 Test Cases

### Test Case #1: [שם הטסט]

**Priority**: 🔴 High / 🟡 Medium / 🟢 Low
**Type**: Functional / UI / Integration / Performance

**Preconditions:**
- משתמש מחובר
- [תנאים נוספים]

**Steps:**
1. [פעולה 1]
2. [פעולה 2]
3. [פעולה 3]

**Expected Result:**
- [תוצאה צפויה]

**Actual Result:**
- ✅ Pass / ❌ Fail
- [תיאור אם שונה מהצפוי]

**Notes:**
[הערות נוספות]

---

### Test Case #2: [שם הטסט]

[חזור על המבנה למעלה...]

---

## 🌐 Cross-Browser Testing

| Browser | Version | Desktop | Mobile | Status |
|---------|---------|---------|--------|--------|
| Chrome | Latest | ✅ | ✅ | Pass |
| Firefox | Latest | ✅ | ❌ | Fail |
| Safari | Latest | ⏳ | ⏳ | Pending |
| Edge | Latest | ✅ | N/A | Pass |

**Issues Found:**
- Firefox: [תיאור הבעיה]

---

## 📱 Device Testing

| Device | OS | Resolution | Status | Notes |
|--------|----|-----------| -------|-------|
| iPhone 13 | iOS 16 | 390x844 | ✅ | Pass |
| Samsung S21 | Android 12 | 360x800 | ✅ | Pass |
| iPad Pro | iOS 16 | 1024x1366 | ⏳ | In Progress |

---

## ♿ Accessibility Testing

| Criterion | WCAG Level | Status | Notes |
|-----------|------------|--------|-------|
| Keyboard Navigation | A | ✅ | Pass |
| Screen Reader | A | ❌ | Missing alt text |
| Color Contrast | AA | ✅ | Pass |
| Focus Indicators | A | ✅ | Pass |

**Tools Used:**
- axe DevTools
- NVDA Screen Reader
- Lighthouse

---

## ⚡ Performance Testing

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Page Load Time | < 2s | 1.8s | ✅ |
| Time to Interactive | < 3s | 2.5s | ✅ |
| First Contentful Paint | < 1s | 0.9s | ✅ |
| Bundle Size | < 500KB | 480KB | ✅ |

**Tools Used:**
- Lighthouse
- WebPageTest
- Chrome DevTools

---

## 🐛 Bugs Found

| ID | Severity | Description | Steps to Reproduce | Status |
|----|----------|-------------|-------------------|--------|
| #123 | 🔴 Critical | [תיאור] | [צעדים] | 🔄 Open |
| #124 | 🟡 Medium | [תיאור] | [צעדים] | ✅ Fixed |
| #125 | 🟢 Low | [תיאור] | [צעדים] | ⬜ Todo |

---

## 📝 Test Summary

**Total Test Cases**: 25
**Passed**: 22 ✅
**Failed**: 2 ❌
**Blocked**: 1 🚫
**In Progress**: 0 ⏳

**Pass Rate**: 88%

---

## ✅ Sign-Off

**QA Approved**: ⬜ Yes / ⬜ No / ⬜ With Conditions

**Conditions (if any):**
- Bug #123 חייב להיות מתוקן לפני production
- [תנאי נוסף]

**Approved By**: [שם]
**Date**: [DD/MM/YYYY]

---

## 🔄 Regression Testing Checklist

- [ ] Login/Logout
- [ ] User Registration
- [ ] Password Reset
- [ ] Core Functionality X
- [ ] Payment Flow
- [ ] Email Notifications

---

**Next Steps:**
1. [צעד 1]
2. [צעד 2]
`
  }
];

// ========================================
// Helper Functions
// ========================================

function getAllTemplates() {
  return templates;
}

function getTemplateById(id) {
  return templates.find(t => t.id === id);
}

function getTemplatesByCategory(category) {
  return templates.filter(t => t.category === category);
}

function getCategories() {
  return [...new Set(templates.map(t => t.category))];
}

module.exports = {
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  getCategories
};
