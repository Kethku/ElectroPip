import {app, BrowserWindow, screen, ipcMain as ipc, globalShortcut, dialog} from "electron";
import * as path from "path";
import * as url from "url";

import { spawn } from 'child_process';
import * as rl from 'readline';

import { rewrite } from './urlRewriter';

export function display(url: string) {
  var isElectron = 'electron' in process.versions;
  var isUsingAsar = isElectron && process.mainModule && process.mainModule.filename.includes('app.asar');

  function fixPathForAsarUnpack(path: string) {
    return isUsingAsar ? path.replace('app.asar', 'app.asar.unpacked') : path;
  }

  var keyboardAppUrl = fixPathForAsarUnpack(path.resolve(path.join(__dirname, '../KeyboardState.exe')));
  var keyboardProcess = spawn(keyboardAppUrl);
  var keyboardOutput = rl.createInterface({ input: keyboardProcess.stdout, terminal: false });

  function readLine() {
    return new Promise<string>((resolve, reject) => {
      keyboardOutput.once('line', (text) => {
        resolve(text as string);
      });
    })
  }

  async function keyDown(key: string) {
    keyboardProcess.stdin.write(key);
    var result = await readLine();
    if (result.trim() == "True") {
      return true;
    } else {
      return false;
    }
  }

  let win;
  let timeout: any = null;

  function quit() {
    if (win != null) win = null;
    app.quit();
    clearInterval(timeout);
  }

  function createWindow() {
    let preloadPath = path.join(__dirname, "pip/main.js");
    console.log("pip ready");
    win = new BrowserWindow({
      skipTaskbar: true,
      alwaysOnTop: true,
      frame: false,
      show: false,
      transparent: true,
      thickFrame: true,
      webPreferences: {
        preload: preloadPath
      }
    });

    win.once('ready-to-show', () => {
      win.show();

      let display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      let width = Math.floor(display.bounds.width * 0.25);
      let height = Math.floor(width * 0.5625);
      let bounds = {
        x: display.bounds.x + display.bounds.width - width - 25,
        y: display.bounds.y + display.bounds.height - height - 65,
        width: width, height: height
      };
      win.setContentBounds(bounds);
      win.webContents.send("mouseMoved", {x: -1000000, y: -1000000});
    });

    win.on('window-all-closed', quit)

    timeout = setInterval(async () => {
      var altDown = await keyDown("ControlKey\n");
      win.setIgnoreMouseEvents(!altDown);
      var cursorScreenPoint = screen.getCursorScreenPoint();
      var windowBounds = win.getContentBounds();
      cursorScreenPoint.x -= windowBounds.x;
      cursorScreenPoint.y -= windowBounds.y;
      if (!altDown &&
          cursorScreenPoint.x > -250 && cursorScreenPoint.x < windowBounds.width + 250 &&
          cursorScreenPoint.y > -250 && cursorScreenPoint.y < windowBounds.height + 250) {
        win.webContents.send("mouseMoved", cursorScreenPoint);
      } else {
        win.webContents.send("controlPressed");
      }
    }, 16);


    if (url) {
      url = rewrite(url);
      console.log("loading url: " + url);
      win.loadURL(url);
    } else {
      dialog.showMessageBox({
        "message": "Please pass a valid url as argument to show in Picture in Picture window."
      }, quit);
    }
  }

  ipc.on('errorInWindow', (event: any, data: any) => {
    console.log(data);
  });

  app.on('ready', createWindow);
}
