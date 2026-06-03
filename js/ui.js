export const ui = {
  container: document.getElementById('main-content'),

  escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  },

  parseChemicalTags(text) {
    if (!text.includes('[REACTION]')) return text;
    return text.replace(/\[REACTION\]([\s\S]*?)\[\/REACTION\]/g, (match, content) => {
       const tokens = content.trim().split(/\s+/);
       let html = '<div class="reaction-container">';
       tokens.forEach(part => {
          if (part === '&lt;=&gt;' || part === '<=>') {
            html += '<div class="reaction-arrow">⇌</div>';
          } else if (part === '-&gt;' || part === '->') {
            html += '<div class="reaction-arrow">→</div>';
          } else if (part === '+') {
            html += '<div class="reaction-plus">+</div>';
          } else if (part.startsWith('[TEXT:') && part.endsWith(']')) {
            html += `<div class="reaction-text-node">${part.substring(6, part.length-1).replace(/_/g, ' ')}</div>`;
          } else if (part === '[?]') {
            html += `<div class="reaction-text-node">[?]</div>`;
          } else {
            let smiles = part.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            let uniqueId = 'chem-canvas-' + Math.random().toString(36).substr(2, 9);
            html += `<canvas id="${uniqueId}" class="chem-canvas" data-smiles="${smiles}"></canvas>`;
          }
       });
       html += '</div>';
       return html;
    });
  },

  render(html) {
    this.container.innerHTML = html;
    
    if (html.includes('chem-canvas') && typeof SmilesDrawer !== 'undefined') {
      setTimeout(() => {
        const options = { 
          width: 250, height: 150, 
          compactDrawing: false, 
          terminalCarbons: true, 
          explicitHydrogens: true,
          atomVisualization: 'default'
        };
        const canvases = this.container.querySelectorAll('canvas.chem-canvas');
        if (canvases.length > 0) {
            const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            if (SmilesDrawer.SmiDrawer) {
                const drawer = new SmilesDrawer.SmiDrawer(options);
                canvases.forEach(canvas => {
                    if (!canvas.id) canvas.id = 'chem-canvas-' + Math.random().toString(36).substr(2, 9);
                    const smiles = canvas.getAttribute('data-smiles');
                    if (smiles) {
                        try {
                            drawer.draw(smiles, '#' + canvas.id, currentTheme);
                        } catch(e) { console.error(e); }
                    }
                });
            } else if (SmilesDrawer.Drawer) {
                const drawer = new SmilesDrawer.Drawer(options);
                canvases.forEach(canvas => {
                    if (!canvas.id) canvas.id = 'chem-canvas-' + Math.random().toString(36).substr(2, 9);
                    const smiles = canvas.getAttribute('data-smiles');
                    if (smiles) {
                        SmilesDrawer.parse(smiles, function(tree) {
                            drawer.draw(tree, '#' + canvas.id, currentTheme, false);
                        }, function(err) { console.error(err); });
                    }
                });
            } else if (SmilesDrawer.apply) {
                SmilesDrawer.apply(options, 'canvas.chem-canvas', currentTheme);
            }
        }
      }, 50);
    }
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
        <button id="btn-review-wrong" class="btn-secondary mb-20">⚠️ Ripasso Errori</button>
        <button id="btn-start-graphic" class="btn-primary mb-20" style="background: #9b59b6; width: 100%;">🧪 Test Grafici Sperimentali</button>
        <button id="btn-analytics" class="btn-secondary" style="width: 100%;">📊 Statistiche Avanzate</button>
      </div>
      <div style="text-align: center; font-size: 12px; color: var(--text-secondary); margin-top: 15px; opacity: 0.7;">
        v1.1.0
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
        optionsHtml += `<button class="${btnClass}" data-index="${i}" style="${style}">${this.parseChemicalTags(this.escapeHTML(opt))}</button>`;
    });

    const headerContext = isExam ? 
      `<span>Modulo ${question.modulo}</span>` : 
      `<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${question.pdf_origine || ''}</span>`;

    let feedbackHtml = '';
    if (savedAnswer !== null) {
        const isCorrect = savedAnswer.selectedIndex === question.rispostaCorretta;
        let explanation = isCorrect ? '<b>Esatto!</b> ' : '<b>Sbagliato.</b> ';
        if (question.spiegazione) {
            explanation += `<br><br>${this.escapeHTML(question.spiegazione)}`;
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
        
        <h2 style="font-size: 20px; margin-bottom: 25px; line-height: 1.4;">${this.parseChemicalTags(this.escapeHTML(question.domanda))}</h2>
        
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
          <label for="json-upload" style="display:block; margin-bottom:5px; color: var(--text-secondary); font-size: 14px;">Seleziona file JSON:</label>
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
  },

  showAnalyticsDashboard(examHistory, pdfStats) {
    let historyHtml = '';
    let pdfStatsHtml = '';

    if (examHistory.length === 0 && Object.keys(pdfStats).length === 0) {
      historyHtml = '<p class="text-muted text-center" style="margin-top:40px;">Nessuna statistica disponibile. Completa una simulazione d\'esame o studia per iniziare a raccogliere dati.</p>';
    } else {
      historyHtml = `
        <div class="card">
          <h2 style="font-size: 18px; margin-bottom: 15px;">Andamento Esami</h2>
          <canvas id="examHistoryChart" height="200"></canvas>
        </div>
      `;
      
      pdfStatsHtml = `
        <div class="card mt-20">
          <h2 style="font-size: 18px; margin-bottom: 15px;">Punti Deboli (per PDF)</h2>
          <p class="text-muted" style="font-size: 13px; margin-bottom: 15px;">Visualizza la percentuale di risposte esatte per ogni modulo/PDF. Le barre rosse (< 60%) indicano gli argomenti da ripassare.</p>
          <canvas id="pdfStatsChart" height="280"></canvas>
        </div>
      `;
    }

    const html = `
      <div class="card" style="text-align: center;">
        <h2 style="font-size: 24px; margin-bottom: 5px;">Statistiche Avanzate</h2>
        <p class="text-muted" style="margin-bottom: 0;">Analizza le tue performance nel tempo.</p>
      </div>
      
      ${historyHtml}
      ${pdfStatsHtml}
    `;
    
    this.render(html);
    
    // Inizializza i grafici
    if (examHistory.length > 0 || Object.keys(pdfStats).length > 0) {
      setTimeout(() => this.initCharts(examHistory, pdfStats), 100);
    }
  },

  initCharts(examHistory, pdfStats) {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js non è stato caricato correttamente.');
      return;
    }

    // Colori in base al tema
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#ffffff' : '#0f172a';
    const gridColor = isDark ? '#333333' : '#e2e8f0';

    // 1. Line Chart: Andamento Esami
    const ctxHistory = document.getElementById('examHistoryChart');
    if (ctxHistory && examHistory.length > 0) {
      const labels = examHistory.map((ex, i) => {
        const d = new Date(ex.date);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ' (#' + (i+1) + ')';
      });
      const data = examHistory.map(ex => ex.finalGrade30);
      
      new Chart(ctxHistory, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Voto (su 31)',
            data: data,
            borderColor: '#059669', // success color
            backgroundColor: 'rgba(5, 150, 105, 0.2)',
            tension: 0.3,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#059669'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 31, grid: { color: gridColor }, ticks: { color: textColor } },
            x: { grid: { color: gridColor }, ticks: { color: textColor, maxRotation: 45, minRotation: 45 } }
          }
        }
      });
    }

    // 2. Bar Chart: Punti deboli per PDF
    const ctxPdf = document.getElementById('pdfStatsChart');
    if (ctxPdf && Object.keys(pdfStats).length > 0) {
      const pdfNames = Object.keys(pdfStats);
      
      // Ordina i PDF in base alla percentuale (dal peggiore al migliore)
      const sortedStats = pdfNames.map(name => {
        const s = pdfStats[name];
        return {
          name: name,
          percentage: Math.round((s.correct / s.total) * 100),
          correct: s.correct,
          total: s.total
        };
      }).sort((a, b) => a.percentage - b.percentage);

      const labels = sortedStats.map(s => s.name.replace('.pdf', '').substring(0, 18) + (s.name.length > 18 ? '...' : ''));
      const percentages = sortedStats.map(s => s.percentage);
      const bgColors = percentages.map(p => p < 60 ? 'rgba(220, 38, 38, 0.8)' : 'rgba(5, 150, 105, 0.8)');

      new Chart(ctxPdf, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '% Accuratezza',
            data: percentages,
            backgroundColor: bgColors,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { 
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const s = sortedStats[ctx.dataIndex];
                  return `${s.percentage}% (${s.correct} esatte su ${s.total})`;
                }
              }
            }
          },
          scales: {
            y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor } },
            x: { grid: { display: false }, ticks: { color: textColor } }
          }
        }
      });
    }
  }
};
