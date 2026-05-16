# Business Website Kit — Zero-Cost Enterprise

A production-ready, single-page business website template optimized for Ethiopian SMEs. Deploys to GitHub Pages at zero cost.

## Features

- Responsive design (mobile-first, works on all devices)
- SEO meta tags (Open Graph, description, canonical URL)
- Sticky navigation with smooth scroll
- Services section with card grid
- About section
- Contact form (Formspree integration)
- Zero dependencies — pure HTML + CSS

## Quick Start

1. Click "Use this template" or fork this repo on GitHub
2. Replace `Your Business` branding throughout `index.html`
3. Update service descriptions in the Services section
4. Replace `https://formspree.io/f/your-form-id` with your Formspree endpoint
5. Enable GitHub Pages: Settings > Pages > Deploy from `main` > `/ (root)`

## Customization

| Element | Location in index.html |
|---------|----------------------|
| Business name | Logo text + hero h1 |
| Services | `#services` section cards |
| Contact form action | `form` action URL |
| Colors | CSS custom properties in `<style>` block |
| Meta tags | `<meta>` and `<meta property="og:">` tags in `<head>` |

## Deployment

```bash
git push origin main
```

Then enable GitHub Pages in repo Settings > Pages > Source: Deploy from branch `main` > `/ (root)`.

Your site will be live at `https://<username>.github.io/<repo>/`.

## License

MIT — free to use, modify, and distribute.
