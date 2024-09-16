const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    })
    win.loadFile("index.html");
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.on("msg", (event, data) => {
        console.warn(data);
    })
    

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows.length === 0) {
            createWindow();
        }
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
})