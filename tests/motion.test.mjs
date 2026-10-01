import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/universe.js',import.meta.url),'utf8');
const {initUniverse}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
// A narrow DOM boundary fixture lets Node exercise live preference/visibility events.
// Removing either event listener or ignoring user pause would fail these tests.
function fixture(reduced=false) {
  const preference=new EventTarget(); preference.matches=reduced;
  const doc=new EventTarget(); doc.hidden=false; doc.documentElement={dataset:{}};
  doc.defaultView={matchMedia:()=>preference};
  const button=new EventTarget(); button.hidden=true; button.disabled=false;
  button.attributes={}; button.setAttribute=(k,v)=>{button.attributes[k]=v;};
  const status={textContent:''};
  const container={ownerDocument:doc,querySelector:s=>s==='[data-motion-toggle]'?button:status};
  return {preference,doc,button,status,container,change:()=>preference.dispatchEvent(new Event('change')),click:()=>button.dispatchEvent(new Event('click'))};
}
test('motion initializes, pauses, resumes, and cleans up',()=>{
  const f=fixture(); const controller=initUniverse(f.container);
  assert.equal(f.doc.documentElement.dataset.motion,'running'); assert.equal(f.button.hidden,false);
  f.click(); assert.equal(f.doc.documentElement.dataset.motion,'paused'); assert.equal(f.button.attributes['aria-pressed'],'true');
  f.click(); assert.equal(f.doc.documentElement.dataset.motion,'running');
  controller.destroy(); assert.equal(f.doc.documentElement.dataset.motion,'paused'); assert.equal(f.button.hidden,true);
  f.click(); assert.equal(f.doc.documentElement.dataset.motion,'paused');
});
test('reduced motion at load and live changes override user interaction',()=>{
  const f=fixture(true); const c=initUniverse(f.container);
  assert.equal(f.doc.documentElement.dataset.motion,'paused'); assert.equal(f.button.disabled,true);
  assert.match(f.status.textContent,/system preference/i); f.click(); assert.equal(f.doc.documentElement.dataset.motion,'paused');
  f.preference.matches=false; f.change(); assert.equal(f.doc.documentElement.dataset.motion,'running');
  f.click(); f.preference.matches=true; f.change(); f.preference.matches=false; f.change();
  assert.equal(f.doc.documentElement.dataset.motion,'paused'); assert.equal(f.button.attributes['aria-pressed'],'true'); c.destroy();
});
test('document visibility pauses without discarding user preference',()=>{
  const f=fixture(); const c=initUniverse(f.container);
  f.doc.hidden=true; f.doc.dispatchEvent(new Event('visibilitychange')); assert.equal(f.doc.documentElement.dataset.motion,'paused');
  f.doc.hidden=false; f.doc.dispatchEvent(new Event('visibilitychange')); assert.equal(f.doc.documentElement.dataset.motion,'running');
  f.click(); f.doc.hidden=true; f.doc.dispatchEvent(new Event('visibilitychange')); f.doc.hidden=false; f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.doc.documentElement.dataset.motion,'paused'); c.destroy();
});
