const { app, BrowserWindow } = require('electron');
var fs = require('fs');
const log = require('electron-log');

async function openFile(filepath) {
  log.info("openfile");
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
  log.info("createwindow");
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
let appLaunched = false; // status if app did finish loading
let filepath = null; // stores filepath if open-file event launched before did finish loading

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log.info("app quit");
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    log.info("second-instance");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
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
      log.info("whenReady:0", process.argv[0]);
      log.info("whenReady:1", process.argv[1]);
      //if (process.argv[1]&&process.argv[1].indexOf('-')==0) process.argv.unshift('');
      //log.info("whenReady:1", process.argv[1]);
      log.info("whenReady:2", filepath);
      if(filepath) {
        openFile(filepath);
        filepath = null;
      }
      else if (process.argv[1]) {
        openFile(process.argv[1]);
      }
    });

  app.on('will-finish-launching', function () {
    log.info("will-finish-launching");
    appLaunched = true;

    app.on("open-file", (event, path) => {
      log.info("open-file");
      if (mainWindow) {
        log.info("openfile with window")
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus();
        if (path) {
          openFile(path);
        }
      }
      else {
        log.info("open-file without window");
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