import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
// Execute the exported function only; browser bootstrapping is tested in the preview.
const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8').split('\ninitNavigation(document);')[0].replace('export function','function');
test('crossing to desktop moves focus from the hidden menu button into visible navigation',()=>{
  const root=new EventTarget(), toggle=new EventTarget(), nav=new EventTarget(), media=new EventTarget();
  media.matches=true; root.activeElement=toggle;
  toggle.setAttribute=()=>{}; toggle.closest=()=>({classList:{add(){}}}); toggle.focus=()=>{root.activeElement=toggle;};
  const firstLink={focus(){root.activeElement=firstLink;}};
  nav.classList={toggle(){}}; nav.contains=(e)=>e===firstLink; nav.querySelector=()=>firstLink;
  root.querySelector=s=>s==='#nav-toggle'?toggle:nav;
  const ctx=vm.createContext({matchMedia:()=>media}); vm.runInContext(source,ctx); ctx.initNavigation(root);
  media.matches=false; media.dispatchEvent(new Event('change')); assert.equal(root.activeElement,firstLink);
  media.matches=true; media.dispatchEvent(new Event('change')); assert.equal(root.activeElement,toggle);
});
