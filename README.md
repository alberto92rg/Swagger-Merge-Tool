# Swagger Merge Tool

Swagger Merge Tool è un'applicazione desktop che permette di **unire due file Swagger 2.0 (YAML)**, analizzare le differenze tra le API e generare automaticamente uno **Swagger unificato e validato**.

L'applicazione è sviluppata utilizzando **React, Vite ed Electron** e può essere eseguita sia in locale sia come **eseguibile standalone**.

---

# Funzionalità

Il tool permette di:

- unire automaticamente due file Swagger
- visualizzare le differenze tra le API
- analizzare il **diff YAML riga per riga**
- generare uno **Swagger merged**
- esportare un **report delle differenze API**
- caricare file tramite **drag & drop**
- utilizzare l'app come **desktop application**

---

# Tecnologie utilizzate

Il progetto è sviluppato utilizzando:

- React
- Vite
- Electron
- Tailwind CSS
- YAML parser

---

# Requisiti

Prima di eseguire il progetto è necessario installare:

- **Node.js (>= 18)**  
https://nodejs.org

Verifica installazione:

```bash
node -v
npm -v
Installazione

Clonare il repository:

git clone https://github.com/alberto92rg/Swagger-Merge-Tool.git

Entrare nella cartella del progetto:

cd Swagger-Merge-Tool

Installare le dipendenze:

npm install
Avvio in modalità sviluppo

Per avviare il tool in locale:

npm run dev

Aprire il browser:

http://localhost:5173
Avvio come applicazione desktop

Per avviare il tool tramite Electron:

npm run electron
Creazione eseguibile

Per generare l'eseguibile Windows:

npm run dist

Dopo la build troverai l'eseguibile in una delle seguenti cartelle:

dist/
release/
dist/win-unpacked/

Esempio:

Swagger Merge Tool.exe
Come utilizzare il tool
1. Caricare Swagger originale

Nel pannello Swagger da aggiornare caricare il file YAML originale.

2. Caricare Swagger aggiornato

Nel pannello Swagger aggiornato caricare il file YAML aggiornato.

3. Generare il merge

Premere il pulsante:

Genera merge
4. Analizzare le differenze

Il tool mostra:

Diff API intelligente

Diff YAML riga per riga

5. Scaricare il risultato

Premere:

Download merged swagger

Verrà generato il file:

swagger-merged.yaml
6. Scaricare il report delle differenze

Premere:

Scarica report API

Verrà generato:

api-diff-report.md
Logica di merge

Il tool applica le seguenti regole:

Campo	Origine
swagger	nuovo
info	nuovo
basePath	vecchio
host	vecchio
schemes	vecchio
paths	merge
definitions	merge
parameters	merge
Struttura del progetto
swagger-merge-tool
│
├── src
├── electron
├── public
├── package.json
├── vite.config.ts
├── README.md
Troubleshooting
Problemi con npm

Verificare Node.js:

node -v
Porta occupata

Se la porta 5173 è occupata, chiudere il processo o cambiare porta.

Problemi con Electron

Eseguire:

npm run build
npm run electron
