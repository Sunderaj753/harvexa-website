# Harvexa Technologies website

Static, dependency-free site hosted on GitHub Pages at https://www.harvexatech.co.za

## Structure

```
.github/workflows/pages.yml   CI/CD: deploys ./src to GitHub Pages on push to main
src/
  index.html  404.html  CNAME  robots.txt  sitemap.xml  site.webmanifest  .nojekyll
  assets/
    css/styles.css
    js/main.js  neural.js  chat.js
    img/logo.svg  favicon.svg
```

## Run locally

```
cd src
python -m http.server 8080
```
Open http://localhost:8080

## Deploy

1. Push to a GitHub repo's `main` branch.
2. Settings > Pages > Source: **GitHub Actions**.
3. Settings > Pages > Custom domain: `www.harvexatech.co.za`, enable **Enforce HTTPS**.
4. DNS at your registrar:
   - `CNAME  www  <your-github-username>.github.io`
   - Apex `harvexatech.co.za` (A records): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

## Configure

- Contact form: create a free form at formspree.io and replace `YOUR_FORM_ID` in `src/index.html`.
- Replace placeholder email, phone and address in `src/index.html`.
