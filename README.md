# Gopalakrishna’s portfolio

Personal portfolio for Jami Veera Satya Sankara Gopalakrishna, a Diploma in Computer Engineering student at Andhra Polytechnic, Kakinada.

## Website content

- Introduction, skills, and education.
- Email, LinkedIn, GitHub, and four Instagram profiles.
- Scroll reveals, a reading-progress line, active section navigation, and pointer-responsive project cards.
- A portrait-led homepage, full GitHub-photo background, procedural WebGL light effects, and pointer-responsive depth.
- Automatic GitHub profile-photo refresh every five minutes while the page is visible, with refresh on returning to the page. The avatar is loaded directly from GitHub; no API token is stored or required.
- Smooth anchor scrolling, responsive layouts, a persistent pause-effects control, and operating-system reduced-motion support.
- A complete Network Monitoring and Visualization System project page, covering the topology contribution, 11 planned modules, technologies, workflow, integration, and progress.
- A complete Priority-Based Internet Access Control project page, clearly identifying the current Python implementation as a simulation.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Portfolio homepage |
| `projects/network-monitoring/index.html` | Network monitoring project |
| `projects/priority-access-control/index.html` | Access-control project |
| `assets/style.css` | Base responsive styling |
| `assets/effects.css` | Visual refinements and motion styles |
| `assets/effects.js` | Progressive scroll and pointer interactions |
| `assets/cinematic.css` | Portrait layout and cinematic visual treatment |
| `assets/cinematic.js` | Procedural light, pointer depth, and motion preference |
| `assets/profile.js` | Refresh the shared GitHub portrait and background |
| `assets/favicon.svg` | JGK browser icon |
| `.nojekyll` | Serve static files without Jekyll processing |

## Publishing and editing

This website uses plain HTML, CSS, and vanilla JavaScript and requires no installation, build, framework, or backend. GitHub Pages should publish from `main` and `/(root)` under **Settings → Pages → Deploy from a branch**. The site address is `https://mrjgk.github.io/`.

Edit the HTML pages to update content, `assets/style.css` for the base layout, and `assets/effects.css` and `assets/effects.js` for visual effects. The base avatar URL is included in HTML so the photo also works without JavaScript. A successfully displayed photo stays in place if a refresh fails; initials remain readable if the photo cannot load at all. WebGL effects fall back to the photographic background when unavailable. Content and navigation remain available with JavaScript disabled; motion respects the visitor’s reduced-motion preference. Open `index.html` in a browser for a local preview. Links are relative, and each project is a standalone page.

See [GitHub’s publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Project descriptions reflect the information shared through September 2026. The broader network-monitoring modules describe the system design; access-control decisions are currently simulated.

