# DataVerse

**Kuldeep Yadav’s personal Data Analytics portfolio.** DataVerse presents his background, skills, internships, projects and Power BI work through an accessible eight-world orbital interface.

## Features

- Cinematic DataVerse Core and eight destinations with conventional navigation.
- Featured DataHub AI, At-Risk Student Detection System and three analytics dashboards.
- Education, experience, certifications, SQL and Python skill areas.
- Contact links and a downloadable professional resume.
- Responsive desktop/tablet/mobile layouts, keyboard navigation, reduced-motion support and Pause Motion.
- Static HTML content and native disclosures remain usable without JavaScript.

## Technologies

HTML, CSS, vanilla JavaScript and a dependency-free Node.js project generator. Original CSS/SVG artwork; no Three.js, external visual library or runtime framework required.

## Local preview

Install a current Node.js LTS release, then run from the repository root:

```sh
node scripts/preview.mjs
```

Open the loopback URL printed by the command. The port is selected automatically. Keep the process running and refresh after edits. No npm install is required. Opening index.html directly provides static content, but use the server for module scripts.

## Project structure

```text
index.html                 Static portfolio entry point
css/                       Approved layout and orbital styles
js/                        Navigation and optional motion controller
assets/resume/             Professional resume PDF
assets/images/             Add actual project screenshots here
content/projects.json      Project-card content source
projects/                  Optional standalone case studies
scripts/build-projects.mjs  Validated static project generator
scripts/preview.mjs         Local-only preview server
tests/                     Node regression tests
.github/workflows/pages.yml GitHub Pages test/build/deploy workflow
```

## Editing content

Personal background, skills, analytics cards and contact links are in index.html. The resume link points to assets/resume/kuldeep-yadav-resume.pdf; replace it with an updated real PDF as needed. Website contact information excludes a phone number and date of birth; the resume remains the owner-supplied document.

Edit content/projects.json and regenerate cards:

```sh
node scripts/build-projects.mjs
node --test tests/*.test.mjs
```

Do not manually edit between the PROJECTS:START and PROJECTS:END markers. Records support title, summary, optional subtitle/category, technologies, features, workflow, media and links. Status can be portfolio, concept or placeholder; portfolio describes supplied work without claiming completion or production deployment. Only one project may be featured.

For real screenshots, add files under assets/images/ and configure media entries with src, alt, width and height. Use simple relative filenames without spaces. Images load lazily. Missing links use null and produce no button. Case studies can use a real HTTPS link or an existing projects/ file. The generator validates paths and URLs and escapes supplied text.

Analytics illustrations are explicitly labeled as illustrative, not actual dashboard images. Replace them with genuine screenshots when available. DataHub AI has no repository/demo button until a real link is configured. The dedicated SQL case study remains Coming Soon.

## GitHub Pages deployment

Intended repository: https://github.com/kuldeepy-hash/DataVerse

Expected site after successful publication: https://kuldeepy-hash.github.io/DataVerse/

1. Create the public DataVerse repository under kuldeepy-hash, leaving it empty (do not initialize a README, license or gitignore). If it already exists, inspect its contents before pushing; never force-push over existing work.
2. In repository Settings → Pages, select **GitHub Actions** as the source.
3. Push the local main branch to origin. The checked-in workflow tests the generator/controller/navigation, checks generated markup, and deploys an allowlisted artifact containing index.html, CSS, JavaScript, assets and non-Markdown case studies.
4. Wait for the Deploy DataVerse to GitHub Pages workflow to succeed. If the first run preceded Pages setup, rerun it from Actions.
5. Open the published URL and verify navigation and the resume at https://kuldeepy-hash.github.io/DataVerse/assets/resume/kuldeep-yadav-resume.pdf.

index.html is at the repository root. Website asset URLs are relative so the site works beneath /DataVerse/. No custom domain or service credentials are required in source. Repository documentation, tests and build tools are not included in the deployed artifact. GitHub’s official workflow guidance: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Deployment has not been performed by the preparation step. LinkedIn may block automated requests; the portfolio uses the owner-supplied address. Verify the live site after publishing.

## Owner

Kuldeep Yadav · B.Tech CSE (Data Science) Student · Aspiring Data Analyst.
