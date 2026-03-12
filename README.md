# Swagger Merge Tool

Swagger Merge Tool è un'applicazione desktop che permette di **unire due file Swagger 2.0 (YAML)**, analizzare le differenze tra le API e generare automaticamente uno **Swagger unificato e validato**.

L'applicazione è sviluppata utilizzando **React, Vite ed Electron** e può essere eseguita sia in locale sia come **applicazione desktop** oppure distribuita come **eseguibile standalone**.

---

# Requisiti

Prima di eseguire il progetto è necessario installare:

**Node.js (>= 18)**  
https://nodejs.org

Verifica installazione:

```bash
node -v
npm -v

#Installazione

Clonare il repository:

git clone https://github.com/alberto92rg/Swagger-Merge-Tool.git

Entrare nella cartella del progetto:

cd Swagger-Merge-Tool

Installare le dipendenze:

npm install

Generare la build del frontend

Prima di avviare l'applicazione desktop è necessario generare la build.

npm run build

Questo comando crea la cartella:

dist/

che contiene i file compilati dell'interfaccia (React/Vite).

Esempio:

dist
│
├── index.html
├── assets
Avvio in modalità sviluppo

Per avviare il tool in locale:

npm run dev

Aprire il browser:

http://localhost:5173
Avvio come applicazione desktop

Dopo aver generato la build (npm run build) è possibile avviare Electron:

npm run electron

Questo comando apre l'applicazione desktop.

Creazione eseguibile

Per generare l'eseguibile Windows:

npm run dist

Dopo la build troverai l'eseguibile in una delle seguenti cartelle:

dist/
release/
dist/win-unpacked/

Esempio:

Swagger Merge Tool.exe

Questo eseguibile può essere distribuito ai colleghi senza installare Node.js.

Sequenza completa per eseguire il progetto

Se scarichi il progetto da GitHub per la prima volta, esegui questi comandi nell'ordine:

git clone https://github.com/alberto92rg/Swagger-Merge-Tool.git

cd Swagger-Merge-Tool

npm install

npm run build

npm run electron
Come utilizzare il tool
1️⃣ Caricare Swagger originale

Nel pannello Swagger da aggiornare caricare il file YAML originale.

2️⃣ Caricare Swagger aggiornato

Nel pannello Swagger aggiornato caricare il file YAML aggiornato.

3️⃣ Generare il merge

Premere il pulsante:

Genera merge
4️⃣ Analizzare le differenze

Il tool mostra:

Diff API intelligente

Diff YAML riga per riga

5️⃣ Scaricare il risultato

Premere:

Download merged swagger

Verrà generato il file:

swagger-merged.yaml
6️⃣ Scaricare il report delle differenze

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
ERR_FILE_NOT_FOUND dist/index.html

Se compare l'errore:

ERR_FILE_NOT_FOUND
dist/index.html

significa che la build dell'applicazione non è stata generata.

Eseguire:

npm run build
npm run electron
