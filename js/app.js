import { ui } from './ui.js';
import { storage } from './storage.js';
import { quizLogic } from './quizLogic.js';

let appState = {
  currentView: 'home', // home, studyConfig, quizSession, examResults, studyResults, settings
  mode: null, // 'study', 'exam', 'wrong'
  questions: [],
  currentIndex: 0,
  answers: [], // Per memorizzare le risposte utente
  correctCount: 0 // Per modalità study
};

// Inizializzazione
async function initApp() {
  const loaded = await quizLogic.init();
  if (!loaded) {
    alert("Errore critico: impossibile caricare il database delle domande.");
    return;
  }
  
  // Bind global navigation
  document.getElementById('app-title').addEventListener('click', goHome);
  document.getElementById('settings-btn').addEventListener('click', goSettings);
  
  goHome();
}

function goHome() {
  appState.currentView = 'home';
  const stats = storage.getStats();
  ui.showHome(stats);
  
  document.getElementById('btn-start-exam').addEventListener('click', startExam);
  document.getElementById('btn-start-study').addEventListener('click', goStudyConfig);
  document.getElementById('btn-review-wrong').addEventListener('click', () => {
    const wrongIds = storage.getWrongQuestions();
    if (wrongIds.length === 0) {
      alert("Non hai ancora sbagliato nessuna domanda! Ottimo lavoro!");
      return;
    }
    appState.mode = 'wrong';
    appState.questions = quizLogic.getQuestionsForStudy({ mode: 'wrong' });
    startSession();
  });
}

function goSettings() {
  appState.currentView = 'settings';
  ui.showSettings(storage.getCustomJson() !== null);
  
  document.getElementById('btn-back').addEventListener('click', goHome);
  
  document.getElementById('btn-reset-stats').addEventListener('click', () => {
    if (confirm("Sei sicuro di voler resettare tutte le statistiche e gli errori?")) {
      storage.resetAll();
      quizLogic.init(); // Ricarica il DB originale
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
              await quizLogic.init(); // Ricarica coi nuovi dati
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
  const { topics, pps } = quizLogic.getTopicsAndPps();
  ui.showStudyConfig(topics, pps);
  
  document.getElementById('btn-back').addEventListener('click', goHome);
  document.getElementById('btn-begin-study').addEventListener('click', () => {
    const config = {
      mode: 'study',
      topic: document.getElementById('config-topic').value,
      pp: document.getElementById('config-pp').value,
      count: document.getElementById('config-count').value
    };
    appState.mode = 'study';
    appState.questions = quizLogic.getQuestionsForStudy(config);
    if (appState.questions.length === 0) {
      alert("Nessuna domanda trovata con questi filtri.");
      return;
    }
    startSession();
  });
}

function startExam() {
  appState.mode = 'exam';
  appState.questions = quizLogic.generateExam();
  if (appState.questions.length < 36) {
    alert(`Attenzione: nel database ci sono solo ${appState.questions.length} domande compatibili con i moduli, invece di 36. L'esame potrebbe non essere completo.`);
  }
  startSession();
}

function startSession() {
  appState.currentView = 'quizSession';
  appState.currentIndex = 0;
  appState.answers = [];
  appState.correctCount = 0;
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  if (appState.currentIndex >= appState.questions.length) {
    finishSession();
    return;
  }
  
  const q = appState.questions[appState.currentIndex];
  ui.showQuizSession(q, appState.currentIndex, appState.questions.length, appState.mode === 'exam');
  
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Prevent multiple clicks
      if (document.getElementById('feedback-container').classList.contains('hidden') === false) return;
      
      const selectedIdx = parseInt(e.target.dataset.index);
      handleAnswer(selectedIdx);
    });
  });

  document.getElementById('btn-next-question').addEventListener('click', () => {
    appState.currentIndex++;
    renderCurrentQuestion();
  });
}

function handleAnswer(selectedIdx) {
  const q = appState.questions[appState.currentIndex];
  const isCorrect = selectedIdx === q.rispostaCorretta;
  
  // Salva risposta
  appState.answers.push({
    questionId: q.id,
    selectedIndex: selectedIdx,
    correctIndex: q.rispostaCorretta,
    module: q.modulo
  });

  if (isCorrect) {
    appState.correctCount++;
    storage.removeWrongQuestion(q.id); // Rimuove se l'ha azzeccata (utile nel ripasso errori)
  } else {
    storage.addWrongQuestion(q.id); // Salva errore
  }

  // Feedback UI
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(btn => {
    const idx = parseInt(btn.dataset.index);
    if (idx === q.rispostaCorretta) {
      btn.classList.add('correct');
    } else if (idx === selectedIdx && !isCorrect) {
      btn.classList.add('wrong');
    } else {
      btn.style.opacity = '0.5';
    }
  });

  // Mostra spiegazione
  const feedbackContainer = document.getElementById('feedback-container');
  const expText = document.getElementById('explanation-text');
  
  let explanation = isCorrect ? '<b>Corretto!</b> ' : '<b>Sbagliato!</b> ';
  if (q.spiegazione) {
    explanation += `<br><br>${q.spiegazione}`;
  }
  
  expText.innerHTML = explanation;
  feedbackContainer.classList.remove('hidden');
}

function finishSession() {
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
