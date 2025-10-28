const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class ShareImageGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../output/shares');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a share image for achievement
   * @param {Object} data - Achievement data
   * @param {string} data.type - Type: 'lesson', 'level_up', 'training'
   * @param {string} data.userName - User's name
   * @param {string} data.achievement - Achievement description
   * @param {string} data.level - Current level
   * @param {number} data.score - Current score
   * @param {string} data.details - Additional details
   * @param {number} userId - User ID for unique filename
   * @returns {Promise<string>} - Path to generated image
   */
  async generateShareImage(data, userId) {
    const html = this.createShareHtml(data);
    const outputPath = path.join(this.outputDir, `share_${userId}_${Date.now()}.png`);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // Set viewport for social media optimal size (1200x630 for Facebook/Twitter)
      await page.setViewport({
        width: 1200,
        height: 630,
        deviceScaleFactor: 2
      });

      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for fonts to load properly
      await page.evaluateHandle('document.fonts.ready');

      // Additional wait to ensure rendering is complete
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: outputPath,
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width: 1200,
          height: 630
        }
      });

      return outputPath;

    } catch (error) {
      console.error('Error generating share image:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  createShareHtml(data) {
    const { type, userName, achievement, level, score, details } = data;

    // Choose emoji and styling based on type
    let mainEmoji = '🎉';
    let bgGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    let accentColor = '#667eea';

    if (type === 'level_up') {
      mainEmoji = '🏆';
      bgGradient = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      accentColor = '#f5576c';
    } else if (type === 'training') {
      mainEmoji = '🎯';
      bgGradient = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      accentColor = '#00f2fe';
    } else if (type === 'lesson') {
      mainEmoji = '📚';
      bgGradient = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      accentColor = '#38f9d7';
    }

    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Heebo', 'Arial Hebrew', 'Arial', 'Tahoma', sans-serif;
      width: 1200px;
      height: 630px;
      background: ${bgGradient};
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      width: 100%;
      height: 100%;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    /* Decorative circles */
    .circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
    }

    .circle-1 {
      width: 300px;
      height: 300px;
      top: -100px;
      left: -100px;
    }

    .circle-2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      right: -50px;
    }

    .circle-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      left: 10%;
      opacity: 0.5;
    }

    .header {
      text-align: center;
      z-index: 1;
    }

    .logo {
      font-size: 32px;
      font-weight: 700;
      color: white;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }

    .logo-icon {
      font-size: 48px;
    }

    .tagline {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 400;
    }

    .achievement-box {
      background: rgba(255, 255, 255, 0.98);
      border-radius: 35px;
      padding: 55px;
      text-align: center;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
      z-index: 1;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .user-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 25px;
    }

    .main-emoji {
      font-size: 100px;
      margin-bottom: 25px;
      animation: bounce 2s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-15px); }
    }

    .achievement-title {
      font-size: 52px;
      font-weight: 900;
      color: #1a202c;
      margin-bottom: 18px;
      line-height: 1.2;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .achievement-subtitle {
      font-size: 26px;
      color: #4a5568;
      margin-bottom: 35px;
      font-weight: 500;
      padding: 0 30px;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin-top: 35px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
    }

    .stat-item {
      text-align: center;
      position: relative;
    }

    .stat-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 46px;
      font-weight: 900;
      color: ${accentColor};
      display: block;
      line-height: 1;
    }

    .stat-label {
      font-size: 19px;
      color: #718096;
      margin-top: 8px;
      font-weight: 500;
    }

    .footer {
      text-align: center;
      z-index: 1;
    }

    .cta {
      background: white;
      color: #667eea;
      padding: 20px 40px;
      border-radius: 50px;
      font-size: 24px;
      font-weight: 700;
      display: inline-block;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .bot-link {
      font-size: 18px;
      color: white;
      margin-top: 15px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="circle circle-1"></div>
    <div class="circle circle-2"></div>
    <div class="circle circle-3"></div>

    <div class="header">
      <div class="logo">
        <span class="logo-icon">🤖</span>
        <span>Markdown Trainer</span>
      </div>
      <div class="tagline">לומד/ת Markdown כמו מקצוען/ית</div>
    </div>

    <div class="achievement-box">
      <div class="user-badge">👤 ${userName}</div>
      <div class="main-emoji">${mainEmoji}</div>
      <div class="achievement-title">${achievement}</div>
      ${details ? `<div class="achievement-subtitle">${details}</div>` : ''}

      <div class="stats">
        <div class="stat-item">
          <div class="stat-icon">⭐</div>
          <span class="stat-value">${level}</span>
          <div class="stat-label">דרגה נוכחית</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">🎯</div>
          <span class="stat-value">${score}</span>
          <div class="stat-label">נקודות</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="cta">בואו ללמוד גם אתם! 👇</div>
      <div class="bot-link">@MarkdownTrainerBot</div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Clean up old share images (older than 24 hours)
   */
  cleanupOldImages() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (!fs.existsSync(this.outputDir)) return;

    const files = fs.readdirSync(this.outputDir);

    for (const file of files) {
      const filePath = path.join(this.outputDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old share image: ${file}`);
      }
    }
  }
}

module.exports = ShareImageGenerator;
