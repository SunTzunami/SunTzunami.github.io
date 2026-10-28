<div align="center">

# Sajag Swami

**Personal Website & Research Portfolio**

[![Website](https://img.shields.io/badge/Live_Site-suntzunami.github.io-2b5c8f?style=flat-square&logo=google-chrome&logoColor=white)](https://suntzunami.github.io/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20with-GitHub%20Pages-121013?style=flat-square&logo=github&logoColor=white)](https://suntzunami.github.io/)
[![Stack](https://img.shields.io/badge/Stack-Vanilla%20HTML%20%7C%20CSS%20%7C%20JS-e34f26?style=flat-square)](https://suntzunami.github.io/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success?style=flat-square)](#design--engineering-philosophy)
[![Privacy First](https://img.shields.io/badge/Tracking-Zero%20%2F%20Privacy--First-blueviolet?style=flat-square)](#privacy--performance)

<p align="center">
  <em>Statistics, applied LLM research, causal inference, and real-world experiments.</em><br>
  Based in Tokyo, Japan.
</p>

</div>

---

## Overview

This repository powers [**suntzunami.github.io**](https://suntzunami.github.io/), the personal academic and engineering portfolio of **Sajag Swami** ([सजग स्वामी](https://suntzunami.github.io/) / [サジャグ・スワミ](https://suntzunami.github.io/)).

The site is built with a minimalist, high-craft philosophy: hand-written HTML5, pure CSS styling, and lightweight vanilla JavaScript. No framework overhead, no node build steps, zero trackers, and zero third-party font or asset CDNs.

---

## Design & Engineering Philosophy

- **Zero-Build, Pure Web Platform:** Directly served static files. Instant page loads, zero dependency vulnerabilities, and no build pipeline to maintain.
- **Editorial Typography:** Typeset in self-hosted **Newsreader** (body serif) and **Hanken Grotesk** (interface sans). All fonts are bundled locally in `.woff2` format to ensure privacy and eliminate render-blocking network requests.
- **Privacy First:** Absolutely zero analytics, telemetry, trackers, or cookies. No external CDN calls.
- **Accessibility & Motion:** Semantic HTML5, accessible ARIA attributes, skip links, and full respect for system `prefers-reduced-motion` settings.

---

## The Interactive Companion — Moti (मोती)

In the top-left header of every page sits **Moti**, an interactive SVG companion created in memory of Sajag's dog:

- **Physics-driven tracking:** Moti's head, ears, and eyes dynamically follow the user's cursor across the viewport (`script.js`).
- **Autonomous behaviors:** Natural blinking intervals and subtle head gestures when idle.
- **Interactive reactions:** Wags his tail on hover and happily sticks his tongue out when clicked or pressed.
- **Mobile gestures:** On touch devices, Moti glances in the direction of the scroll.
- **Reduced motion support:** When the OS prefers reduced motion, only gentle eye movements remain enabled.
- **Memorial Page:** Visit [`moti.html`](https://suntzunami.github.io/moti.html) for a dedicated tribute and photo memories.

---

## Site Structure

```text
.
├── index.html            # Landing page: Bio, current research focus, and background
├── projects.html         # Research projects, experiments, simulations & data stories
├── publications.html     # Academic papers, conference proceedings (COLM), and preprints
├── lab_log.html          # Research log, engineering notes, and working hypotheses
├── personal.html         # Outside the lab: muses (Kobe, Marcus Aurelius, MJ), sports & books
├── moti.html             # In memoriam page for Moti (मोती)
├── eyeread.html          # Deep-dive case study: Insho 印章 hands-free reading interface
├── 404.html              # Custom 404 error page (featuring Moti)
├── SwamiSajagCV2026.pdf  # Curriculum Vitae
├── style.css             # Unified design system, CSS custom properties, and responsive layouts
├── script.js             # Navigation drawer logic & interactive SVG dog animations
├── favicon.svg           # Vector favicon (Moti's face)
├── fonts/                # Self-hosted WOFF2 font files (Newsreader & Hanken Grotesk)
├── images/               # Web-optimized profile pictures, project figures, and media
│   ├── profile-2026-480.jpg   # 1x hero profile portrait
│   ├── profile-2026-960.jpg   # 2x retina hero profile portrait
│   ├── profile-2026-1200.jpg  # OpenGraph / social preview card image
│   ├── muses/            # High-resolution imagery for personal muses
│   └── projects/         # Diagrams, plots, and animated project demonstrations
├── projects/             # Static assets and supplementary code for individual projects
│   ├── exercise_trends/
│   ├── pictureofpitch_every_day_for_last_sem/
│   ├── roundnumbers/
│   ├── weight_training/
│   └── zetamac_scores/
└── .nojekyll             # Prevents GitHub Pages from running Jekyll transformations
```

---

## Local Development

Because the site is pure vanilla HTML/CSS/JS, no compilation or bundler is required. You can preview it with any local HTTP server:

### Using Python 3 (Built-in)
```bash
python3 -m http.server 8080
```
Then visit [`http://localhost:8080`](http://localhost:8080).

### Using Node.js
```bash
npx serve .
```

---

## Deployment to GitHub Pages

The repository is pre-configured for GitHub Pages:

1. Push this repository to GitHub under `SunTzunami/SunTzunami.github.io`.
2. In the repository settings, navigate to **Settings > Pages**.
3. Under **Build and deployment**, set:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / Folder: `/ (root)`
4. The site will publish automatically to `https://suntzunami.github.io/`.

> [!NOTE]
> If hosted on a custom domain or alternate URL, update the canonical and `og:image` URL tags in the `<head>` of each `.html` file.

---

## Connect & Profiles

- **Google Scholar:** [Sajag Swami](https://scholar.google.com/citations?user=qtOp1XsAAAAJ&hl=en)
- **GitHub:** [@SunTzunami](https://github.com/SunTzunami)
- **LinkedIn:** [s824s](https://www.linkedin.com/in/s824s/)
- **X / Twitter:** [@Swami824](https://twitter.com/Swami824)
- **Email:** [sajagtsunami@gmail.com](mailto:sajagtsunami@gmail.com)

---

<div align="center">
  <sub>Crafted with precision & care for <a href="https://suntzunami.github.io/moti.html">Moti</a>.</sub>
</div>
