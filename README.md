# Gopalakrishna’s portfolio

Personal portfolio for Jami Veera Satya Sankara Gopalakrishna, a Diploma in Computer Engineering student at Andhra Polytechnic, Kakinada.

Live at [mrjgk.github.io](https://mrjgk.github.io/).

## Website content

- A bold introduction alongside a clean, static GitHub profile card with a round avatar, name, and profile link.
- An asymmetric project gallery with a responsive topology illustration, moving connection signals on hover or keyboard focus, and a priority-policy preview.
- Complete project pages for the Network Monitoring and Visualization System and Priority-Based Internet Access Control.
- Skills and education, plus email, LinkedIn, GitHub, and four Instagram profiles.

The network-monitoring page distinguishes the user’s topology contribution from the broader system’s planned modules. The access-control page clearly identifies its Python implementation as a simulation.

## Appearance and motion

One shared stylesheet covers the homepage and project pages. The design combines dark surfaces, electric lime accents, oversized typography, scroll reveals, active navigation, and a page-progress line.

The profile has no glow, orbit canvases, particles, mask, color filter, tilt, idle drift, scroll parallax, or entrance animation. Its photo is served directly by GitHub. The card uses a solid surface, simple spacing, and a standard circular avatar.

A low-contrast WebGL field adds moving signal paths behind the page. Rendering density and frame rates are capped, including a lower data-saving mode. All page animation stops in hidden tabs. Canvas or WebGL failures leave the profile and page content usable.

Supported browsers use native same-origin view transitions between project titles and their full pages. Ordinary navigation remains available everywhere. A persistent pause-effects control and the operating system’s reduced-motion preference disable movement and skip page transitions.

## GitHub profile photo

The header and main profile card use the same live GitHub URL for account ID `302349533` (`MrJGK`). Both are marked with `data-github-avatar`, so the existing refresh script checks for an updated photo every five minutes while the page is visible and when the visitor returns. A new image loads before the displayed avatars are replaced; a failed refresh retains the previous image. No GitHub API token is required.

The profile card reserves a square area to avoid layout shifts and shows JGK initials if the photo cannot load. The direct image URL also works without JavaScript. Changing the GitHub avatar updates the website without uploading a portrait or adjusting a silhouette. No stored portrait asset is used by the homepage.

## Active files

| File | Purpose |
| --- | --- |
| `index.html` | Portfolio homepage |
| `projects/network-monitoring/index.html` | Full network monitoring project story |
| `projects/priority-access-control/index.html` | Full access-control project story |
| `assets/portfolio.css` | Shared responsive layout, visual design, and CSS motion |
| `assets/effects.js` | Scroll reveals, section navigation, and project-card interactions |
| `assets/cinematic.js` | Page-wide WebGL signal paths and motion preferences |
| `assets/profile.js` | Automatic refresh of the header and main GitHub avatars |
| `assets/favicon.svg` | JGK browser icon |
| `.nojekyll` | Publish static files without Jekyll processing |

## Publishing and editing

The site uses plain HTML, CSS, and JavaScript. No installation, build framework, or backend is needed. GitHub Pages publishes from `main` and `/(root)` under **Settings → Pages → Deploy from a branch**.

Edit the HTML files for content and `assets/portfolio.css` for design. Keep project URLs relative and preserve the matching `view-transition-name` values when updating project titles. The photograph refresh and motion scripts enhance a site that remains readable and navigable without JavaScript.
