// Gestione Storage locale
const STORAGE_KEY_STATS = 'bioquiz_stats';
const STORAGE_KEY_WRONG = 'bioquiz_wrong_questions';
const STORAGE_KEY_CUSTOM_JSON = 'bioquiz_custom_json';

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
    try {
      const data = localStorage.getItem(STORAGE_KEY_WRONG);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addWrongQuestion(questionId) {
    const wrongList = this.getWrongQuestions();
    if (!wrongList.includes(questionId)) {
      wrongList.push(questionId);
      localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(wrongList));
    }
  },

  removeWrongQuestion(questionId) {
    let wrongList = this.getWrongQuestions();
    wrongList = wrongList.filter(id => id !== questionId);
    localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(wrongList));
  },

  getCustomJson() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CUSTOM_JSON);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCustomJson(jsonData) {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_JSON, JSON.stringify(jsonData));
      return true;
    } catch (e) {
      console.error('Local Storage pieno, impossibile salvare il custom JSON', e);
      return false;
    }
  },

  resetAll() {
    localStorage.removeItem(STORAGE_KEY_STATS);
    localStorage.removeItem(STORAGE_KEY_WRONG);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_JSON);
  }
};
