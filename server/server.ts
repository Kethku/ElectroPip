import {app, BrowserWindow} from "electron";
import * as path from "path";
import * as url from "url";

let win;

function createWindow() {
  win = new BrowserWindow({width: 800, height: 600});

  win.loadURL(url.format({
    pathname: path.resolve(__dirname, "pip", "pip.html"),
    protocol: 'file:',
    slashes: true
  }));

  win.webContents.openDevTools();

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);
