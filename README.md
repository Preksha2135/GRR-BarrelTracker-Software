# GRR BarrelsTrack App

A cross-platform desktop application built with **Electron**, **React**, **Node.js**, and **PostgreSQL (NeonDB)** to manage barrel tracking for the company GRR. This cloud-synced app supports real-time data access and is designed for fast, intuitive use in real-world logistics.



## Features

- Secure Login System  
- New Record Entry for barrel transactions  
- Update & Retrieve existing records  
- Cloud Sync using **NeonDB** (PostgreSQL)  
- Offline Storage using local filesystem (fallback)  
- Report Exporting as `.docx` files  
- Electron-Packed Desktop App  



## Technologies Used

- **Frontend:** React.js (CRA)  
- **Backend:** Node.js + Express  
- **Database:** NeonDB (Cloud PostgreSQL)  
- **Desktop Wrapper:** Electron + electron-builder  
- **Packaging:** NSIS (Windows installer)  
- **Auto Update:** electron-updater (GitHub Releases)  



## Getting Started (Development Mode)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/grr-barrels.git
cd grr-barrels
````

### 2. Install Dependencies

```bash
npm install
cd desktop-client && npm install
cd ..
```

### 3. Configure Environment

Create a `.env` file in the `server/` folder with your NeonDB connection string:

```env
DATABASE_URL=postgres://<user>:<password>@ep-xxxxx.neon.tech/dbname?sslmode=require
```

> Your database must already be created on [https://neon.tech](https://neon.tech) and tables initialized.



### 4. Start Development Environment

```bash
# Terminal 1 - Start React client
cd desktop-client
npm start
```

```bash
# Terminal 2 - Start Electron + backend (inside main.js)
npm run electron
```

> Electron starts the backend server automatically and connects to NeonDB.



## Build & Distribute (Production)

### 1. Build App

```bash
npm run build
```

### 2. Package Electron App

```bash
npm run dist
```

> A Windows installer (`.exe`) will be generated inside the `dist/` folder, ready for distribution.



## 🤝 Contributions

Contributions are welcome! Please open an issue or pull request on GitHub.


