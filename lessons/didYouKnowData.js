const composeFact = (number, headline, body) => {
  return {
    id: number,
    number,
    headline,
    message: `💫 *הידעת? #${number}* · ${headline}\n\n${body.trim()}`
  };
};

const didYouKnowFacts = [
  composeFact(1, 'תעלומת האנטר הנעלם', String.raw`
*הבעיה:*
לחצתם Enter בקוד, אבל בתצוגה הטקסט נשאר באותה שורה? זה לא באג, זה פיצ'ר! Markdown מתייחס לירידת שורה בודדת כחלק מאותה פסקה.

*הפתרון:*
כדי לרדת שורה באמת (כמו <br>), הוסיפו שני רווחים בסוף השורה ורק אז לחצו Enter.

*דוגמה:*
שורה ראשונה (רווח רווח)  
שורה שניה

💡 טיפ: ההרגל הזה עובד בכל מקום שתומך ב-Markdown—GitHub, Notion וגם המעבדה שלנו.
`),
  composeFact(2, 'כפתורי מקלדת מעוצבים', String.raw`
*הטריק:*
רוצים להציג קיצורי מקלדת בצורה שמרגישה כמו כפתור אמיתי? עטפו את שם המקש בתגית HTML `<kbd>`.

*הקוד:*
\`לחצו על <kbd>Ctrl</kbd> + <kbd>C</kbd> להעתקה\`

*התוצאה:*
לחצו על <kbd>Ctrl</kbd> + <kbd>C</kbd> להעתקה

💡 מצוין לצ'יטים, תיעוד פנימי ומסכי עזרה.
`),
  composeFact(3, 'שליטה ביישור טבלאות', String.raw`
*למה זה חשוב:*
ברירת המחדל של טבלאות היא יישור לשמאל, אבל נקודתיים בשורת ההפרדה מאפשרים שליטה מלאה.

*הקוד:*
\`\`\`
| לשמאל | למרכז | לימין |
| :---  | :---: |  ---: |
| טקסט | טקסט | טקסט |
\`\`\`

*איך זוכרים?*
• \`:---\` → שמאל  
• \`:---:\` → מרכז  
• \`---:\` → ימין
`),
  composeFact(4, 'הרווח הבלתי־שביר', String.raw`
*הבעיה:*
Markdown מצמצם רווחים. גם אם תלחצו חמש פעמים על מקש הרווח—תקבלו רווח אחד.

*הפתרון:*
השתמשו ב-HTML Entity בשם `&emsp;` (Em Space) כדי ליצור הזחות מכוונות.

*הקוד:*
\`התחלה &emsp;&emsp;&emsp; סוף\`

💡 נוח ליצירת רווחים בכותרות או בטקסט ללא רשימות.
`),
  composeFact(5, 'טקסט "רואה ואינו נראה"', String.raw`
*איך זה עובד:*
אפשר להכניס הערות שלא יוצגו בתוצאה הסופית בעזרת תגית HTML או תחביר מיוחד של GitHub.

*הקוד:*
\`\`\`html
<!-- זו הערה רק בשבילי -->
[//]: # (גם זה לא יוצג לקוראים)
\`\`\`

💡 השאירו תזכורות לעצמכם, ולאף אחד לא יהיה מושג.
`),
  composeFact(6, 'ציטוט של ציטוט', String.raw`
*למה זה מגניב:*
כל `>` נוסף מכניס את הציטוט עמוק יותר—מושלם לדיאלוגים או ראיונות.

*הקוד:*
\`\`\`
> הוא אמר:
>> אני מסכים איתך!
>>> בדיוק ככה.
\`\`\`

💡 השתמשו בזה כדי להראות שרשור של תגובות או הערות מנהלים על משימות.
`),
  composeFact(7, 'הלינק העצלן', String.raw`
*הבעיה:*
אין לכם כוח להמציא טקסט לקישור? לפעמים רוצים פשוט להדביק את ה-URL.

*הפתרון:*
עטפו את הכתובת בסוגריים משולשים `< >` והיא תהפוך לקישור אוטומטי.

*הקוד:*
\`<https://google.com>\`

*השוואה:*
\`<https://google.com>\` במקום \`[Google](https://google.com)\`
`),
  composeFact(8, 'מגן הקסם (Backslash Escape)', String.raw`
*הבעיה:*
לפעמים אתם רוצים להשתמש בתווים מיוחדים (כוכבית, קו תחתון) בלי שהם יפעילו עיצוב.

*הפתרון:*
מקדימים לוכסן שמאלי `\` לתו הבא וכך מנטרלים את הכוח שלו.

*הקוד:*
\`\\*זה לא מודגש\\*\`

*התוצאה:*
\*זה לא מודגש\*

💡 עובד עבור כל התווים ה"מסוכנים" של Markdown.
`)
];

const NEXT_BUTTON_TEXT = 'הבא בתור ➡️';

const clampIndex = (index = 0) => {
  const total = didYouKnowFacts.length;
  if (!total) {
    return 0;
  }
  if (typeof index !== 'number' || Number.isNaN(index)) {
    return 0;
  }
  return ((index % total) + total) % total;
};

const getFactByIndex = (index = 0) => {
  if (!didYouKnowFacts.length) {
    return null;
  }
  return didYouKnowFacts[clampIndex(index)];
};

const getCardPayload = (index = 0) => {
  const fact = getFactByIndex(index);
  if (!fact) {
    return null;
  }
  const normalized = clampIndex(index);
  return {
    fact,
    nextIndex: clampIndex(normalized + 1)
  };
};

const getTotalFacts = () => didYouKnowFacts.length;

module.exports = {
  facts: didYouKnowFacts,
  NEXT_BUTTON_TEXT,
  getFactByIndex,
  getCardPayload,
  getTotalFacts
};
