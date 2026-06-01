// Gestione Storage locale
const STORAGE_KEY_STATS = 'bioquiz_stats';
const STORAGE_KEY_WRONG = 'bioquiz_wrong_questions';
const STORAGE_KEY_SEEN = 'bioquiz_seen_questions';
const STORAGE_KEY_CUSTOM_JSON = 'bioquiz_custom_json';
const STORAGE_KEY_SESSION = 'bioquiz_session';
const STORAGE_KEY_THEME = 'bioquiz_theme';
const STORAGE_KEY_EXAM_HISTORY = 'bioquiz_exam_history';
const STORAGE_KEY_PDF_STATS = 'bioquiz_pdf_stats';

export const storage = {
  getStats() {
    const defaultStats = { totalExams: 0, passedExams: 0, totalStudyQuestions: 0 };
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATS);
      return data ? JSON.parse(data) : defaultStats;
    } catch {
      return defaultStats;
    }
  },
  
  saveStats(stats) {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  },

  updateStats(examPassed = null, studyQuestionsCount = 0) {
    const stats = this.getStats();
    if (examPassed !== null) {
      stats.totalExams++;
      if (examPassed) stats.passedExams++;
    }
    stats.totalStudyQuestions += studyQuestionsCount;
    this.saveStats(stats);
  },

  getExamHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_EXAM_HISTORY)) || []; } catch { return []; }
  },
  addExamToHistory(examData) {
    const history = this.getExamHistory();
    history.push({
      date: new Date().toISOString(),
      ...examData
    });
    try { localStorage.setItem(STORAGE_KEY_EXAM_HISTORY, JSON.stringify(history)); } catch (e) { console.warn(e); }
  },

  getPdfStats() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PDF_STATS)) || {}; } catch { return {}; }
  },
  updatePdfStat(pdfName, isCorrect) {
    if (!pdfName) return;
    const stats = this.getPdfStats();
    if (!stats[pdfName]) {
      stats[pdfName] = { correct: 0, wrong: 0, total: 0 };
    }
    stats[pdfName].total++;
    if (isCorrect) stats[pdfName].correct++;
    else stats[pdfName].wrong++;
    
    try { localStorage.setItem(STORAGE_KEY_PDF_STATS, JSON.stringify(stats)); } catch(e) { console.warn(e); }
  },

  getWrongQuestions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_WRONG)) || []; } catch { return []; }
  },
  addWrongQuestion(questionId) {
    const list = this.getWrongQuestions();
    if (!list.includes(questionId)) {
      list.push(questionId);
      localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(list));
    }
  },
  removeWrongQuestion(questionId) {
    let list = this.getWrongQuestions();
    list = list.filter(id => id !== questionId);
    localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(list));
  },

  getSeenQuestions() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SEEN)) || []; } catch { return []; }
  },
  addSeenQuestions(questionIdsArr) {
    const list = new Set(this.getSeenQuestions());
    questionIdsArr.forEach(id => list.add(id));
    try {
      localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(Array.from(list)));
    } catch(e) {
      console.warn('Quota LocalStorage superata per le domande viste.', e);
    }
  },

  getCustomJson() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_JSON)); } catch { return null; }
  },
  saveCustomJson(jsonData) {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_JSON, JSON.stringify(jsonData));
      return true;
    } catch (e) {
      console.error('Local Storage pieno', e);
      return false;
    }
  },

  getSessionState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SESSION)); } catch { return null; }
  },
  saveSessionState(state) {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(state));
    } catch(e) {
      console.warn('Quota LocalStorage superata o errore di salvataggio sessione', e);
    }
  },
  clearSessionState() {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEY_THEME) || 'light';
  },
  setTheme(theme) {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  },

  resetAll() {
    localStorage.removeItem(STORAGE_KEY_STATS);
    localStorage.removeItem(STORAGE_KEY_WRONG);
    localStorage.removeItem(STORAGE_KEY_SEEN);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_JSON);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_EXAM_HISTORY);
    localStorage.removeItem(STORAGE_KEY_PDF_STATS);
  }
};
