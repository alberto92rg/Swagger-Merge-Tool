# Swagger Merge Tool 4.0

Swagger Merge Tool è un'applicazione desktop che permette di **unire due specifiche API** — **Swagger 2.0** oppure **OpenAPI 3.x** — analizzare le differenze tra le API e generare automaticamente una **specifica unificata e validata**.

Il tool include anche un pannello dedicato che consente di **incollare o caricare un JSON**, convertirlo in **YAML** e usarlo direttamente come input per l'analisi o il merge.

L'applicazione è sviluppata utilizzando **React, Vite ed Electron** e può essere eseguita sia in locale sia come **applicazione desktop**, oppure distribuita come **eseguibile standalone**.

---

## Novità della versione 4.0

La release **4.0** porta il merge a supportare davvero **OpenAPI 3.x**. Fino alla 3.0 il riconoscimento di OpenAPI era limitato al convertitore JSON → YAML: il merge conosceva solo le sezioni Swagger 2.0 e, con due documenti OpenAPI 3, scartava senza segnalarlo l'intera sezione `components` del documento aggiornato, producendo un risultato con `$ref` non risolti.

**Merge OpenAPI 3.x**

- riconoscimento automatico del formato dal campo `swagger` o `openapi` del documento base
- `components` uniti sezione per sezione: `schemas`, `responses`, `parameters`, `examples`, `requestBodies`, `headers`, `securitySchemes`, `links`, `callbacks`, `pathItems`
- `webhooks` uniti (OpenAPI 3.1)
- `servers` trattato come dato d'ambiente e preso esclusivamente dal documento base, esattamente come `host`, `basePath` e `schemes` in Swagger 2.0
- versione `openapi` presa dal documento aggiornato, con avviso quando le due specifiche dichiarano versioni diverse
- nessuna sezione Swagger 2.0 vuota (`definitions`, `parameters`, `responses`, `securityDefinitions`) nell'output OpenAPI 3.x

**Controlli e sicurezza del risultato**

- il merge tra formati diversi (base Swagger 2.0 e aggiornato OpenAPI 3.x, o viceversa) viene **rifiutato** con un messaggio esplicito invece di produrre un documento ibrido
- dopo ogni merge il tool verifica i `$ref` interni e **elenca quelli che non puntano a nulla**: è il sintomo tipico di una path importata senza gli schemi a cui fa riferimento
- la validazione pre-download riconosce il formato: sblocca il download per OpenAPI 3.x e accetta i documenti 3.1 con soli `webhooks`
- gli avvisi sul merge (servers assente nella base, versioni disallineate, formato non dichiarato) sono mostrati nell'interfaccia

**Correzione sul percorso Swagger 2.0**

`host`, `basePath` e `schemes` venivano reintrodotti dal documento aggiornato quando erano assenti nel documento base, in contrasto con la regola di progetto che li vuole appartenenti esclusivamente alla base. Un gateway senza `host` esplicito ereditava così l'host del documento di sviluppo. Ora restano assenti e l'interfaccia lo segnala.

---

## Novità della versione 3.0

La release **3.0** aveva aggiunto la feature:

- **JSON → YAML Converter** integrato nell'interfaccia
- input JSON tramite **incolla diretta** o **upload file**
- conversione immediata in YAML
- possibilità di usare il YAML generato come:
  - **Swagger base**
  - **Swagger aggiornato**
- supporto al riconoscimento del documento convertito:
  - **Swagger 2.0**
  - **OpenAPI 3.x**
- download del file YAML generato

Descrizione visibile oggi nell'interfaccia:

> **Unisci due specifiche Swagger 2.0 oppure OpenAPI 3.x, converti un input JSON in YAML per leggere rapidamente lo swagger ottenuto, visualizza le differenze API e scarica un report Markdown.**

---

## Requisiti

Prima di eseguire il progetto è necessario installare:

- **Node.js >= 18**
- **npm**

Verifica installazione:

```bash
node -v
npm -v
```

---

## Installazione

Clonare il repository:

```bash
git clone https://github.com/alberto92rg/Swagger-Merge-Tool.git
```

Entrare nella cartella del progetto:

```bash
cd Swagger-Merge-Tool
```

Installare le dipendenze:

```bash
npm install
```

---

## Avvio in modalità sviluppo

Per avviare il tool in locale:

```bash
npm run dev
```

Aprire il browser all'indirizzo:

```text
http://localhost:5173
```

---

## Build del frontend

Prima di avviare l'applicazione desktop è necessario generare la build del frontend:

```bash
npm run build
```

Questo comando crea la cartella:

```text
dist/
```

che contiene i file compilati dell'interfaccia React/Vite.

Esempio struttura generata:

```text
dist
├── index.html
└── assets
```

---

## Avvio come applicazione desktop

Dopo aver generato la build (`npm run build`) è possibile avviare Electron:

```bash
npm run electron
```

Questo comando apre l'applicazione desktop.

---

## Creazione eseguibile

Per generare l'eseguibile Windows:

```bash
npm run dist
```

Dopo la build troverai l'eseguibile in una delle seguenti cartelle:

```text
dist/
release/
dist/win-unpacked/
```

Esempio:

```text
Swagger Merge Tool.exe
```

Questo eseguibile può essere distribuito senza installare Node.js.

---

## Sequenza completa per eseguire il progetto

Se scarichi il progetto da GitHub per la prima volta, esegui questi comandi nell'ordine:

```bash
git clone https://github.com/alberto92rg/Swagger-Merge-Tool.git
cd Swagger-Merge-Tool
npm install
npm run build
npm run electron
```

---

## Come utilizzare il tool

### 1. Caricare lo Swagger originale

Nel pannello **Swagger da aggiornare** caricare il file YAML originale.

### 2. Caricare lo Swagger aggiornato

Nel pannello **Swagger aggiornato** caricare il file YAML aggiornato.

### 3. In alternativa, usare il convertitore JSON → YAML

Nella card superiore è possibile:

- incollare un documento JSON
- caricare un file JSON
- convertirlo in YAML
- usare il risultato come input per:
  - **Swagger base**
  - **Swagger aggiornato**
- scaricare il file YAML generato

Questa funzionalità è utile quando la specifica API è disponibile in formato JSON ma il flusso del tool continua a lavorare sul contenuto YAML.

### 4. Generare il merge

Premere il pulsante:

```text
Genera merge
```

### 5. Analizzare le differenze

Il tool mostra:

- **Diff API intelligente**
- **Diff YAML riga per riga**

### 6. Scaricare il risultato

Premere:

```text
Download merged swagger
```

Verrà generato il file:

```text
swagger-merged.yaml
```

### 7. Scaricare il report delle differenze

Premere:

```text
Scarica report API
```

Verrà generato il file:

```text
api-diff-report.md
```

---

## Logica di merge

Il formato viene riconosciuto automaticamente dal campo `swagger` o `openapi` del documento
**base**. Se i due file dichiarano formati diversi il merge viene rifiutato con un messaggio
esplicito, invece di produrre un documento incoerente.

### Swagger 2.0

| Campo | Origine |
|---|---|
| swagger | nuovo |
| info | nuovo |
| basePath | vecchio |
| host | vecchio |
| schemes | vecchio |
| paths | merge |
| definitions | merge |
| parameters | merge |

Le tre chiavi d'ambiente (`host`, `basePath`, `schemes`) appartengono **esclusivamente** al
documento base: se non sono presenti nel base restano assenti nel risultato e il valore del
documento aggiornato non viene ereditato. L'interfaccia lo segnala con un avviso.

### OpenAPI 3.x

| Campo | Origine |
|---|---|
| openapi | nuovo |
| info | nuovo |
| servers | vecchio |
| paths | merge |
| webhooks | merge |
| components | merge per sezione (`schemas`, `responses`, `parameters`, `examples`, `requestBodies`, `headers`, `securitySchemes`, `links`, `callbacks`, `pathItems`) |
| tags | unione per nome, prevale il nuovo |

In OpenAPI 3.x i dati d'ambiente stanno in `servers`, che segue quindi la stessa regola di
`host`/`basePath`/`schemes`: viene preso solo dal documento base.

Se le due specifiche dichiarano versioni diverse (per esempio 3.0.3 e 3.1.0) il risultato
adotta quella del documento aggiornato e l'interfaccia mostra un avviso.

### Controllo dei riferimenti

Dopo ogni merge il tool verifica che tutti i `$ref` interni (`#/...`) puntino a un nodo
effettivamente presente nel documento risultante, ed elenca quelli non risolti. È il sintomo
tipico di una path importata senza gli schemi a cui fa riferimento.

---

## Struttura del progetto

```text
swagger-merge-tool
├── src
├── electron
├── public
├── package.json
├── vite.config.ts
└── README.md
```

---

## Compatibilità

Le evoluzioni sono state integrate mantenendo il progetto compatibile con il linguaggio e il framework già adottati:

- **React** per l'interfaccia
- **Vite** per lo sviluppo e la build frontend
- **Electron** per l'esecuzione desktop

Il supporto a OpenAPI 3.x della 4.0 **non modifica le regole di merge di Swagger 2.0**: i documenti Swagger 2.0 seguono lo stesso percorso di prima, con la sola eccezione della correzione su `host`, `basePath` e `schemes` descritta nelle novità della release. L'elaborazione resta interamente locale: i documenti API non vengono inviati ad alcun servizio esterno.

---

## Troubleshooting

### Errore `ERR_FILE_NOT_FOUND dist/index.html`

Se compare l'errore:

```text
ERR_FILE_NOT_FOUND
dist/index.html
```

significa che la build dell'applicazione non è stata generata.

Eseguire:

```bash
npm run build
npm run electron
```

---

## Versione

Versione applicativa aggiornata:

```text
4.0.0
```
