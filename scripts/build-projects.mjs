/** Build static project cards. No runtime rendering, packages, or network needed. */
import { readFileSync, writeFileSync, renameSync, realpathSync, statSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const startMarker = '<!-- PROJECTS:START -->';
const endMarker = '<!-- PROJECTS:END -->';
const escape = (text) => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function text(value, name, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || (required && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error(`Invalid ${name}: expected ${required ? 'nonempty ' : ''}text`);
  return value;
}

function list(value, name) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`);
  return value.map(item => text(item,name,true));
}

function localFile(value, prefix) {
  if (typeof value !== 'string' || !value.startsWith(prefix) || /[\\%?#\u0000-\u0020]/.test(value) || value.split('/').some(part => ['.','..',''].includes(part))) throw new Error(`Invalid local path: ${value}`);
  const resolved = path.resolve(root, value);
  const allowed = path.resolve(root, prefix);
  if (!resolved.startsWith(allowed + path.sep)) throw new Error(`Invalid local path: ${value}`);
  if (!existsSync(resolved) || !statSync(resolved).isFile()) throw new Error(`Local file does not exist: ${value}`);
  const actual = realpathSync(resolved);
  if (!actual.startsWith(realpathSync(allowed) + path.sep)) throw new Error(`Local file escapes allowed path: ${value}`);
  return value;
}

function link(value, name) {
  if (value == null || value === '') return null;
  if (name === 'caseStudy' && typeof value === 'string' && value.startsWith('projects/')) return localFile(value,'projects/');
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) throw new Error(`Invalid ${name} URL`);
  let url;
  try { url = new URL(value); } catch { throw new Error(`Invalid ${name} URL`); }
  const host = url.hostname.toLowerCase().replace(/\.$/,'');
  const reserved = /(^|\.)(example\.(com|org|net)|example|invalid|test|localhost)$/.test(host);
  if (url.protocol !== 'https:' || url.username || url.password || reserved) throw new Error(`Invalid ${name} URL: supply a real HTTPS link without credentials`);
  return value;
}

export function validateProjects(input) {
  if (!Array.isArray(input)) throw new Error('Project data must be an array');
  const ids = new Set();
  let featuredCount = 0;
  return input.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Each project must be an object');
    const id = text(entry.id,'id',true);
    if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error(`Invalid project id: ${id}`);
    if (ids.has(id)) throw new Error(`Duplicate project id: ${id}`);
    ids.add(id);
    if (!['concept','placeholder','portfolio'].includes(entry.status)) throw new Error(`Invalid project status: ${id}`);
    if (entry.featured != null && typeof entry.featured !== 'boolean') throw new Error('featured must be a boolean');
    if (entry.featured && ++featuredCount > 1) throw new Error('Only one featured project is supported');
    if (entry.links != null && (typeof entry.links !== 'object' || Array.isArray(entry.links))) throw new Error('links must be an object');
    if (entry.media != null && !Array.isArray(entry.media)) throw new Error('media must be an array');
    const media = (entry.media || []).map(item => {
      if (!item || !Number.isInteger(item.width) || item.width <= 0 || !Number.isInteger(item.height) || item.height <= 0) throw new Error('Media dimensions must be positive integers');
      return {src:localFile(item.src,'assets/images/'),alt:text(item.alt,'media alt',true),width:item.width,height:item.height};
    });
    return {id,title:text(entry.title,'title',true),status:entry.status,featured:entry.featured ?? false,
      summary:text(entry.summary,'summary',true),subtitle:text(entry.subtitle,'subtitle'),category:text(entry.category,'category'),problem:text(entry.problem,'problem'),approach:text(entry.approach,'approach'),
      technologies:list(entry.technologies,'technologies'),features:list(entry.features,'features'),workflow:list(entry.workflow,'workflow'),media,
      links:Object.fromEntries(['github','demo','caseStudy'].map(name=>[name,link(entry.links?.[name],name)]))};
  });
}

function projectCard(p) {
  const status = p.status === 'concept' ? 'Project concept — implementation status not yet provided' : p.status === 'placeholder' ? 'Placeholder — project not yet provided' : '';
  const tags = p.technologies.length ? `<ul class="tag-list" aria-label="Technologies">${p.technologies.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>` : '';
  const actions = [['github','GitHub'],['demo','Live demo'],['caseStudy','Case study']].filter(([key])=>p.links[key]);
  const links = actions.length ? `<div class="project-links">${actions.map(([key,label])=>`<a class="button" href="${escape(p.links[key])}">${label}<span aria-hidden="true">↗</span></a>`).join('')}</div>` : '';
  const media = p.media.length ? `<div class="project-media">${p.media.map(m=>`<img src="${escape(m.src)}" alt="${escape(m.alt)}" width="${m.width}" height="${m.height}" loading="lazy">`).join('')}</div>` : '';
  const copy = `<div class="project-copy"><p class="eyebrow">${escape(p.category || (p.featured ? 'FEATURED PROJECT / DATA PLATFORM' : p.status === 'portfolio' ? 'PORTFOLIO PROJECT' : 'FUTURE EXPLORATION'))}</p><h3>${escape(p.title)}</h3>${p.subtitle ? `<p class="project-subtitle">${escape(p.subtitle)}</p>` : ''}<p class="project-summary">${escape(p.summary)}</p>${status ? `<p class="project-status">${status}</p>` : ''}${tags}${links}</div>`;
  const art = p.featured && !media ? `<div class="project-visual"><div aria-hidden="true"><div class="pipeline-art"><span>≋</span><i>→</i><span>◇</span><i>→</i><span>▥</span></div><div class="pipeline-labels"><span>DATASET</span><span>QUALITY</span><span>INSIGHT</span></div></div><p class="visual-label">ILLUSTRATIVE DATA WORKFLOW</p></div>` : '';
  const workflow = p.workflow.length ? `<h4>Designed workflow</h4><ol class="workflow">${p.workflow.map(step=>`<li>${escape(step)}</li>`).join('')}</ol>` : '';
  const fields = [['Problem',p.problem],['Approach',p.approach]].filter(([,value])=>value).map(([label,value])=>`<h4>${label}</h4><p>${escape(value)}</p>`).join('');
  const features = p.features.length ? `<h4>Key features</h4><ul>${p.features.map(f=>`<li>${escape(f)}</li>`).join('')}</ul>` : '';
  const note = p.status === 'portfolio' ? '' : `<p class="placeholder-note">${p.status==='concept' ? 'Implementation evidence, outcomes, and a detailed case study have not yet been provided.' : 'Project details await owner-supplied content.'}</p>`;
  const details = workflow || fields || features ? `<details class="project-detail"><summary>Explore ${escape(p.title)}${p.status==='concept' ? ' concept' : ''}</summary><div class="project-detail-content">${workflow}${fields}${features}${note}</div></details>` : '';
  return `<article class="project-card${p.featured?' featured':''}" id="project-${escape(p.id)}">${p.featured?`<div class="project-main">${copy}${media||art}</div>`:copy+media}${details}</article>`;
}

export function renderProjects(projects) {
  // Validate here too so callers cannot accidentally render unvalidated URLs.
  return `<div class="project-grid">\n${validateProjects(projects).map(projectCard).join('\n')}\n</div>`;
}

export function replaceProjectRegion(html, markup) {
  const start = html.indexOf(startMarker), end = html.indexOf(endMarker);
  if (start < 0 || end <= start || html.indexOf(startMarker,start+1) !== -1 || html.indexOf(endMarker,end+1) !== -1) throw new Error('Expected one ordered pair of project markers');
  return html.slice(0,start+startMarker.length) + '\n' + markup + '\n      ' + html.slice(end);
}

function build() {
  const output = path.join(root,'index.html');
  const projects = JSON.parse(readFileSync(path.join(root,'content/projects.json'),'utf8'));
  const html = readFileSync(output,'utf8');
  const updated = replaceProjectRegion(html,renderProjects(projects));
  if (updated === html) { console.log('Projects are up to date.'); return; }
  const temporary = `${output}.${process.pid}.tmp`;
  try { writeFileSync(temporary,updated,'utf8'); renameSync(temporary,output); }
  finally { if (existsSync(temporary)) unlinkSync(temporary); }
  console.log(`Built ${projects.length} static project cards.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { build(); } catch(error) { console.error(`Project generation failed: ${error.message}`); process.exitCode = 1; }
}
