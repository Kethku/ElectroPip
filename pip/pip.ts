import {ipcRenderer as ipc, remote} from 'electron';

var ctrlDown = false;

window.onerror = function(error, url, line) {
  ipc.send('errorInWindow', error);
}

var maxRadius = 150;
var targetRadius = 150;
var currentRadius = 150;
var targetOpacity = 0;
var currentOpacity = 1;
var x = 0;
var y = 0;
ipc.on("mouseMoved", (event: any, newMousePos: {x: number, y: number}) => {
  x = newMousePos.x;
  y = newMousePos.y;
  targetRadius = maxRadius;
  targetOpacity = 0;
});

ipc.on("controlPressed", () => {
  targetRadius = 0;
  targetOpacity = 1;
})

setInterval(async () => {
  console.log(`x: ${x}, y: ${y}`);
  currentRadius += (targetRadius - currentRadius) * 0.05;
  currentOpacity += (targetOpacity - currentOpacity) * 0.05;
  if (document.body != null) {
    document.body.style["-webkit-mask-image"] = `
      radial-gradient(
        circle at left ${x}px top ${y}px,
          rgba(0,0,0,${currentOpacity}) 0px,
          rgba(0,0,0,${currentOpacity}) ${currentRadius}px,
          rgba(0,0,0,1) ${currentRadius + 50}px)`;
  }
});

function clipPoly(x: number, y: number) {
  var points = [];
  var radius = 125;
  points.push(`0px 0px`);
  points.push(`0px ${window.innerHeight}px`);
  points.push(`${window.innerWidth}px ${window.innerHeight}px`);
  points.push(`${window.innerWidth}px 0px`);
  points.push(`${x}px 0px`);
  for (var i = 0; i <= 30; i++) {
    var theta = i * 2 * Math.PI / 30 - Math.PI / 2;
    points.push(`${x + radius * Math.cos(theta)}px ${y + radius * Math.sin(theta)}px`);
  }
  points.push(`${x}px 0px`);
  return points.join(',');
}

document.addEventListener("DOMContentLoaded", function(event) {
  var style = document.createElement("style");
  style.type = "text/css";
  style.appendChild(document.createTextNode(`
  body {
      background: rgba(0,0,0,0) !important;
      opacity: 0.8 !important;
  }
  `));
  document.head.appendChild(style);
  console.log("Preload run");
});
