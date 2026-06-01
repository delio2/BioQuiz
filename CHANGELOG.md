# Changelog

Tutte le modifiche al progetto verranno documentate in questo file.

## [Unreleased]
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
