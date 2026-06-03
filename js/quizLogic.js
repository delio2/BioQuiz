import { storage } from './storage.js?v=4';
import { defaultQuestions } from './defaultQuestions.js?v=4';

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
    const pdfCounts = {};
    allQuestions.forEach(q => {
      if (q.pdf_origine) {
        pdfCounts[q.pdf_origine] = (pdfCounts[q.pdf_origine] || 0) + 1;
      }
    });
    return Object.keys(pdfCounts).sort().map(name => ({
      name: name,
      count: pdfCounts[name]
    }));
  },

  // Rimescola l'ordine delle opzioni e aggiorna l'indice della risposta corretta.
  // Funziona con qualsiasi numero di opzioni (4 o 5).
  _shuffleOptions(questionsArray) {
    return questionsArray.map(q => {
      const qCopy = { ...q };
      const nOpts = Array.isArray(q.opzioni) ? q.opzioni.length : 0;

      // Guard: se la domanda non ha opzioni valide la restituiamo intatta
      if (nOpts === 0) return qCopy;

      const safeCorrect = (q.rispostaCorretta >= 0 && q.rispostaCorretta < nOpts)
        ? q.rispostaCorretta : 0;

      const optionsWithStatus = q.opzioni.map((opt, idx) => ({ text: opt, isCorrect: idx === safeCorrect }));
      this.shuffle(optionsWithStatus);
      qCopy.opzioni = optionsWithStatus.map(o => o.text);
      qCopy.rispostaCorretta = optionsWithStatus.findIndex(o => o.isCorrect);
      return qCopy;
    });
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

    let selected = [...pool];
    this.shuffle(selected);
    if (config.count && config.count !== 'all') {
      selected = selected.slice(0, parseInt(config.count));
    }
    
    return this._shuffleOptions(selected);
  },

  generateExam() {
    // Raggruppa per modulo e includi solo i moduli effettivamente presenti nel DB.
    // Così l'esame resta giocabile anche se un modulo non ha (ancora) domande.
    const byModule = {};
    allQuestions.forEach(q => {
      if (q.modulo === null || q.modulo === undefined) return;
      (byModule[q.modulo] = byModule[q.modulo] || []).push(q);
    });

    let examQuestions = [];
    Object.keys(byModule).sort((a, b) => a - b).forEach(mod => {
      const pool = byModule[mod];
      this.shuffle(pool);
      examQuestions = examQuestions.concat(pool.slice(0, 12)); // fino a 12 per modulo
    });

    this.shuffle(examQuestions); // Mescola l'ordine dei moduli
    return this._shuffleOptions(examQuestions);
  },

  // Soglia di sufficienza originale: 5.6 punti su un massimo di 9.6 (12 domande * 0.8) ≈ 58,3%.
  // La applichiamo in proporzione al numero reale di domande di ciascun modulo nell'esame,
  // così con 12 domande/modulo si ottiene esattamente la soglia storica di 5.6.
  PASS_RATIO: 5.6 / 9.6,

  calculateExamResults(answers, examQuestions = []) {
    const totalQuestionsInExam = examQuestions.length || answers.length;

    // Conteggio domande per modulo effettivamente presenti nell'esame
    const moduleCounts = {};
    examQuestions.forEach(q => {
      moduleCounts[q.modulo] = (moduleCounts[q.modulo] || 0) + 1;
    });

    const round2 = n => Math.round(n * 100) / 100;

    const moduleScores = {};
    let totalScore = 0;
    let answered = 0;

    answers.forEach(ans => {
      if (!ans || ans.selectedIndex === null || ans.selectedIndex === undefined) return;
      answered++;
      const points = (ans.selectedIndex === ans.correctIndex) ? 0.8 : -0.2;
      totalScore += points;
      moduleScores[ans.module] = (moduleScores[ans.module] || 0) + points;
    });

    totalScore = Math.max(0, round2(totalScore));

    // Fallback: se non ho ricevuto le domande, deduco i moduli dalle risposte
    let moduli = Object.keys(moduleCounts);
    if (moduli.length === 0) {
      moduli = [...new Set(answers.filter(a => a && a.module != null).map(a => String(a.module)))];
      moduli.forEach(m => { moduleCounts[m] = answers.filter(a => a && String(a.module) === m).length; });
    }

    const modules = moduli.sort((a, b) => a - b).map(m => {
      const count = moduleCounts[m];
      const max = count * 0.8;
      const score = round2(moduleScores[m] || 0);
      return { modulo: m, score, max: round2(max), count, passed: score >= this.PASS_RATIO * max };
    });

    const allModulesPassed = modules.length > 0 && modules.every(m => m.passed);
    const unanswered = totalQuestionsInExam - answered;
    const maxUnanswered = Math.round(totalQuestionsInExam * 4 / 36); // 4 su 36, in proporzione

    const TOTAL_MAX = Math.max(1, totalQuestionsInExam * 0.8);
    let finalGrade30 = Math.round((totalScore / TOTAL_MAX) * 31 * 10) / 10;
    finalGrade30 = Math.min(31, Math.max(0, finalGrade30));

    const passed = allModulesPassed && unanswered <= maxUnanswered && finalGrade30 >= 18;

    return { totalScore, finalGrade30, passed, unanswered, maxUnanswered, modules };
  },

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
};
