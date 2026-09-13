# Gopalakrishna’s portfolio

Personal portfolio for Jami Veera Satya Sankara Gopalakrishna, a Diploma in Computer Engineering student at Andhra Polytechnic, Kakinada.

Live at [mrjgk.github.io](https://mrjgk.github.io/).

## Website content

- A bold introduction with the original GitHub photograph isolated by a silhouette mask, with no visible photo backdrop or frame.
- An asymmetric project gallery with a responsive topology illustration, moving connection signals on hover or keyboard focus, and a priority-policy preview.
- Complete project pages for the Network Monitoring and Visualization System and Priority-Based Internet Access Control.
- Skills and education, plus email, LinkedIn, GitHub, and four Instagram profiles.

The network-monitoring page distinguishes the user’s topology contribution from the broader system’s planned modules. The access-control page clearly identifies its Python implementation as a simulation.

## Appearance and motion

One shared stylesheet covers the homepage and project pages. The design combines dark surfaces, electric lime accents, oversized typography, scroll reveals, active navigation, and a page-progress line.

The portrait stage projects two rotating 3D light paths and a sparse particle field into separate rear and front canvases. A foreground depth pass keeps light trails below the face. Pointer position changes perspective and lighting; a small idle drift and scroll offset give the original photograph depth without simulating facial movement. Touch scrolling remains native.

A low-contrast WebGL field adds moving signal paths behind the page. Rendering density and frame rates are capped, including a lower data-saving mode. Portrait effects stop when the stage is offscreen; all animation stops in hidden tabs. Canvas or WebGL failures leave the masked photograph and page content usable.

Supported browsers use native same-origin view transitions between project titles and their full pages. Ordinary navigation remains available everywhere. A persistent pause-effects control and the operating system’s reduced-motion preference disable movement and skip page transitions.

## GitHub profile photo

The header avatar uses the verified GitHub URL for account ID `302349533` (`MrJGK`). It checks for an updated photo every five minutes while the page is visible and when the visitor returns. A new image loads before the displayed avatar is replaced; a failed refresh retains the previous image. No GitHub API token is required.

The large hero uses `assets/profile-portrait.jpg`, the unmodified photograph fetched from that account on 2026-09-12. Its CSS silhouette follows this specific photograph, removing the wall, crown, and surrounding background from the rendered page; a bottom fade blends the crop into the page. The image-generation attempt was rejected because it did not preserve the original image or produce real transparency, so no generated portrait is published.

The hero is deliberately separate from the live header avatar: replacing it with a different GitHub photo would require refitting the mask. To change the hero, replace the source photo and update `.hero-portrait` together. There is no photographic wallpaper. The 3D effect is a layered photograph with projected graphics, not a volumetric scan or live video.

## Active files

| File | Purpose |
| --- | --- |
| `index.html` | Portfolio homepage |
| `projects/network-monitoring/index.html` | Full network monitoring project story |
| `projects/priority-access-control/index.html` | Full access-control project story |
| `assets/portfolio.css` | Shared responsive layout, visual design, and CSS motion |
| `assets/effects.js` | Scroll reveals, section navigation, and project-card interactions |
| `assets/cinematic.js` | Projected 3D orbits, WebGL signal paths, portrait depth, and motion preferences |
| `assets/profile.js` | Automatic refresh of the header GitHub avatar |
| `assets/profile-portrait.jpg` | Original profile photograph, rendered through its fitted silhouette |
| `assets/favicon.svg` | JGK browser icon |
| `.nojekyll` | Publish static files without Jekyll processing |

## Publishing and editing

The site uses plain HTML, CSS, and JavaScript. No installation, build framework, or backend is needed. GitHub Pages publishes from `main` and `/(root)` under **Settings → Pages → Deploy from a branch**.

Edit the HTML files for content and `assets/portfolio.css` for design. Keep project URLs relative and preserve the matching `view-transition-name` values when updating project titles. The photograph refresh and motion scripts enhance a site that remains readable and navigable without JavaScript.
