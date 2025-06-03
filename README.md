# GRR BarrelsTrack App

A cross-platform desktop application built with **Electron**, **React**, **Node.js**, and **PostgreSQL** to manage barrel tracking for GRR. This offline-capable app supports local database operations and is designed for fast, intuitive use in real-world logistics.



## Features

- Secure Login System  
- New Record Entry for barrel transactions  
- Update & Retrieve existing records  
- Offline Storage using local filesystem  
- Report Exporting as `.docx` files  
- Electron-Packed Desktop App  



## Technologies Used

- **Frontend:** React.js (CRA)  
- **Backend:** Node.js + Express  
- **Database:** PostgreSQL (local)  
- **Desktop Wrapper:** Electron + electron-builder  
- **Packaging:** NSIS (Windows installer)  
- **Auto Update:** electron-updater (GitHub Releases)  



## Getting Started (Development Mode)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/grr-barrels.git
cd grr-barrels
```

### 2. Install Dependencies

```bash
npm install
cd desktop-client && npm install
cd ..
```

### 3. Start Development Environment

```bash
# In one terminal - Start React client
cd desktop-client
npm start
```

```bash
# In another terminal - Start Electron + backend
npm run electron
```



## Build & Distribute (Production)

### 1. Build App

```bash
npm run build
```

### 2. Package Electron App

```bash
npm run dist
```

> The Windows installer (`.exe`) will be created in the `dist/` folder.



## Directory Structure


grr-barrels/
├── assets/               # Icons and branding
├── desktop-client/       # React frontend
├── server/               # Node.js Express backend
├── dist/                 # Output folder after packaging
├── main.js               # Electron entry point
├── package.json




## Contributions

Contributions are welcome! Please open an issue or pull request.
