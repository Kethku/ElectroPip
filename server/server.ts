import {app, BrowserWindow, screen, ipcMain as ipc, globalShortcut} from "electron";
import * as path from "path";
import * as url from "url";

import { spawn } from 'child_process';
import * as rl from 'readline';

var keyboardProcess = spawn(path.resolve(path.join(__dirname, '../KeyboardState.exe')));
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

function createWindow() {
  let preloadPath = path.join(__dirname, "pip/main.js");
  console.log("pip ready");
  win = new BrowserWindow({
    skipTaskbar: true,
    alwaysOnTop: true,
    frame: false,
    thickFrame: true,
    webPreferences: {
      preload: preloadPath
    }
  });

  win.once('dom-ready', () => {
    console.log("showing window");
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
    win.webContents.openDevTools({ mode: "detach" });
  });

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
      win.webContents.send("mouseMoved", {x: -100000, y: -10000});
    }
  }, 16);

  console.log("loading url");
  win.loadURL(process.argv[2]);
}

ipc.on('errorInWindow', (event: any, data: any) => {
  console.log(data);
});

app.on('ready', createWindow);
