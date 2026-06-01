import { ui } from './ui.js';
import { storage } from './storage.js';
import { quizLogic } from './quizLogic.js';

let appState = {
  currentView: 'home',
  mode: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  correctCount: 0,
  timerInterval: null,
  timeRemaining: 0 // In seconds
};

// Inizializzazione
async function initApp() {
  applyTheme(storage.getTheme());

  const loaded = await quizLogic.init();
  if (!loaded) {
    alert("Errore critico: impossibile caricare il database delle domande.");
    return;
  }
  
  // Bind global navigation
  document.getElementById('app-title').addEventListener('click', goHome);
  document.getElementById('settings-btn').addEventListener('click', goSettings);
  document.getElementById('btn-back-nav').addEventListener('click', goHome);
  
  goHome();
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  storage.setTheme(theme);
}

function goHome() {
  stopTimer();
  appState.currentView = 'home';
  document.getElementById('btn-back-nav').style.display = 'none'; // Nascondi back button in home
  
  const stats = storage.getStats();
  const session = storage.getSessionState();
  ui.showHome(stats, session !== null);
  
  document.getElementById('btn-start-exam').addEventListener('click', () => startExam());
  document.getElementById('btn-start-study').addEventListener('click', goStudyConfig);
  document.getElementById('btn-start-unseen').addEventListener('click', () => {
    appState.mode = 'unseen';
    appState.questions = quizLogic.getQuestionsForStudy({ mode: 'unseen' });
    if (appState.questions.length === 0) {
      alert("Hai già visto tutte le domande del database! Complimenti!");
      return;
    }
    startSession(false);
  });
  document.getElementById('btn-review-wrong').addEventListener('click', () => {
    const wrongIds = storage.getWrongQuestions();
    if (wrongIds.length === 0) {
      alert("Non hai ancora sbagliato nessuna domanda! Ottimo lavoro!");
      return;
    }
    appState.mode = 'wrong';
    appState.questions = quizLogic.getQuestionsForStudy({ mode: 'wrong' });
    startSession(false);
  });

  const resumeBtn = document.getElementById('btn-resume-session');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      resumeSession(session);
    });
  }
}

function goSettings() {
  appState.currentView = 'settings';
  document.getElementById('btn-back-nav').style.display = 'block';
  ui.showSettings(storage.getCustomJson() !== null, storage.getTheme());
  
  document.getElementById('theme-selector').addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });

  document.getElementById('btn-reset-stats').addEventListener('click', () => {
    if (confirm("Sei sicuro di voler resettare TUTTO?")) {
      storage.resetAll();
      quizLogic.init(); 
      goHome();
    }
  });

  const btnResetJson = document.getElementById('btn-reset-json');
  if (btnResetJson) {
    btnResetJson.addEventListener('click', () => {
      localStorage.removeItem('bioquiz_custom_json');
      quizLogic.init();
      goSettings();
    });
  }

  document.getElementById('json-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target.result);
          if (Array.isArray(json) && json.length > 0 && json[0].id) {
            const success = storage.saveCustomJson(json);
            if (success) {
              await quizLogic.init();
              alert("Database aggiornato con successo!");
              goSettings();
            } else {
              alert("Il file è troppo grande per la memoria del browser.");
            }
          } else {
            alert("Formato JSON non valido. Deve essere un array di domande.");
          }
        } catch (err) {
          alert("Errore nella lettura del file JSON.");
        }
      };
      reader.readAsText(file);
    }
  });
}

function goStudyConfig() {
  appState.currentView = 'studyConfig';
  document.getElementById('btn-back-nav').style.display = 'block';
  
  const pps = quizLogic.getPdfs();
  ui.showStudyConfig(pps);
  
  // Logic for checkboxes
  const checkAll = document.getElementById('check-all-pdfs');
  const pdfCheckboxes = document.querySelectorAll('.pdf-checkbox');
  
  checkAll.addEventListener('change', (e) => {
    pdfCheckboxes.forEach(cb => cb.checked = e.target.checked);
  });
  pdfCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked) checkAll.checked = false;
      const allChecked = Array.from(pdfCheckboxes).every(c => c.checked);
      if (allChecked) checkAll.checked = true;
    });
  });

  document.getElementById('btn-begin-study').addEventListener('click', () => {
    const selectedPdfs = checkAll.checked ? ['all'] : Array.from(pdfCheckboxes).filter(c => c.checked).map(c => c.value);
    
    if (selectedPdfs.length === 0 && !checkAll.checked) {
      alert("Seleziona almeno un PDF!");
      return;
    }

    const config = {
      mode: 'study',
      pdfs: selectedPdfs,
      count: document.getElementById('config-count').value
    };
    
    appState.mode = 'study';
    appState.questions = quizLogic.getQuestionsForStudy(config);
    if (appState.questions.length === 0) {
      alert("Nessuna domanda trovata in questi PDF.");
      return;
    }
    startSession(false);
  });
}

function startExam() {
  appState.mode = 'exam';
  appState.questions = quizLogic.generateExam();
  if (appState.questions.length < 36) {
    alert(`Attenzione: nel database ci sono solo ${appState.questions.length} domande. L'esame potrebbe non essere completo.`);
  }
  startSession(true);
}

function startSession(isExamNew) {
  appState.currentView = 'quizSession';
  document.getElementById('btn-back-nav').style.display = 'block';
  appState.currentIndex = 0;
  appState.answers = [];
  appState.correctCount = 0;
  
  if (isExamNew) {
    // 60 minutes timer for 36 questions
    appState.timeRemaining = 60 * 60; 
    startTimer();
  }

  saveCurrentSession();
  renderCurrentQuestion();
}

function resumeSession(session) {
  if (!session) return;
  appState.mode = session.mode;
  appState.questions = session.questions;
  appState.currentIndex = session.currentIndex;
  appState.answers = session.answers;
  appState.correctCount = session.correctCount;
  appState.timeRemaining = session.timeRemaining;
  
  appState.currentView = 'quizSession';
  document.getElementById('btn-back-nav').style.display = 'block';
  
  if (appState.mode === 'exam' && appState.timeRemaining > 0) {
    startTimer();
  }
  
  renderCurrentQuestion();
}

function saveCurrentSession() {
  storage.saveSessionState({
    mode: appState.mode,
    questions: appState.questions,
    currentIndex: appState.currentIndex,
    answers: appState.answers,
    correctCount: appState.correctCount,
    timeRemaining: appState.timeRemaining
  });
}

function startTimer() {
  stopTimer();
  appState.timerInterval = setInterval(() => {
    appState.timeRemaining--;
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = formatTime(appState.timeRemaining);
    }
    
    // Save timer periodically (every 5 seconds)
    if (appState.timeRemaining % 5 === 0) saveCurrentSession();
    
    if (appState.timeRemaining <= 0) {
      stopTimer();
      alert("Tempo Scaduto!");
      finishSession();
    }
  }, 1000);
}

function stopTimer() {
  if (appState.timerInterval) clearInterval(appState.timerInterval);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderCurrentQuestion() {
  if (appState.currentIndex >= appState.questions.length) {
    finishSession();
    return;
  }
  
  const q = appState.questions[appState.currentIndex];
  
  // Aggiungi ai "visti"
  storage.addSeenQuestions([q.id]);
  
  let timerHtml = '';
  if (appState.mode === 'exam') {
    timerHtml = `<div id="timer-display">${formatTime(appState.timeRemaining)}</div>`;
  }

  ui.showQuizSession(q, appState.currentIndex, appState.questions.length, appState.mode === 'exam', timerHtml);
  
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!document.getElementById('feedback-container').classList.contains('hidden')) return;
      const selectedIdx = parseInt(e.target.dataset.index);
      handleAnswer(selectedIdx);
    });
  });

  document.getElementById('btn-next-question').addEventListener('click', () => {
    appState.currentIndex++;
    saveCurrentSession();
    renderCurrentQuestion();
  });
}

function handleAnswer(selectedIdx) {
  const q = appState.questions[appState.currentIndex];
  const isCorrect = selectedIdx === q.rispostaCorretta;
  
  appState.answers.push({
    questionId: q.id,
    selectedIndex: selectedIdx,
    correctIndex: q.rispostaCorretta,
    module: q.modulo
  });

  if (isCorrect) {
    appState.correctCount++;
    storage.removeWrongQuestion(q.id);
  } else {
    storage.addWrongQuestion(q.id);
  }

  saveCurrentSession(); // Autosalvataggio dopo la risposta

  const options = document.querySelectorAll('.quiz-option');
  options.forEach(btn => {
    const idx = parseInt(btn.dataset.index);
    if (idx === q.rispostaCorretta) {
      btn.classList.add('correct');
    } else if (idx === selectedIdx && !isCorrect) {
      btn.classList.add('wrong');
    } else {
      btn.style.opacity = '0.4';
    }
  });

  const feedbackContainer = document.getElementById('feedback-container');
  const expText = document.getElementById('explanation-text');
  
  let explanation = isCorrect ? '<b>Esatto!</b> ' : '<b>Sbagliato.</b> ';
  if (q.spiegazione) {
    explanation += `<br><br>${q.spiegazione}`;
  }
  
  expText.innerHTML = explanation;
  feedbackContainer.classList.remove('hidden');
}

function finishSession() {
  stopTimer();
  storage.clearSessionState(); // Rimuovi sessione perché è finita
  
  document.getElementById('btn-back-nav').style.display = 'none';

  if (appState.mode === 'exam') {
    const stats = quizLogic.calculateExamResults(appState.answers);
    storage.updateStats(stats.passed, appState.questions.length);
    appState.currentView = 'examResults';
    ui.showExamResults(stats);
  } else {
    storage.updateStats(null, appState.questions.length);
    appState.currentView = 'studyResults';
    ui.showStudyResults(appState.correctCount, appState.questions.length);
  }
  
  document.getElementById('btn-back-home').addEventListener('click', goHome);
}

// Avvio
window.addEventListener('DOMContentLoaded', initApp);
