import { display } from "./pipRenderer";
import * as registry from "winreg";
import * as path from "path";

var regKey = new registry({
  hive: registry.HKCU,
  key: '\\Software\\02Credits\\TrafficControl\\Commands'
});

function register() {
  regKey.set("Pip", registry.REG_SZ, `electron ${path.resolve(__dirname, "..")}`, error => {});
}

regKey.keyExists((error, exists) => {
  if (!exists) {
    regKey.create((error) => {
      if (error) console.log(error);
      register();
    })
  } else {
    register();
  }
});


display(process.argv[2]);
