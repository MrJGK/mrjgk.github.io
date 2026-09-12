# Gopalakrishna’s portfolio

Personal portfolio for Jami Veera Satya Sankara Gopalakrishna, a Diploma in Computer Engineering student at Andhra Polytechnic, Kakinada.

Live at [mrjgk.github.io](https://mrjgk.github.io/).

## Website content

- A bold introduction with a borderless GitHub photograph that fades into the background.
- An asymmetric project gallery with a responsive topology illustration, moving connection signals on hover or keyboard focus, and a priority-policy preview.
- Complete project pages for the Network Monitoring and Visualization System and Priority-Based Internet Access Control.
- Skills and education, plus email, LinkedIn, GitHub, and four Instagram profiles.

The network-monitoring page distinguishes the user’s topology contribution from the broader system’s planned modules. The access-control page clearly identifies its Python implementation as a simulation.

## Appearance and motion

One shared stylesheet covers the homepage and project pages. The design combines dark surfaces, electric lime accents, oversized typography, scroll reveals, active navigation, and a page-progress line.

The WebGL background draws moving signal paths that respond to pointer position and scrolling. Its drawing resolution and frame rate are capped; animation stops in hidden tabs. If WebGL is unavailable, the photographic background remains usable.

Supported browsers use native same-origin view transitions between project titles and their full pages. Ordinary navigation remains available everywhere. A persistent pause-effects control and the operating system’s reduced-motion preference disable movement and skip page transitions.

## GitHub profile photo

The header portrait, hero photograph, and background use the verified GitHub avatar URL for account ID `302349533` (`MrJGK`). The page checks the current image every five minutes while visible and when the visitor returns. A shared refresh key avoids stale browser caching; GitHub’s own image propagation may still take time.

No GitHub API token is stored or required. A new image is loaded successfully before replacing the displayed portrait. Failed refreshes retain the existing image; initials remain available if the initial photograph cannot load. The HTML contains a direct avatar URL so images also work without JavaScript.

## Active files

| File | Purpose |
| --- | --- |
| `index.html` | Portfolio homepage |
| `projects/network-monitoring/index.html` | Full network monitoring project story |
| `projects/priority-access-control/index.html` | Full access-control project story |
| `assets/portfolio.css` | Shared responsive layout, visual design, and CSS motion |
| `assets/effects.js` | Scroll reveals, section navigation, and project-card interactions |
| `assets/cinematic.js` | WebGL signal paths, pointer depth, and motion preferences |
| `assets/profile.js` | Automatic refresh of the shared GitHub photograph |
| `assets/favicon.svg` | JGK browser icon |
| `.nojekyll` | Publish static files without Jekyll processing |

## Publishing and editing

The site uses plain HTML, CSS, and JavaScript. No installation, build framework, or backend is needed. GitHub Pages publishes from `main` and `/(root)` under **Settings → Pages → Deploy from a branch**.

Edit the HTML files for content and `assets/portfolio.css` for design. Keep project URLs relative and preserve the matching `view-transition-name` values when updating project titles. The photograph refresh and motion scripts enhance a site that remains readable and navigable without JavaScript.
