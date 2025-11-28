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

    // Custom renderer for code blocks to support Mermaid
    const renderer = new marked.Renderer();
    const originalCodeRenderer = renderer.code.bind(renderer);

    renderer.code = function(code, language) {
      if (language === 'mermaid') {
        return `<div class="mermaid">\n${code}\n</div>`;
      }
      return originalCodeRenderer(code, language);
    };

    renderer.blockquote = function(quote) {
      const alertPattern = /^<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;
      const match = quote.match(alertPattern);
      
      if (match) {
        const type = match[1].toLowerCase();
        let content = quote.replace(alertPattern, '<p>');
        
        return `<div class="markdown-alert markdown-alert-${type}">
          <p class="markdown-alert-title">${type.charAt(0).toUpperCase() + type.slice(1)}</p>
          ${content}
        </div>`;
      }
      return `<blockquote>\n${quote}</blockquote>\n`;
    };

    // Configure marked options (keep all flags enabled while using the custom renderer)
    marked.setOptions({
      breaks: true,
      gfm: true, // GitHub Flavored Markdown
      tables: true,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      renderer
    });
  }

  // ========================================
  // Initialize Browser
  // ========================================
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
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
  async renderMarkdown(markdownText, userId, theme = 'github-light') {
    try {
      // Initialize browser
      await this.initBrowser();

      // Convert Markdown to HTML
      const html = marked.parse(markdownText);

      // Create full HTML document with styling
      const fullHtml = this.createStyledHtml(html, theme);

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

      // Wait for Mermaid to render if present
      if (fullHtml.includes('class="mermaid"')) {
        try {
          await page.waitForSelector('.mermaid svg', { timeout: 5000 });
        } catch (e) {
          console.warn('Mermaid rendering timed out or failed:', e.message);
        }
      }

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
  createStyledHtml(htmlContent, theme = 'github-light') {
    // Load theme CSS
    const themePath = path.join(__dirname, '../themes', `${theme}.css`);
    let themeCSS = '';

    try {
      if (fs.existsSync(themePath)) {
        themeCSS = fs.readFileSync(themePath, 'utf-8');
      } else {
        // Fallback to github-light if theme not found
        console.warn(`Theme ${theme} not found, falling back to github-light`);
        const fallbackPath = path.join(__dirname, '../themes', 'github-light.css');
        themeCSS = fs.readFileSync(fallbackPath, 'utf-8');
      }
    } catch (error) {
      console.error('Error loading theme CSS:', error);
      // Use inline default styles as last resort
      themeCSS = this.getDefaultStyles();
    }

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

    ${themeCSS}

    /* Sandbox readability overrides */
    .markdown-body {
      text-align: initial;
      line-height: 1.6;
    }

    .markdown-body p {
      margin: 0.35em 0;
    }

    .markdown-body ul,
    .markdown-body ol {
      margin: 0.75em 0;
      padding-inline-start: 1.5em;
    }

    .markdown-body li {
      margin: 0.15em 0;
      padding: 0;
      line-height: 1.5;
    }

    .markdown-body li > p {
      margin: 0;
    }

    /* Mermaid diagram styles */
    .mermaid {
      direction: ltr;
      text-align: center;
      margin: 1em auto;
    }

    /* GitHub Alerts */
    .markdown-alert {
      padding: 0.5rem 1rem;
      margin-bottom: 1rem;
      border-left: 0.25em solid;
      border-radius: 6px;
    }
    
    .markdown-alert-title {
      font-weight: 600;
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
  </style>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  </script>
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
  // Get Default Styles (Fallback)
  // ========================================
  getDefaultStyles() {
    return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px;
      direction: rtl;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .markdown-body {
      background: white;
      padding: 50px 60px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 100%;
      line-height: 1.8;
      color: #333;
      text-align: center;
      font-size: 1.15em;
    }

    /* Headers */
    .markdown-body h1 {
      font-size: 2.5em;
      margin: 0.67em 0;
      padding-bottom: 0.3em;
      border-bottom: 2px solid #eaecef;
      color: #24292e;
      font-weight: 700;
    }

    .markdown-body h2 {
      font-size: 2em;
      margin: 0.75em 0 0.5em 0;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
      color: #24292e;
      font-weight: 600;
    }

    .markdown-body h3 {
      font-size: 1.6em;
      margin: 0.75em 0 0.5em 0;
      color: #24292e;
      font-weight: 600;
    }

    .markdown-body h4,
    .markdown-body h5,
    .markdown-body h6 {
      font-size: 1.3em;
      margin: 0.75em 0 0.5em 0;
      color: #24292e;
      font-weight: 600;
    }

    /* Paragraphs */
    .markdown-body p {
      margin: 0.5em 0;
    }

    /* Emphasis */
    .markdown-body strong {
      font-weight: 700;
      color: #1a1a1a;
      background: linear-gradient(120deg, #ffd89b 0%, #19547b 100%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .markdown-body em {
      font-style: italic;
      color: #5a67d8;
      font-weight: 500;
    }

    .markdown-body del {
      text-decoration: line-through;
      color: #999;
      opacity: 0.7;
    }

    /* Lists */
    .markdown-body ul,
    .markdown-body ol {
      margin: 1em 0;
      padding-right: 2.5em;
      text-align: right;
    }

    .markdown-body li {
      margin: 0.5em 0;
      padding: 0.3em 0;
      line-height: 1.6;
    }

    .markdown-body ul > li::marker {
      color: #667eea;
      font-size: 1.2em;
      font-weight: bold;
    }

    .markdown-body ol > li::marker {
      color: #764ba2;
      font-weight: bold;
      font-size: 1.1em;
    }

    .markdown-body ul ul,
    .markdown-body ol ul,
    .markdown-body ul ol,
    .markdown-body ol ol {
      margin: 0.5em 0;
    }

    /* Task Lists */
    .markdown-body input[type="checkbox"] {
      margin-left: 0.5em;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    /* Blockquotes */
    .markdown-body blockquote {
      padding: 1em 1.5em;
      color: #374151;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-right: 5px solid #667eea;
      margin: 1em 0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-style: italic;
      position: relative;
    }

    .markdown-body blockquote::before {
      content: '"';
      font-size: 4em;
      color: #667eea;
      opacity: 0.2;
      position: absolute;
      top: -10px;
      right: 10px;
      font-family: Georgia, serif;
    }

    .markdown-body blockquote > :first-child {
      margin-top: 0;
    }

    .markdown-body blockquote > :last-child {
      margin-bottom: 0;
    }

    /* Code */
    .markdown-body code {
      background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
      padding: 0.3em 0.6em;
      border-radius: 6px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 1em;
      color: #c53030;
      font-weight: 600;
      border: 1px solid #feb2b2;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .markdown-body pre {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      padding: 24px;
      border-radius: 12px;
      overflow: auto;
      margin: 1em 0;
      direction: ltr;
      text-align: left;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 2px solid #4a5568;
    }

    .markdown-body pre code {
      background: transparent;
      padding: 0;
      color: #68d391;
      font-size: 1em;
      border: none;
      box-shadow: none;
      font-weight: 500;
    }

    /* Tables */
    .markdown-body table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      margin: 1.5em auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 2px solid #667eea;
    }

    .markdown-body table th,
    .markdown-body table td {
      border: none;
      padding: 14px 18px;
      text-align: center;
      font-size: 1.05em;
    }

    .markdown-body table th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 3px solid #4c51bf;
    }

    .markdown-body table tr:nth-child(even) {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    }

    .markdown-body table tr:nth-child(odd) {
      background: white;
    }

    .markdown-body table tr:hover {
      background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
      transform: scale(1.01);
      transition: all 0.3s ease;
    }

    /* Horizontal Rule */
    .markdown-body hr {
      border: none;
      height: 4px;
      background: linear-gradient(90deg, transparent 0%, #667eea 20%, #764ba2 50%, #667eea 80%, transparent 100%);
      margin: 2em 0;
      border-radius: 2px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* Links */
    .markdown-body a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 2px solid transparent;
      transition: all 0.3s ease;
      padding-bottom: 2px;
    }

    .markdown-body a:hover {
      color: #764ba2;
      border-bottom: 2px solid #764ba2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* Images */
    .markdown-body img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin: 1em auto;
      display: block;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      border: 3px solid #667eea;
      transition: transform 0.3s ease;
    }

    .markdown-body img:hover {
      transform: scale(1.02);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    }
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
