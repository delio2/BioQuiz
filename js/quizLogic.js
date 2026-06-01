import { storage } from './storage.js';
import { defaultQuestions } from './defaultQuestions.js';

let allQuestions = [];

export const quizLogic = {
  async init() {
    // Prova a caricare prima il JSON personalizzato se esiste
    const customJson = storage.getCustomJson();
    if (customJson && customJson.length > 0) {
      allQuestions = customJson;
      return true;
    }
    
    // Altrimenti carica quello di default (ora via JS module per evitare CORS error su file://)
    allQuestions = defaultQuestions;
    return true;
  },

  getAllQuestions() {
    return allQuestions;
  },

  getPdfs() {
    const pps = new Set();
    allQuestions.forEach(q => {
      if (q.pdf_origine) pps.add(q.pdf_origine);
    });
    return Array.from(pps).sort();
  },

  getQuestionsForStudy(config) {
    let pool = allQuestions;

    if (config.mode === 'wrong') {
      const wrongIds = storage.getWrongQuestions();
      pool = allQuestions.filter(q => wrongIds.includes(q.id));
    } else if (config.mode === 'unseen') {
      const seenIds = storage.getSeenQuestions();
      pool = allQuestions.filter(q => !seenIds.includes(q.id));
    } else {
      // config.pdfs is an array of pdf names. If empty or includes 'all', ignore filter.
      if (config.pdfs && config.pdfs.length > 0 && !config.pdfs.includes('all')) {
        pool = pool.filter(q => config.pdfs.includes(q.pdf_origine));
      }
    }

    // Shuffle and slice
    pool = this.shuffle(pool);
    if (config.count && config.count !== 'all') {
      pool = pool.slice(0, parseInt(config.count));
    }
    return pool;
  },

  generateExam() {
    // 3 moduli, 12 domande per modulo
    const m1 = this.shuffle(allQuestions.filter(q => q.modulo === 1)).slice(0, 12);
    const m2 = this.shuffle(allQuestions.filter(q => q.modulo === 2)).slice(0, 12);
    const m3 = this.shuffle(allQuestions.filter(q => q.modulo === 3)).slice(0, 12);

    // Se non ci sono abbastanza domande nei moduli (es. database piccolo), prendiamo quello che c'è
    return [...m1, ...m2, ...m3];
  },

  calculateExamResults(answers, totalQuestionsInExam = 36) {
    const stats = {
      totalScore: 0,
      m1Score: 0, m2Score: 0, m3Score: 0,
      m1Passed: false, m2Passed: false, m3Passed: false,
      passed: false,
      finalGrade30: 0,
      unanswered: 0
    };

    // Calculate unanswered based on what's missing or marked as null
    const actuallyAnsweredCount = answers.filter(a => a.selectedIndex !== null && a.selectedIndex !== undefined).length;
    stats.unanswered = totalQuestionsInExam - actuallyAnsweredCount;

    const MOD1_PASS = 5.6;
    const MOD2_PASS = 5.6;
    const MOD3_PASS = 5.6;

    answers.forEach(ans => {
      let points = 0;
      if (ans.selectedIndex === null || ans.selectedIndex === undefined) {
        // Already tallied in stats.unanswered, 0 points
      } else if (ans.selectedIndex === ans.correctIndex) {
        points = 0.8;
      } else {
        points = -0.2;
      }

      stats.totalScore += points;
      if (ans.module === 1) stats.m1Score += points;
      if (ans.module === 2) stats.m2Score += points;
      if (ans.module === 3) stats.m3Score += points;
    });

    // Arrotondamento per prevenire i classici errori in virgola mobile di JavaScript (es. 5.600000001)
    stats.totalScore = Math.round(stats.totalScore * 100) / 100;
    stats.m1Score = Math.round(stats.m1Score * 100) / 100;
    stats.m2Score = Math.round(stats.m2Score * 100) / 100;
    stats.m3Score = Math.round(stats.m3Score * 100) / 100;

    // Limit score not to go below zero theoretically for final display
    stats.totalScore = Math.max(0, stats.totalScore);

    // Calculate max possible points based on the actual number of questions generated
    const TOTAL_MAX = Math.max(1, totalQuestionsInExam * 0.8);

    stats.finalGrade30 = Math.round((stats.totalScore / TOTAL_MAX) * 31 * 10) / 10;
    
    // Limits
    if (stats.finalGrade30 > 31) stats.finalGrade30 = 31;
    if (stats.finalGrade30 < 0) stats.finalGrade30 = 0;

    stats.m1Passed = stats.m1Score >= MOD1_PASS;
    stats.m2Passed = stats.m2Score >= MOD2_PASS;
    stats.m3Passed = stats.m3Score >= MOD3_PASS;

    stats.passed = stats.m1Passed && stats.m2Passed && stats.m3Passed && stats.unanswered <= 4 && stats.finalGrade30 >= 18;

    return stats;
  },

  shuffle(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }
};
