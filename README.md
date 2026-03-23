# Melbet Somalia Landing

Static landing template with two pages:

- `index.html` - main page with `Casino`, `Sport`, `Trending games`, `Trending sports`, and `Questions about us`
- `partnership.html` - partnership page with `Agent program` and `Affiliate program`

## Where to edit content

Edit only:

- `js/site-data.js`

This file contains:

- English and Somali text
- trending game cards
- trending sports cards
- FAQ items
- partnership blocks

## Recommended workflow for two people

Developer 1:

- changes layout in `index.html`, `partnership.html`, `css/styles.css`

Developer 2:

- changes only content in `js/site-data.js`
- can automate daily updates of games and sports cards from a spreadsheet, JSON feed, or script

## Safe automation idea

If trends change often, automate only these arrays in `js/site-data.js`:

- `window.SITE_DATA.home.games`
- `window.SITE_DATA.home.sports`

This keeps HTML stable and reduces merge conflicts.
