const { app, BrowserWindow } = require("electron");
var fs = require("fs");
const log = require("electron-log");

async function openFile(filepath) {
  log.info("openFile" + filepath);
  let arraybuffer;

  if (filepath) {
    try {
      arraybuffer = await fs.readFileSync(filepath);
      mainWindow.webContents.send("fileinfo", { "filepath": filepath, "buffer": arraybuffer });

    } catch (err) {
      console.error(err)
    }
  }
}

function createWindow() {
  return new Promise(resolve => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      center: true,
      backgroundColor: "#1e1e1e",
      webPreferences: {
        nodeIntegration: true
      }
    });
    win.setMenu(null);

    win.loadURL("https://rrrepos.github.io/umd-project-org/electron");
    win.webContents.on('did-finish-load', () => {
      resolve(win);
    });
  });
}

let mainWindow = null;  // window object
let filepath = null; // stores filepath if open-file event launched 

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    log.info("second-instance" + commandLine.join("/"));
    if (mainWindow ) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      if (commandLine[1]) {
        openFile(commandLine[1]);
      }
    }
  });

  app.whenReady()
    .then(_ => {
      log.info("whenReady");
      return createWindow();
    }).then(_win => {
      mainWindow = _win;
      log.info("2/" + filepath + "/" + process.argv[1]);
      if(filepath) {
        openFile(filepath);
      }
      else if (process.argv[1]) {
        openFile(process.argv[1]);
      }
    });

  app.on("will-finish-launching", function () {
    log.info("will-finish-launching");
    app.on("open-file", (event, path) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus();
        if (path) {
          openFile(path);
        }
      }
      else {
        filepath = path;
      }
    });  
  });


}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow()
  }
});