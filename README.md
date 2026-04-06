# Swagger Merge Tool 3.0

Swagger Merge Tool è un'applicazione desktop che permette di **unire due file Swagger 2.0**, analizzare le differenze tra le API e generare automaticamente uno **Swagger unificato e validato**.

Dalla versione **3.0** il tool introduce anche una nuova funzionalità: un pannello dedicato che consente di **incollare o caricare un JSON**, convertirlo in **YAML** e usarlo direttamente come input per l'analisi o il merge dello Swagger.

L'applicazione è sviluppata utilizzando **React, Vite ed Electron** e può essere eseguita sia in locale sia come **applicazione desktop**, oppure distribuita come **eseguibile standalone**.

---

## Novità della versione 3.0

La release **3.0** aggiunge la nuova feature:

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

Descrizione aggiornata visibile nell'interfaccia:

> **Unisci due Swagger 2.0, visualizza le differenze API, converti JSON in YAML e scarica un report Markdown.**

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

### 3. In alternativa, usare la nuova feature JSON → YAML

Nel nuovo pannello/card superiore è possibile:

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

Il tool applica le seguenti regole di merge:

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

La nuova feature è stata integrata mantenendo il progetto compatibile con il linguaggio e il framework già adottati:

- **React** per l'interfaccia
- **Vite** per lo sviluppo e la build frontend
- **Electron** per l'esecuzione desktop

L'introduzione della conversione **JSON → YAML** non modifica il flusso principale del tool, ma lo estende con un passaggio opzionale e integrato nell'interfaccia.

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
3.0.0
```
