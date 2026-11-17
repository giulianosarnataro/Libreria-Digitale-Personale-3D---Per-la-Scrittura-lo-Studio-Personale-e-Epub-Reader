# Libreria-Digitale-Personale-3D

Una libreria personale e un lettore di libri in 3D che girano interamente nel browser: scaffali di legno con i tuoi libri, pagine che si sfogliano, evidenziazioni, flashcard, importazione di EPUB e traduzione sul dispositivo. Nessun server, nessun account, nessuna dipendenza da installare.

> Aggiungi qui uno screenshot, ad esempio `docs/screenshot.png`, e mostralo con `![Libro 3D](docs/screenshot.png)`.

## Caratteristiche

**Libreria**
- Scaffali in 3D con i libri disposti in costa; il colore e lo spessore di ogni dorso dipendono dal libro.
- Più scaffali con nome, che puoi creare, rinominare, riordinare ed eliminare.
- Trascini i libri per riordinarli o per spostarli da uno scaffale all'altro (su touch con pressione prolungata). Da tastiera: `Alt` + frecce.
- Animazione di apertura: la copertina ha il colore del dorso che hai cliccato.

**Lettura e scrittura**
- Libro a due pagine con sfoglio animato, dimensione del carattere regolabile (A− / A+) e impaginazione automatica.
- Le pagine sono modificabili: scrivi o incolli il testo direttamente e il libro si impagina da solo.
- Segnalibro, tab colorati per i punti importanti, salto diretto a una pagina.
- Lettura vocale (sintesi vocale del browser) dal punto in cui ti trovi o dal testo selezionato.
- Musica di sottofondo con i tuoi brani audio, salvati nel browser.
- Tema chiaro e scuro in base alle impostazioni del sistema.

**Evidenziazioni**
- Selezioni il testo e scegli tra quattro colori.
- Un pannello laterale raccoglie tutte le evidenziazioni del libro, con il testo completo e il salto alla pagina.

**Flashcard**
- Selezioni un testo, scegli «Crea flashcard» e decidi se va sul *front* o sul *back*.
- La card si apre con un'animazione e puoi scrivere su entrambi i lati.
- In basso a destra un'icona mostra quante card ci sono nel libro; cliccandola parte il ripasso: giri la card e scegli «La so» oppure «Da rivedere». Le card da rivedere tornano in coda finché non le sai.

**Importazione di EPUB**
- Importa un `.epub` come nuovo libro: testo, titoli, elenchi e citazioni restano; evidenziazioni, flashcard e lettura vocale funzionano come sugli altri libri.
- Funziona anche con libri da molte centinaia di pagine: nel DOM restano solo i fogli vicini alla pagina corrente, il salvataggio è ritardato e l'impaginazione avviene con avanzamento visibile e pulsante **Annulla**.
- Immagini e copertine non vengono importate; gli EPUB con DRM non sono leggibili.

**Traduzione sul dispositivo**
- «Traduci libro…» crea una copia tradotta del libro usando il traduttore integrato nel browser (API `Translator` e `LanguageDetector`). Nessuna chiave API, nessun servizio esterno.
- Al primo uso di una lingua il browser scarica un piccolo modello (serve internet una volta); poi funziona anche offline.
- La coerenza è affidata a una traduzione per gruppi di paragrafi (il traduttore vede il contesto) e a un **glossario** opzionale (`originale = traduzione`, una voce per riga) applicato prima di tradurre.
- I progressi sono salvati: puoi interrompere e riprendere con «Continua».
- Limiti: richiede un browser con quelle API (Chrome o Edge recenti su computer), e corsivi e grassetti dentro le frasi non vengono mantenuti.

**Dati**
- Tutto è salvato nel browser (`localStorage` per i libri, `IndexedDB` per musica e traduzioni in corso).
- **Backup** esporta un file JSON con libri e scaffali; **Importa backup** lo ripristina. **Esporta .txt** salva il testo del libro aperto.
- Sincronizzazione online opzionale: si attiva solo se la pagina gira come artifact su claude.ai con le funzioni di database e utente disponibili. Aperta come file locale, l'app funziona normalmente senza sincronizzazione.

## Come si usa

Non serve installare nulla.

1. Scarica o clona il repository.
2. Apri `index.html` nel browser (doppio clic).

Se preferisci un server locale:

```bash
# Python
python3 -m http.server 8000

# oppure Node
npx serve
```

poi vai su `http://localhost:8000`.

### Primi passi

- **Nuovo libro** crea un libro vuoto; **Importa EPUB** ne carica uno esistente.
- Clicca un libro sullo scaffale per aprirlo e sfoglia con le frecce ai lati, la tastiera o i pulsanti in basso.
- Per fare un backup: menu `⋯` → **Backup**.

## Struttura del progetto

```
libro3d/
├── index.html   struttura della pagina
├── style.css    stile (scaffali 3D, libro, pannelli, temi)
├── app.js       logica dell'app (libreria, lettore, EPUB, flashcard, traduzione)
└── README.md
```

I tre file devono restare nella stessa cartella. Non ci sono librerie esterne né fasi di build.

## Compatibilità

| Funzione | Browser |
| --- | --- |
| Libreria, lettura, evidenziazioni, flashcard, EPUB | Qualsiasi browser moderno |
| Importazione EPUB | Richiede `DecompressionStream`, presente nei browser recenti |
| Traduzione sul dispositivo | Chrome o Edge recenti su computer (API sperimentali) |
| Lettura vocale | Dipende dalle voci installate nel sistema |

## Limiti noti

- I dati stanno nel browser, che offre circa 5 MB per `localStorage`: l'app avvisa se un EPUB o una traduzione non ci stanno. Fai backup regolari.
- Cancellare i dati del sito cancella anche i libri: il backup serve a questo.
- Libri importati da EPUB: niente immagini, niente indice cliccabile; ogni capitolo inizia da una nuova pagina.

## Contribuire

Segnalazioni e proposte sono benvenute: apri una issue descrivendo cosa hai provato e in quale browser. Per le modifiche al codice, apri una pull request tenendo separati stile (`style.css`) e logica (`app.js`).

## Licenza

Scegli una licenza prima di pubblicare (ad esempio MIT) e aggiungi qui il nome e il file `LICENSE`.
