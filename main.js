const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
// main.js (partial)
const expressApp = require("./server/index"); // export your express app from server/index.js
const http = require("http");

function startBackendServer() {
  const server = http.createServer(expressApp);
  const PORT = 5000;
  server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
  return server;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, "assets", "icon.ico"),
    title: "GRR BarrelsTrack App",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Optional: use preload script for better security
    },
  });

  win.loadURL(
    `file://${path.resolve(__dirname, "desktop-client", "build", "index.html")}`
  );
}

// === Local file storage for offline small data ===
const dataFilePath = path.join(app.getPath("userData"), "app-data.json");

function ensureDataFile() {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({}));
  }
}

// === IPC handlers for local file interactions ===
ipcMain.handle("read-data", async () => {
  ensureDataFile();
  const data = fs.readFileSync(dataFilePath, "utf-8");
  return JSON.parse(data);
});

ipcMain.handle("write-data", async (event, newData) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2));
  return { status: "success" };
});

// === Save Word Report Handler ===
ipcMain.on("save-report", async (event, buffer, filename) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: filename,
    filters: [{ name: "Word Documents", extensions: ["docx"] }],
  });

  if (!canceled && filePath) {
    fs.writeFile(filePath, Buffer.from(buffer), (err) => {
      if (err) {
        console.error("Error saving report:", err);
      }
    });
  }
});

function startBackendServer() {
  const server = http.createServer(expressApp);
  const PORT = 5000;
  server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
  return server;
}

// === App lifecycle ===
app.whenReady().then(() => {
  startBackendServer(); // start backend server inside Electron
  ensureDataFile();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
