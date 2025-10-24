const puppeteer = require('puppeteer');
const { marked } = require('marked');
const path = require('path');
const fs = require('fs');

class MarkdownRenderer {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, '../output');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true, // GitHub Flavored Markdown
      tables: true,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false
    });
  }

  // ========================================
  // Initialize Browser
  // ========================================
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      console.log('✅ Puppeteer browser initialized');
    }
    return this.browser;
  }

  // ========================================
  // Close Browser
  // ========================================
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ Puppeteer browser closed');
    }
  }

  // ========================================
  // Render Markdown to Image
  // ========================================
  async renderMarkdown(markdownText, userId) {
    try {
      // Initialize browser
      await this.initBrowser();

      // Convert Markdown to HTML
      const html = marked.parse(markdownText);

      // Create full HTML document with styling
      const fullHtml = this.createStyledHtml(html);

      // Create new page
      const page = await this.browser.newPage();

      // Set viewport
      await page.setViewport({
        width: 800,
        height: 600,
        deviceScaleFactor: 2
      });

      // Set content
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0'
      });

      // Get the content height
      const contentHeight = await page.evaluate(() => {
        return document.querySelector('.markdown-body').scrollHeight;
      });

      // Adjust viewport to content
      await page.setViewport({
        width: 800,
        height: Math.min(contentHeight + 40, 4000), // Max 4000px height
        deviceScaleFactor: 2
      });

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `markdown_${userId}_${timestamp}.png`;
      const outputPath = path.join(this.outputDir, filename);

      // Take screenshot
      await page.screenshot({
        path: outputPath,
        fullPage: true
      });

      // Close page
      await page.close();

      // Clean up old files (optional)
      this.cleanupOldFiles(userId);

      return outputPath;

    } catch (error) {
      console.error('Error rendering markdown:', error);
      throw error;
    }
  }

  // ========================================
  // Create Styled HTML
  // ========================================
  createStyledHtml(htmlContent) {
    return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      direction: rtl;
    }

    .markdown-body {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 100%;
      line-height: 1.6;
      color: #333;
    }

    /* Headers */
    .markdown-body h1 {
      font-size: 2em;
      margin: 0.67em 0;
      padding-bottom: 0.3em;
      border-bottom: 2px solid #eaecef;
      color: #24292e;
    }

    .markdown-body h2 {
      font-size: 1.5em;
      margin: 0.75em 0 0.5em 0;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
      color: #24292e;
    }

    .markdown-body h3 {
      font-size: 1.25em;
      margin: 0.75em 0 0.5em 0;
      color: #24292e;
    }

    .markdown-body h4,
    .markdown-body h5,
    .markdown-body h6 {
      font-size: 1em;
      margin: 0.75em 0 0.5em 0;
      color: #24292e;
    }

    /* Paragraphs */
    .markdown-body p {
      margin: 0.5em 0;
    }

    /* Emphasis */
    .markdown-body strong {
      font-weight: 600;
      color: #24292e;
    }

    .markdown-body em {
      font-style: italic;
    }

    .markdown-body del {
      text-decoration: line-through;
      color: #6a737d;
    }

    /* Lists */
    .markdown-body ul,
    .markdown-body ol {
      margin: 0.5em 0;
      padding-right: 2em;
    }

    .markdown-body li {
      margin: 0.25em 0;
    }

    .markdown-body ul ul,
    .markdown-body ol ul,
    .markdown-body ul ol,
    .markdown-body ol ol {
      margin: 0.25em 0;
    }

    /* Task Lists */
    .markdown-body input[type="checkbox"] {
      margin-left: 0.5em;
    }

    /* Blockquotes */
    .markdown-body blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-right: 0.25em solid #dfe2e5;
      margin: 0.5em 0;
    }

    .markdown-body blockquote > :first-child {
      margin-top: 0;
    }

    .markdown-body blockquote > :last-child {
      margin-bottom: 0;
    }

    /* Code */
    .markdown-body code {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9em;
      color: #e83e8c;
    }

    .markdown-body pre {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow: auto;
      margin: 0.5em 0;
      direction: ltr;
      text-align: left;
    }

    .markdown-body pre code {
      background: transparent;
      padding: 0;
      color: #24292e;
      font-size: 0.95em;
    }

    /* Tables */
    .markdown-body table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    .markdown-body table th,
    .markdown-body table td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
      text-align: right;
    }

    .markdown-body table th {
      background: #f6f8fa;
      font-weight: 600;
    }

    .markdown-body table tr:nth-child(even) {
      background: #f9f9f9;
    }

    /* Horizontal Rule */
    .markdown-body hr {
      border: none;
      border-top: 2px solid #eaecef;
      margin: 1.5em 0;
    }

    /* Links */
    .markdown-body a {
      color: #0366d6;
      text-decoration: none;
    }

    .markdown-body a:hover {
      text-decoration: underline;
    }

    /* Images */
    .markdown-body img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 0.5em 0;
    }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${htmlContent}
  </div>
</body>
</html>
    `;
  }

  // ========================================
  // Cleanup Old Files
  // ========================================
  cleanupOldFiles(userId) {
    try {
      const files = fs.readdirSync(this.outputDir);
      const userFiles = files.filter(f => f.includes(`markdown_${userId}_`));
      
      // Keep only the last 5 files for this user
      if (userFiles.length > 5) {
        const sortedFiles = userFiles
          .map(f => ({
            name: f,
            time: fs.statSync(path.join(this.outputDir, f)).mtime.getTime()
          }))
          .sort((a, b) => a.time - b.time);

        // Delete oldest files
        const filesToDelete = sortedFiles.slice(0, sortedFiles.length - 5);
        filesToDelete.forEach(file => {
          fs.unlinkSync(path.join(this.outputDir, file.name));
        });
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }

  // ========================================
  // Cleanup All Old Files (older than 24 hours)
  // ========================================
  cleanupAllOldFiles() {
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      files.forEach(file => {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up all old files:', error);
    }
  }
}

module.exports = MarkdownRenderer;
