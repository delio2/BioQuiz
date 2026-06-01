export const ui = {
  container: document.getElementById('main-content'),

  render(html) {
    this.container.innerHTML = html;
  },

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  },

  showHome(stats, hasActiveSession, totalDbQuestions = 0) {
    const sessionBtn = hasActiveSession ? 
      `<button id="btn-resume-session" class="btn-primary mb-20" style="background: var(--success-color);">🔄 Riprendi Sessione in Corso</button>` : '';

    const html = `
      <div class="card text-center">
        <h2>Benvenuta Rosa! 🌸</h2>
        <p class="text-muted" style="margin-bottom: 5px;">Pronta per l'esame di biochimica?</p>
        <p class="text-muted" style="font-size: 13px;">Banca dati attiva: <strong>${totalDbQuestions}</strong> domande totali.</p>
        
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

        ${sessionBtn}
        <button id="btn-start-exam" class="btn-primary mb-20">🎯 Simulazione Esame</button>
        <button id="btn-start-study" class="btn-secondary mb-20">📚 Allenamento Mirato</button>
        <button id="btn-start-unseen" class="btn-secondary mb-20">🔎 Domande Mai Viste</button>
        <button id="btn-review-wrong" class="btn-secondary">⚠️ Ripasso Errori</button>
      </div>
    `;
    this.render(html);
  },

  showStudyConfig(pps) {
    let ppCheckboxes = pps.map(p => `
      <label class="checkbox-label">
        <input type="checkbox" value="${p.name}" class="pdf-checkbox">
        <span style="display: flex; justify-content: space-between; width: 100%;">
          <span>${p.name}</span>
          <span style="color: var(--text-secondary); font-size: 13px;">(${p.count} dom.)</span>
        </span>
      </label>
    `).join('');

    const html = `
      <div class="card">
        <h2>Configura Allenamento</h2>
        <p class="text-muted">Seleziona i PDF su cui vuoi esercitarti (puoi sceglierne più di uno).</p>
        
        <div class="checkbox-group">
          <label class="checkbox-label" style="font-weight: 600; margin-bottom: 5px;">
            <input type="checkbox" id="check-all-pdfs" value="all">
            Tutti i PDF
          </label>
          <hr style="border:0; border-top:1px solid var(--surface-border); margin:5px 0;">
          ${ppCheckboxes}
        </div>

        <p class="text-muted" style="margin: 15px 0 5px 0;">Quante domande vuoi fare?</p>
        <select id="config-count">
          <option value="10">10 Domande</option>
          <option value="20">20 Domande</option>
          <option value="50">50 Domande</option>
          <option value="all">Tutte le disponibili</option>
        </select>

        <button id="btn-begin-study" class="btn-primary mt-20">Inizia Allenamento</button>
      </div>
    `;
    this.render(html);
  },

  showQuizSession(question, currentIndex, total, isExam, timerHtml = '', savedAnswer = null, isFirst = false, isLast = false, isReviewMode = false) {
    const progress = ((currentIndex) / total) * 100;
    
    let optionsHtml = '';
    question.opzioni.forEach((opt, i) => {
        let btnClass = 'quiz-option';
        let style = '';
        
        if (savedAnswer !== null) {
            style = 'opacity: 0.4; cursor: default;';
            if (i === question.rispostaCorretta) {
                btnClass += ' correct';
                style = 'opacity: 1; cursor: default;';
            } else if (i === savedAnswer.selectedIndex) {
                btnClass += ' wrong';
                style = 'opacity: 1; cursor: default;';
            }
        }
        optionsHtml += `<button class="${btnClass}" data-index="${i}" style="${style}">${opt}</button>`;
    });

    const headerContext = isExam ? 
      `<span>Modulo ${question.modulo}</span>` : 
      `<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${question.pdf_origine || ''}</span>`;

    let feedbackHtml = '';
    if (savedAnswer !== null) {
        const isCorrect = savedAnswer.selectedIndex === question.rispostaCorretta;
        let explanation = isCorrect ? '<b>Esatto!</b> ' : '<b>Sbagliato.</b> ';
        if (question.spiegazione) {
            explanation += `<br><br>${question.spiegazione}`;
        }
        feedbackHtml = `
          <div id="feedback-container" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--surface-border);">
            <div id="explanation-text" style="margin-bottom: 20px; font-style: italic; line-height: 1.5;">${explanation}</div>
          </div>
        `;
    } else {
        feedbackHtml = `
          <div id="feedback-container" class="hidden" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--surface-border);">
            <div id="explanation-text" style="margin-bottom: 20px; font-style: italic; line-height: 1.5;"></div>
          </div>
        `;
    }

    const prevBtnHtml = isFirst ? `<div style="flex:1;"></div>` : `<button id="btn-prev" class="btn-secondary" style="flex:1; margin-right: 10px; padding: 12px;">⬅ Precedente</button>`;
    
    let nextBtnText = isReviewMode ? "Torna ai Risultati 📊" : "Termina 🏁";
    const nextBtnHtml = isLast ? `<button id="btn-next" class="btn-primary" style="flex:1; margin-left: 10px; padding: 12px; background: var(--error-color);">${nextBtnText}</button>` : `<button id="btn-next" class="btn-primary" style="flex:1; margin-left: 10px; padding: 12px;">Successiva ➡</button>`;

    const html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div class="progress-container" style="flex: 1; margin-bottom: 0;">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
        ${timerHtml}
      </div>
      
      <div class="card" style="margin-top: 15px;">
        <div class="text-muted" style="display:flex; justify-content:space-between; flex-wrap: nowrap; margin-bottom:15px; border-bottom: 1px solid var(--surface-border); padding-bottom: 10px;">
          <span style="flex-shrink: 0; margin-right: 10px;">Domanda ${currentIndex + 1} di ${total}</span>
          ${headerContext}
        </div>
        
        <h2 style="font-size: 20px; margin-bottom: 25px; line-height: 1.4;">${question.domanda}</h2>
        
        <div id="options-container">
          ${optionsHtml}
        </div>
        
        ${feedbackHtml}

        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          ${prevBtnHtml}
          ${nextBtnHtml}
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
        <h2 style="color: ${passedColor}; font-size: 26px;">${resultMsg}</h2>
        <p class="text-muted">Esito della Simulazione</p>
        
        <div style="font-size: 48px; font-weight: 800; margin: 20px 0; color: ${passedColor};">
          ${stats.finalGrade30.toFixed(1)} <span style="font-size: 20px; color: var(--text-secondary)">/ 31</span>
        </div>

        <div style="background: var(--bg-color); border-radius: 12px; padding: 15px; text-align: left; margin-bottom: 20px; border: 1px solid var(--surface-border);">
          <h3 style="font-size: 16px; margin-bottom: 10px;">Dettaglio Moduli (Min 5.6)</h3>
          <div style="display:flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Modulo 1:</span>
            <span style="color: ${stats.m1Passed ? 'var(--success-color)' : 'var(--error-color)'}; font-weight: 600;">${stats.m1Score.toFixed(1)} pt</span>
          </div>
          <div style="display:flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Modulo 2:</span>
            <span style="color: ${stats.m2Passed ? 'var(--success-color)' : 'var(--error-color)'}; font-weight: 600;">${stats.m2Score.toFixed(1)} pt</span>
          </div>
          <div style="display:flex; justify-content: space-between;">
            <span>Modulo 3:</span>
            <span style="color: ${stats.m3Passed ? 'var(--success-color)' : 'var(--error-color)'}; font-weight: 600;">${stats.m3Score.toFixed(1)} pt</span>
          </div>
        </div>

        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
          Non risposte: ${stats.unanswered} / 4 ammesse.
        </p>

        <button id="btn-review-questions" class="btn-secondary mb-20" style="width:100%;">🔍 Revisiona Domande</button>
        <button id="btn-back-home" class="btn-primary" style="width:100%;">Torna alla Home</button>
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
        <button id="btn-review-questions" class="btn-secondary mb-20" style="width:100%;">🔍 Revisiona Domande</button>
        <button id="btn-back-home" class="btn-primary" style="width:100%;">Torna alla Home</button>
      </div>
    `;
    this.render(html);
  },

  showSettings(hasCustomJson, currentTheme) {
    const html = `
      <div class="card">
        <h2>Impostazioni</h2>
        
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 16px; margin-bottom: 10px;">Aspetto</h3>
          <select id="theme-selector">
            <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Tema Chiaro (Minimal)</option>
            <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Tema Scuro (Elegante)</option>
          </select>
        </div>

        <div style="margin-bottom: 25px; padding-top: 15px; border-top: 1px solid var(--surface-border);">
          <h3 style="font-size: 16px; margin-bottom: 10px;">Aggiorna Domande (JSON)</h3>
          <input type="file" id="json-upload" accept=".json" style="font-size: 14px;">
          ${hasCustomJson ? '<p style="color:var(--success-color); font-size: 13px; margin-top: 5px;">✅ Database personalizzato attivo.</p>' : ''}
          ${hasCustomJson ? '<button id="btn-reset-json" class="btn-secondary mt-20">Ripristina database base</button>' : ''}
        </div>

        <div style="padding-top: 15px; border-top: 1px solid var(--surface-border);">
          <h3 style="font-size: 16px; margin-bottom: 10px; color: var(--error-color);">Zona Pericolosa</h3>
          <button id="btn-reset-stats" class="btn-secondary" style="color: var(--error-color); border-color: var(--error-color);">Reset Totale Statistiche</button>
        </div>
      </div>
    `;
    this.render(html);
  }
};
