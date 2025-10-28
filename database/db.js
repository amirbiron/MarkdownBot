const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    // Use persistent disk on Render if available, otherwise use local path
    let dbPath = process.env.DATABASE_PATH || '/data/users.db';

    // Create database directory if it doesn't exist
    const dbDir = path.dirname(dbPath);

    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`📁 Created database directory: ${dbDir}`);
      }
    } catch (error) {
      // If /data is not accessible (e.g., no volume mounted), fallback to local path
      console.warn(`⚠️ Cannot create directory ${dbDir}:`, error.message);
      console.log(`🔄 Falling back to local database path...`);
      dbPath = path.join(__dirname, 'users.db');
      console.log(`📂 Using local database at: ${dbPath}`);
    }

    this.db = new Database(dbPath);
    this.dbPath = dbPath;

    this.initializeTables();
    console.log(`✅ Database initialized successfully at: ${dbPath}`);

    // Log database info for debugging
    console.log(`📊 Database info:
    - Path: ${this.dbPath}
    - Directory exists: ${fs.existsSync(path.dirname(this.dbPath))}
    - File exists: ${fs.existsSync(this.dbPath)}
    - Writable: ${this.testWriteAccess()}
    `);
  }

  testWriteAccess() {
    try {
      // Try to write a test record and read it back
      const testStmt = this.db.prepare('SELECT 1 as test');
      testStmt.get();
      return true;
    } catch (error) {
      console.error('❌ Database write test failed:', error);
      return false;
    }
  }

  initializeTables() {
    // Users table - stores basic user info and settings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT DEFAULT 'he',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
      )
    `);

    // User progress table - tracks learning progress
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id INTEGER PRIMARY KEY,
        current_lesson INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        level TEXT DEFAULT 'Beginner',
        lessons_completed INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        wrong_answers INTEGER DEFAULT 0,
        last_lesson_date DATETIME,
        learning_pace TEXT DEFAULT 'normal',
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // Lesson history - tracks each lesson completion
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS lesson_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        lesson_id INTEGER,
        is_correct INTEGER,
        answer_given TEXT,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // User modes - tracks current mode (sandbox, quiz, etc)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_modes (
        user_id INTEGER PRIMARY KEY,
        current_mode TEXT DEFAULT 'normal',
        mode_data TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // Topic performance - tracks performance per topic
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS topic_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        topic TEXT,
        correct_count INTEGER DEFAULT 0,
        wrong_count INTEGER DEFAULT 0,
        last_practiced DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        UNIQUE(user_id, topic)
      )
    `);

    // Training sessions - tracks training mode sessions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS training_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        topic TEXT,
        challenges_completed INTEGER DEFAULT 0,
        challenges_correct INTEGER DEFAULT 0,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);
  }

  // ========================================
  // User Management
  // ========================================

  getUser(userId) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE user_id = ?');
    return stmt.get(userId);
  }

  createUser(userId, username, firstName, lastName, languageCode = 'he') {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO users (user_id, username, first_name, last_name, language_code)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(userId, username, firstName, lastName, languageCode);
    
    // Also create progress record
    if (result.changes > 0) {
      const progressStmt = this.db.prepare(`
        INSERT INTO user_progress (user_id)
        VALUES (?)
      `);
      progressStmt.run(userId);
    }
    
    return result.changes > 0;
  }

  updateLastActive(userId) {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET last_active = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `);
    stmt.run(userId);
  }

  // ========================================
  // User Progress Management
  // ========================================

  getUserProgress(userId) {
    const stmt = this.db.prepare('SELECT * FROM user_progress WHERE user_id = ?');
    return stmt.get(userId);
  }

  updateCurrentLesson(userId, lessonId) {
    const stmt = this.db.prepare(`
      UPDATE user_progress 
      SET current_lesson = ?,
          last_lesson_date = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(lessonId, userId);
  }

  incrementScore(userId, points) {
    const stmt = this.db.prepare(`
      UPDATE user_progress 
      SET total_score = total_score + ?
      WHERE user_id = ?
    `);
    stmt.run(points, userId);
  }

  incrementLessonsCompleted(userId) {
    const stmt = this.db.prepare(`
      UPDATE user_progress 
      SET lessons_completed = lessons_completed + 1
      WHERE user_id = ?
    `);
    stmt.run(userId);
  }

  updateLevel(userId, level) {
    const stmt = this.db.prepare(`
      UPDATE user_progress 
      SET level = ?
      WHERE user_id = ?
    `);
    stmt.run(level, userId);
  }

  recordAnswer(userId, isCorrect) {
    const field = isCorrect ? 'correct_answers' : 'wrong_answers';
    const stmt = this.db.prepare(`
      UPDATE user_progress 
      SET ${field} = ${field} + 1
      WHERE user_id = ?
    `);
    stmt.run(userId);
  }

  updateLearningPace(userId, pace) {
    const stmt = this.db.prepare(`
      UPDATE user_progress 
      SET learning_pace = ?
      WHERE user_id = ?
    `);
    stmt.run(pace, userId);
  }

  // ========================================
  // Lesson History
  // ========================================

  addLessonHistory(userId, lessonId, isCorrect, answerGiven) {
    const stmt = this.db.prepare(`
      INSERT INTO lesson_history (user_id, lesson_id, is_correct, answer_given)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, lessonId, isCorrect ? 1 : 0, answerGiven);
  }

  getLessonHistory(userId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM lesson_history 
      WHERE user_id = ? 
      ORDER BY completed_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  // ========================================
  // User Modes (sandbox, quiz, etc)
  // ========================================

  getUserMode(userId) {
    const stmt = this.db.prepare('SELECT * FROM user_modes WHERE user_id = ?');
    let mode = stmt.get(userId);
    
    if (!mode) {
      // Create default mode
      const insertStmt = this.db.prepare(`
        INSERT INTO user_modes (user_id, current_mode)
        VALUES (?, 'normal')
      `);
      insertStmt.run(userId);
      mode = { user_id: userId, current_mode: 'normal', mode_data: null };
    }
    
    return mode;
  }

  setUserMode(userId, mode, modeData = null) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_modes (user_id, current_mode, mode_data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(userId, mode, modeData);
  }

  clearUserMode(userId) {
    this.setUserMode(userId, 'normal', null);
  }

  // ========================================
  // Topic Performance Tracking
  // ========================================

  updateTopicPerformance(userId, topic, isCorrect) {
    const field = isCorrect ? 'correct_count' : 'wrong_count';
    
    const stmt = this.db.prepare(`
      INSERT INTO topic_performance (user_id, topic, ${field}, last_practiced)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, topic) DO UPDATE SET
        ${field} = ${field} + 1,
        last_practiced = CURRENT_TIMESTAMP
    `);
    
    stmt.run(userId, topic);
  }

  getTopicPerformance(userId, topic) {
    const stmt = this.db.prepare(`
      SELECT * FROM topic_performance 
      WHERE user_id = ? AND topic = ?
    `);
    return stmt.get(userId, topic);
  }

  getAllTopicPerformance(userId) {
    const stmt = this.db.prepare(`
      SELECT * FROM topic_performance 
      WHERE user_id = ?
      ORDER BY last_practiced DESC
    `);
    return stmt.all(userId);
  }

  getWeakTopics(userId, limit = 3) {
    const stmt = this.db.prepare(`
      SELECT topic, 
             correct_count, 
             wrong_count,
             CAST(wrong_count AS FLOAT) / NULLIF(correct_count + wrong_count, 0) as error_rate
      FROM topic_performance 
      WHERE user_id = ? AND (correct_count + wrong_count) >= 2
      ORDER BY error_rate DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  // ========================================
  // Statistics
  // ========================================

  getUserStats(userId) {
    const progress = this.getUserProgress(userId);
    const topicPerformance = this.getAllTopicPerformance(userId);
    const recentHistory = this.getLessonHistory(userId, 5);
    
    return {
      progress,
      topicPerformance,
      recentHistory,
      accuracy: progress ? 
        (progress.correct_answers / (progress.correct_answers + progress.wrong_answers) * 100).toFixed(1) : 
        0
    };
  }

  getTotalUsers() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  }

  getActiveUsers(days = 7) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE last_active >= datetime('now', '-' || ? || ' days')
    `);
    return stmt.get(days).count;
  }

  // ========================================
  // Training Sessions Management
  // ========================================

  createTrainingSession(userId, topic) {
    const stmt = this.db.prepare(`
      INSERT INTO training_sessions (user_id, topic, status)
      VALUES (?, ?, 'active')
    `);
    const result = stmt.run(userId, topic);
    return result.lastInsertRowid;
  }

  getActiveTrainingSession(userId) {
    const stmt = this.db.prepare(`
      SELECT * FROM training_sessions
      WHERE user_id = ? AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `);
    return stmt.get(userId);
  }

  updateTrainingProgress(sessionId, completed, correct) {
    const stmt = this.db.prepare(`
      UPDATE training_sessions
      SET challenges_completed = ?,
          challenges_correct = ?
      WHERE id = ?
    `);
    stmt.run(completed, correct, sessionId);
  }

  completeTrainingSession(sessionId) {
    const stmt = this.db.prepare(`
      UPDATE training_sessions
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(sessionId);
  }

  cancelTrainingSession(sessionId) {
    const stmt = this.db.prepare(`
      UPDATE training_sessions
      SET status = 'cancelled',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(sessionId);
  }

  getTrainingHistory(userId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM training_sessions
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  getTrainingStats(userId) {
    const stmt = this.db.prepare(`
      SELECT
        topic,
        COUNT(*) as sessions_count,
        SUM(challenges_completed) as total_challenges,
        SUM(challenges_correct) as total_correct,
        CAST(SUM(challenges_correct) AS FLOAT) / NULLIF(SUM(challenges_completed), 0) as success_rate
      FROM training_sessions
      WHERE user_id = ? AND status = 'completed'
      GROUP BY topic
    `);
    return stmt.all(userId);
  }

  // ========================================
  // Cleanup
  // ========================================

  close() {
    this.db.close();
    console.log('✅ Database connection closed');
  }
}

module.exports = DatabaseManager;
