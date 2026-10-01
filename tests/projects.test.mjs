import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const moduleUrl = new URL('../scripts/build-projects.mjs', import.meta.url);
const load = () => import(moduleUrl);
const emptyLinks = {github:null,demo:null,caseStudy:null};
const validProject = {id:'sample',title:'A project',status:'concept',featured:false,summary:'A supplied description',links:emptyLinks};
const page = '<main>BEFORE<!-- PROJECTS:START -->old<!-- PROJECTS:END -->AFTER</main>';

test('generator module is available', async () => { const m = await load(); assert.equal(typeof m.validateProjects,'function'); });
test('real portfolio projects render supplied context without placeholder claims', async () => {
  const {renderProjects:r} = await load();
  const html=r([{...validProject,status:'portfolio',subtitle:'Dataset <quality>',category:'DATA / ML APPLICATION',features:['Cleaned records'],links:{github:'https://github.com/kuldeepy-hash/At-Risk-Student-Detection-System'}}]);
  assert.match(html,/Dataset &lt;quality&gt;/);
  assert.match(html,/DATA \/ ML APPLICATION/);
  assert.match(html,/Cleaned records/);
  assert.doesNotMatch(html,/not yet provided|await owner|FUTURE EXPLORATION|Project concept/);
});
test('duplicate IDs and multiple featured entries are rejected', async () => {
  const {validateProjects:v} = await load();
  assert.throws(()=>v([validProject,validProject]),/duplicate/i);
  assert.throws(()=>v([{...validProject,featured:true},{...validProject,id:'second',featured:true}]),/featured/i);
});
test('optional data can be absent and empty links never create buttons', async () => {
  const {validateProjects:v,renderProjects:r} = await load();
  const [p] = v([{id:'minimal',title:'Minimum',status:'placeholder',summary:'Awaiting content'}]);
  assert.doesNotMatch(r([p]),/<a\b/);
  assert.doesNotMatch(r(v([validProject])),/<a\b/);
});
test('unsafe or example external URLs are rejected', async () => {
  const {validateProjects:v} = await load();
  for(const demo of ['javascript:alert(1)','http://github.com/owner/repo','https://name:pass@github.com/a','https://example.com/a','https://a.example.org/x','https://foo.invalid/a','https://github.com/\nfoo']) {
    assert.throws(()=>v([{...validProject,links:{...emptyLinks,demo}}]),/url|link/i,demo);
  }
});
test('configured HTTPS links render and text is escaped', async () => {
  const {validateProjects:v,renderProjects:r} = await load();
  const html = r(v([{...validProject,title:'<img src=x>',summary:'A & B',links:{...emptyLinks,github:'https://github.com/openai'}}]));
  assert.match(html,/&lt;img src=x&gt;/); assert.match(html,/A &amp; B/);
  assert.match(html,/href="https:\/\/github.com\/openai"/); assert.doesNotMatch(html,/<img src=x>/);
});
test('long Unicode titles survive and new records require no template change', async () => {
  const {validateProjects:v,renderProjects:r} = await load();
  const title = '分析探索 '.repeat(70);
  const html = r(v([validProject,{...validProject,id:'new-project',title}]));
  assert.ok(html.includes(title)); assert.match(html,/id="project-new-project"/);
});
test('local missing and traversing media/case-study paths are rejected', async () => {
  const {validateProjects:v} = await load();
  for(const caseStudy of ['projects/missing.html','projects/../index.html','projects/%2e%2e/index.html','/outside.html']) {
    assert.throws(()=>v([{...validProject,links:{...emptyLinks,caseStudy}}]),/path|file|link|url/i);
  }
  assert.throws(()=>v([{...validProject,media:[{src:'assets/images/missing.png',alt:'Chart',width:100,height:100}]}]),/file/i);
  assert.throws(()=>v([{...validProject,media:[{src:'assets/images/../../index.html',alt:'Chart',width:100,height:100}]}]),/path/i);
});
test('required fields and field types fail clearly', async () => {
  const {validateProjects:v} = await load();
  for(const p of [{...validProject,title:''},{...validProject,id:'Bad ID'},{...validProject,technologies:'SQL'},{...validProject,status:'completed'},{...validProject,featured:'true'}]) assert.throws(()=>v([p]));
});
test('replacement requires exactly ordered markers and is idempotent', async () => {
  const {replaceProjectRegion:r} = await load();
  assert.throws(()=>r('<main></main>','cards'),/marker/i);
  assert.throws(()=>r(page+'<!-- PROJECTS:START -->','cards'),/marker/i);
  assert.throws(()=>r('<!-- PROJECTS:END --><!-- PROJECTS:START -->','cards'),/marker/i);
  const once = r(page,'cards'); assert.equal(r(once,'cards'),once); assert.match(once,/BEFORE/); assert.match(once,/AFTER/);
});
test('CLI failures preserve existing HTML and valid repeated builds are identical', async () => {
  await load();
  const dir = mkdtempSync(path.join(tmpdir(),'dataverse-generator-'));
  mkdirSync(path.join(dir,'scripts')); mkdirSync(path.join(dir,'content'));
  const script = path.join(dir,'scripts','build-projects.mjs');
  copyFileSync(fileURLToPath(moduleUrl),script);
  const htmlPath = path.join(dir,'index.html'), dataPath = path.join(dir,'content','projects.json');
  for(const [html,data] of [[page,'{broken'],[page+'<!-- PROJECTS:START -->',JSON.stringify([validProject])],['no markers',JSON.stringify([validProject])]]) {
    writeFileSync(htmlPath,html); writeFileSync(dataPath,data);
    const result=spawnSync(process.execPath,[script],{encoding:'utf8'});
    assert.notEqual(result.status,0); assert.equal(readFileSync(htmlPath,'utf8'),html);
  }
  writeFileSync(htmlPath,page); writeFileSync(dataPath,JSON.stringify([validProject]));
  assert.equal(spawnSync(process.execPath,[script]).status,0);
  const once=readFileSync(htmlPath,'utf8');
  assert.equal(spawnSync(process.execPath,[script]).status,0); assert.equal(readFileSync(htmlPath,'utf8'),once);
});
