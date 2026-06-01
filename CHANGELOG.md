# Changelog

Tutte le modifiche al progetto verranno documentate in questo file.

## [Unreleased]
- **Audit Fixes (Performance, Logic & UI)**:
  - Risolto bug logico critico: il voto viene ora calcolato in base al numero reale di domande pescate se il DB è incompleto.
  - Fixato problema del Timer su iOS/Mobile: ora usa `Date.now()` per evitare desincronizzazioni in background.
  - Aggiunto tasto "Salta Domanda" per gestire correttamente le risposte "omesse" all'esame.
  - Risolto "Race Condition" che permetteva di rispondere 2 volte premendo velocemente due tasti.
  - Ottimizzazione Performance: disabilitato il salvataggio pesante dell'intera sessione ad ogni tick del timer, salvando solo i secondi rimanenti.
  - Risolti problemi di layout (testi lunghi dei PDF uscivano dallo schermo).
  - Rimossi gli `alert()` nativi bloccanti e sostituito tutto con un sistema di Notifiche "Toast" non intrusivo.
- **Major Update - Funzionalità Avanzate**:
  - Implementato restyling UI minimalista stile Apple (flat design, niente glassmorphism).
  - Aggiunta modalità Dark/Light selezionabile nelle impostazioni.
  - Aggiunta Header NavBar globale con pulsante "Indietro" persistente.
  - Sostituiti "argomento" e "powerpoint" con `pdf_origine` per mappare esattamente i nomi dei PDF di studio.
  - Aggiunta Selezione Multipla dei PDF nell'allenamento (tramite checkbox).
  - Aggiunto Filtro "Domande Mai Viste" che traccia tutte le domande già fatte.
  - Implementato Timer di 60 minuti visibile durante la Simulazione d'Esame.
  - Implementato Autosave della Sessione: l'esame si salva automaticamente e può essere ripreso se il browser viene chiuso.
- **Bug Fix**: Risolto problema di precisione dei numeri a virgola mobile di Javascript nei calcoli dei punteggi e delle sufficienze dei moduli.
- **Miglioramento UI**: Aggiunto text-wrapping ai pulsanti delle risposte per evitare che il testo lungo esca dai bordi su schermi stretti.
- **Ottimizzazione PWA**: Aggiornato il Service Worker per cachare correttamente il file JavaScript delle domande di default.
- Inizio del progetto: configurazione iniziale per la Quiz App in Vanilla JS.
- Creazione della struttura di directory base.
## [Unreleased]
- Aggiunte 90 nuove domande al file `questions.json` (estratte da `domande_nuove`, relative al PDF "02_Metabolismo_Glucidico_I.pdf"). Il totale delle domande è ora 150.
- Sostituito il contenuto di `questions.json` con le prime 60 domande del primo PDF estratte da `domande_nuove`.
- Added unified `questions.json` containing 60 Metabolismo Terminale questions for the quiz app.
