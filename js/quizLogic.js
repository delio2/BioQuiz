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

  getTopicsAndPps() {
    const topics = new Set();
    const pps = new Set();
    allQuestions.forEach(q => {
      if (q.argomento) topics.add(q.argomento);
      if (q.powerpoint) pps.add(q.powerpoint);
    });
    return {
      topics: Array.from(topics).sort(),
      pps: Array.from(pps).sort()
    };
  },

  getQuestionsForStudy(config) {
    let pool = allQuestions;

    if (config.mode === 'wrong') {
      const wrongIds = storage.getWrongQuestions();
      pool = allQuestions.filter(q => wrongIds.includes(q.id));
    } else {
      if (config.topic && config.topic !== 'all') {
        pool = pool.filter(q => q.argomento === config.topic);
      }
      if (config.pp && config.pp !== 'all') {
        pool = pool.filter(q => q.powerpoint === config.pp);
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

  calculateExamResults(answers) {
    // answers è un array di oggetti: { questionId: "q_001", selectedIndex: 1, correctIndex: 1, module: 1 }
    // Unanswered avrà selectedIndex = null
    let stats = {
      totalScore: 0,
      unanswered: 0,
      m1Score: 0, m2Score: 0, m3Score: 0,
      finalGrade30: 0,
      passed: false,
      m1Passed: false, m2Passed: false, m3Passed: false
    };

    const MOD1_PASS = 5.6;
    const MOD2_PASS = 5.6;
    const MOD3_PASS = 5.6;
    const TOTAL_MAX = 28.8;

    answers.forEach(ans => {
      let points = 0;
      if (ans.selectedIndex === null || ans.selectedIndex === undefined) {
        stats.unanswered++;
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

    // Limit score not to go below zero theoretically for final display
    stats.totalScore = Math.max(0, stats.totalScore);

    // Conversione in 30esimi (31 = 30 e lode)
    stats.finalGrade30 = Math.round((stats.totalScore / TOTAL_MAX) * 31 * 10) / 10;

    stats.m1Passed = stats.m1Score >= MOD1_PASS;
    stats.m2Passed = stats.m2Score >= MOD2_PASS;
    stats.m3Passed = stats.m3Score >= MOD3_PASS;

    // Regola delle mancate risposte (max 4 per passare l'esame vero e proprio)
    const withinUnansweredLimit = stats.unanswered <= 4;

    stats.passed = stats.m1Passed && stats.m2Passed && stats.m3Passed && withinUnansweredLimit && stats.finalGrade30 >= 18;

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
