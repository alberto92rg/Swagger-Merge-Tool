Installazione

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
Sequenza completa per eseguire il progetto

Se scarichi il progetto da GitHub per la prima volta, esegui questi comandi nell'ordine:

git clone https://github.com/alberto92rg/Swagger-Merge-Tool.git

cd Swagger-Merge-Tool

npm install

npm run build

npm run electron
