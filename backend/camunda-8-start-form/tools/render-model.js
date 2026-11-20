// Renders a BPMN file to PNG with bpmn-js (same renderer as Operate/Modeler) using headless Edge.
// Usage: node tools/render-model.js src/main/resources/model/uc01-onboarding.bpmn target/uc01.png [width] [height]
// Needs internet access (bpmn-js is loaded from unpkg.com).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const [bpmn, out, w = '3400', h = '1300'] = process.argv.slice(2);
const xml = fs.readFileSync(bpmn, 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://unpkg.com/bpmn-js@17.11.1/dist/assets/bpmn-js.css">
<style>html,body,#c{margin:0;width:100%;height:100%;background:#fff}</style></head><body><div id="c"></div>
<script src="https://unpkg.com/bpmn-js@17.11.1/dist/bpmn-navigated-viewer.production.min.js"></script>
<script>const v=new BpmnJS({container:'#c'});v.importXML(${JSON.stringify(xml)}).then(r=>{v.get('canvas').zoom('fit-viewport');if(r.warnings.length)document.body.insertAdjacentHTML('afterbegin','<pre style="position:absolute;color:red">'+r.warnings.map(x=>x.message).join(' | ')+'</pre>')}).catch(e=>{document.body.innerText='ERR '+e.message})</script></body></html>`;
const file = path.join(require('os').tmpdir(), path.basename(bpmn) + '.html');
fs.writeFileSync(file, html);
const url = 'file:///' + file.split(path.sep).join('/');
execFileSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless', '--disable-gpu', '--hide-scrollbars',
  `--window-size=${w},${h}`, '--virtual-time-budget=15000', `--screenshot=${path.resolve(out)}`, url], { stdio: 'ignore' });
console.log('rendered', out);
