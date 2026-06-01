export const ui = {
  container: document.getElementById('main-content'),

  render(html) {
    this.container.innerHTML = html;
  },

  showHome(stats) {
    const html = `
      <div class="card text-center">
        <h2>Benvenuta Rosa! 🌸</h2>
        <p class="text-muted">Pronta per l'esame di biochimica?</p>
        
        <div class="grid-2 mt-20">
          <div class="stat-box">
            <div class="stat-value">${stats.passedExams}/${stats.totalExams}</div>
            <div class="stat-label">Esami Superati</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.totalStudyQuestions}</div>
            <div class="stat-label">Domande Fatte</div>
          </div>
        </div>

        <button id="btn-start-exam" class="btn-primary mb-20">🎯 Simulazione Esame</button>
        <button id="btn-start-study" class="btn-secondary mb-20">📚 Allenamento Mirato</button>
        <button id="btn-review-wrong" class="btn-secondary">⚠️ Ripasso Errori</button>
      </div>
    `;
    this.render(html);
  },

  showStudyConfig(topics, pps) {
    let topicOpts = topics.map(t => `<option value="${t}">${t}</option>`).join('');
    let ppOpts = pps.map(p => `<option value="${p}">${p}</option>`).join('');

    const html = `
      <div class="card">
        <h2>Configura Allenamento</h2>
        <p class="text-muted">Scegli l'argomento su cui vuoi concentrarti.</p>
        
        <select id="config-topic">
          <option value="all">Tutti gli argomenti</option>
          ${topicOpts}
        </select>

        <select id="config-pp">
          <option value="all">Tutti i PowerPoint</option>
          ${ppOpts}
        </select>

        <select id="config-count">
          <option value="10">10 Domande</option>
          <option value="20">20 Domande</option>
          <option value="50">50 Domande</option>
          <option value="all">Tutte le disponibili</option>
        </select>

        <button id="btn-begin-study" class="btn-primary mt-20">Inizia</button>
        <button id="btn-back" class="btn-secondary mt-20">Indietro</button>
      </div>
    `;
    this.render(html);
  },

  showQuizSession(question, currentIndex, total, isExam) {
    const progress = ((currentIndex) / total) * 100;
    
    let optionsHtml = question.opzioni.map((opt, i) => `
      <button class="quiz-option" data-index="${i}">${opt}</button>
    `).join('');

    const html = `
      <div class="progress-container">
        <div class="progress-bar" style="width: ${progress}%"></div>
      </div>
      
      <div class="card">
        <div class="text-muted" style="display:flex; justify-content:space-between; margin-bottom:15px;">
          <span>Domanda ${currentIndex + 1} di ${total}</span>
          ${isExam ? `<span>Modulo ${question.modulo}</span>` : `<span>${question.argomento}</span>`}
        </div>
        
        <h2 style="font-size: 22px; margin-bottom: 25px;">${question.domanda}</h2>
        
        <div id="options-container">
          ${optionsHtml}
        </div>
        
        <div id="feedback-container" class="hidden" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--surface-border);">
          <div id="explanation-text" style="margin-bottom: 20px; font-style: italic;"></div>
          <button id="btn-next-question" class="btn-primary">Avanti</button>
        </div>
      </div>
    `;
    this.render(html);
  },

  showExamResults(stats) {
    const passedColor = stats.passed ? 'var(--success-color)' : 'var(--error-color)';
    const resultMsg = stats.passed ? 'Congratulazioni! 🎉' : 'Non mollare, riprova! 💪';

    const html = `
      <div class="card text-center">
        <h2 style="color: ${passedColor}; font-size: 28px;">${resultMsg}</h2>
        <p class="text-muted">Esito della Simulazione</p>
        
        <div style="font-size: 48px; font-weight: 800; margin: 20px 0; color: ${passedColor};">
          ${stats.finalGrade30.toFixed(1)} <span style="font-size: 20px; color: var(--text-secondary)">/ 31</span>
        </div>

        <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 15px; text-align: left; margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 10px;">Dettaglio Moduli (Min 5.6)</h3>
          <div style="display:flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Modulo 1:</span>
            <span style="color: ${stats.m1Passed ? 'var(--success-color)' : 'var(--error-color)'}">${stats.m1Score.toFixed(1)} pt</span>
          </div>
          <div style="display:flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Modulo 2:</span>
            <span style="color: ${stats.m2Passed ? 'var(--success-color)' : 'var(--error-color)'}">${stats.m2Score.toFixed(1)} pt</span>
          </div>
          <div style="display:flex; justify-content: space-between;">
            <span>Modulo 3:</span>
            <span style="color: ${stats.m3Passed ? 'var(--success-color)' : 'var(--error-color)'}">${stats.m3Score.toFixed(1)} pt</span>
          </div>
        </div>

        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
          Non risposte: ${stats.unanswered} / 4 ammesse.
        </p>

        <button id="btn-back-home" class="btn-primary">Torna alla Home</button>
      </div>
    `;
    this.render(html);
  },

  showStudyResults(correctCount, total) {
    const html = `
      <div class="card text-center">
        <h2>Allenamento Concluso!</h2>
        <div style="font-size: 48px; font-weight: 800; margin: 20px 0; color: var(--primary-color);">
          ${correctCount} <span style="font-size: 20px; color: var(--text-secondary)">/ ${total}</span>
        </div>
        <p class="text-muted mb-20">Risposte corrette</p>
        <button id="btn-back-home" class="btn-primary">Torna alla Home</button>
      </div>
    `;
    this.render(html);
  },

  showSettings(hasCustomJson) {
    const html = `
      <div class="card">
        <h2>Impostazioni</h2>
        <p class="text-muted">Gestisci l'app e il database.</p>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 10px;">Aggiorna Domande (JSON)</h3>
          <input type="file" id="json-upload" accept=".json" style="font-size: 14px;">
          ${hasCustomJson ? '<p style="color:var(--success-color); font-size: 12px;">✅ Hai un database personalizzato attivo.</p>' : ''}
          ${hasCustomJson ? '<button id="btn-reset-json" class="btn-secondary" style="margin-top: 10px;">Ripristina database originale</button>' : ''}
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--surface-border);">
          <h3 style="font-size: 16px; margin-bottom: 10px; color: var(--error-color);">Zona Pericolosa</h3>
          <button id="btn-reset-stats" class="btn-secondary" style="color: var(--error-color); border-color: var(--error-color);">Reset Totale Statistiche</button>
        </div>

        <button id="btn-back" class="btn-primary mt-20">Torna Indietro</button>
      </div>
    `;
    this.render(html);
  }
};
