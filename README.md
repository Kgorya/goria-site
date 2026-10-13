# Goria site

Static personal website, built with Node, gray-matter and marked. Run `npm run build` after editing sources. Generated HTML is the deployable website.

## Sources

- `pages/home.html`: homepage with two products, two research cards and two latest articles.
- `pages/about.html`: biography based on the original committed site and the founder’s approach.
- `pages/cases.html`: implemented projects, currently the Shopify preorder case.
- `pages/products.html`: catalog, handover and ongoing support formats, audit and materials.
- Other `pages/*.html`: product, audit, resource and legal page sources.
- `content/products.json`: product ordering and descriptions.
- `content/{cases,tools,news}/*.md`: articles with publication date, group and cover.
- `build.js`: shared layout, navigation, author block, contextual offers, catalogs and redirects.
- `site.css` and `site.js`: responsive styles, mobile menu and contact dialog.

The public navigation is Products, Cases, Blog, About. Research remains in the blog. The audit is a distinct CTA. Resources are accessed from Products. Headings have no colon, period or em dash; product and article cards have no decorative labels. Copy uses requests, messages and conversations in place of repeated «звернення».

## Local preview

From this directory run `npm run preview`, then open `http://127.0.0.1:8765/`.

## Content selection

Homepage products are the first two by descending `order`. An all-products link appears when there are more than two. Research shows the two newest `group: research` articles. Latest blog shows the two newest other articles by their front-matter date. Rebuild to refresh the site after adding an article.

## Telegram funnel

Audit links preserve `?start=test_<source>` for compatibility. Only the internal payload contains the old term; public copy says audit. The contact dialog offers an audit, a message to the bot and a native email-client fallback. External HTTP links open in a new tab.

The evening worksheet CTA uses `?start=resource_evening`. The Telegram bot records the reader and sends a ZIP containing an instruction, a CSV table and an illustrative example. No channel subscription is required. Readers may stop bot messages with `/stop`. Their existing audit answers are preserved. The old direct download was removed from this website; the ZIP lives outside the deployable root.

A tested integration copy is in `../website/Интеграции/goria-bot/`. The same bot and localized UI changes were saved in the local AI-Office `agents/goria-bot` source. Credentials and production data were not read or copied. **The production bot must be updated with `bot.py`, `content/` and `resources/` before publishing the new website CTA.** Neither the live website nor the production bot has been deployed by this revision.

## Verification

- Build and JavaScript syntax checks pass.
- Static checks cover 34 HTML outputs, heading punctuation, audit terminology, external links, local destinations and anchors.
- 23 content pages were checked in the browser at actual CSS widths 320, 390, 768, 1024 and 1440 px, accounting for the browser’s current zoom: 115 checks without horizontal overflow or broken images.
- Bot engine and simulated conversation checks pass.
- `test_resources.py` checks subscriber storage, archive contents, delivery, repeat requests, preserved audit answers, `/stop` and unknown payloads. These checks send no real Telegram messages.

## UX review follow-up

Heading and introductory copy share a physical column, avoiding font-dependent `ch` width mismatches. Blog orientation links now explain what each recommended article helps understand. Header, mobile menu and footer use one navigation definition and the same order. `npm run check` rejects inconsistent menus, missing assets and broken destinations across all generated content pages. CSS and JS URLs include a content hash. The preview server sends `Cache-Control: no-store` and always serves current files. No old-menu mismatch was reproduced in the current browser; cache protection is preventative, not a proven root-cause claim.

## Release status

The public resource page describes the prepared worksheet and links to the existing audit. Automatic worksheet delivery is explicitly marked as pending; no `resource_evening` delivery link is exposed until the production bot is updated. The earlier integration description documents the implemented local bot behavior, not the current production deployment.
