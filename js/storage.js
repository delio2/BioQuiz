// Gestione Storage locale
const STORAGE_KEY_STATS = 'bioquiz_stats';
const STORAGE_KEY_WRONG = 'bioquiz_wrong_questions';
const STORAGE_KEY_SEEN = 'bioquiz_seen_questions';
const STORAGE_KEY_CUSTOM_JSON = 'bioquiz_custom_json';
const STORAGE_KEY_SESSION = 'bioquiz_session';
const STORAGE_KEY_THEME = 'bioquiz_theme';

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
  }
};
