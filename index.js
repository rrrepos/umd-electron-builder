const { app, BrowserWindow } = require('electron');
var fs = require('fs');
const log = require('electron-log');

async function openFile(filepath) {
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

let mainWindow = null;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log.info("already open");
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    log.info('2:' + commandLine);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus();
      if(commandLine[1]) {
        openFile(commandLine[1]);
      }
    }
  });

  app.whenReady()
    .then(_ => {
      return createWindow();
    }).then(_win => {
      mainWindow = _win;
      log.info('1:' + process.argv);
      if (process.argv[1]) {
        openFile(process.argv[1]);
      }
    });

 app.on("open-url", (event, url) => {
  log.info("open-url", url);
 });
 app.on("open-file", (event, path) => {
  log.info("open-file", path);
  openFile(path);
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

