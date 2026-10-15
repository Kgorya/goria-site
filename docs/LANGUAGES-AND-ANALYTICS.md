# Languages and analytics

## Status

- Ukrainian remains at `/`, `/products/`, `/blog/`, etc. No URL migration is required.
- English is configured with `/en` but is **not published**. No English pages or language switch appear until actual translations are enabled and published.
- GA4 and Microsoft Clarity are prepared but disabled while their project IDs are empty. There is no analytics traffic on localhost.
- The approved Ukrainian homepage source is unchanged. Spacing rules apply only to the cases and blog catalogs.

## Publish a translation

1. Keep `config/locales.json` as the locale registry. Ukrainian uses `uk` (not `ua`).
2. Write complete translated body HTML under `content/locales/en/`. Use the site's existing classes. This file contains the main content, including its H1; it does not contain a second HTML document, shared menu, or footer.
3. Add an entry to `content/locales/en/pages.json`, for example:

```json
{
  "baseUrl": "/products/",
  "title": "Solutions for small businesses",
  "description": "AI systems for customer enquiries and follow-ups.",
  "active": "products",
  "source": "products.html",
  "published": true
}
```

The `source` file must actually exist before enabling this entry. `published: false` entries are ignored. Do not publish Ukrainian body copy under an English URL. Do not use the manifest entry above until the translation has been authored and reviewed.

4. Set the English locale's `enabled` to `true`, then run `npm run build`.
5. The builder creates `/en/products/`, its own canonical, `lang="en"`, English shared UI, English Open Graph locale, reciprocal Ukrainian/English hreflang links, a switch to the corresponding page, and its sitemap entry. Only published translations are linked in the switch.
6. Links inside translated content point to a translation when it exists, otherwise to the Ukrainian original. Review these fallbacks before launch. External service destinations are not translated by the builder: check the bot, demo, Telegram channel and legal text separately, and explain their language to English readers when necessary.
7. For article translations, provide the translated article body and metadata in the same manifest. Optional `schema` may contain the translated Article data; `inLanguage` and `url` are set by the builder. Localize dates and reading time in the editorial source (locale date formats are registered in `config/locales.json`).
8. To add Spanish later, register `es` with prefix `/es`, add `content/locales/es/ui.json` using the English dictionary's keys, and add its `pages.json` plus translated HTML. No new routing branch in the builder is needed.

The language switch never redirects automatically based on browser settings. Existing Ukrainian content and slugs stay intact. A `baseUrl` is the stable link between translations; it must refer to an existing Ukrainian page.

## Activate analytics

Create a website property/stream in Google Analytics 4 and a project in Microsoft Clarity, then use their **public** IDs:

- GA4 Measurement ID: `G-…`
- Clarity Project ID: the ID in the `https://www.clarity.ms/tag/…` installation script.

Put them in `config/analytics.json`, or build with `GA4_MEASUREMENT_ID` and `CLARITY_PROJECT_ID`. These are public website identifiers, not API secrets. Do not add account passwords or private API keys.

Each service can be enabled independently. Build again after changing the IDs. Production collection is restricted to `allowedHosts`; do not add localhost or preview hosts to that list.

No vendor scripts are requested before the visitor accepts analytics. The banner offers acceptance and refusal. The choice is stored for up to 180 days, and the visitor can reopen it using the footer's analytics settings button. Refusal after acceptance disables measurement, clears first-party measurement cookies and reloads without vendor scripts. Advertising consent remains denied.

GA4 gets page views plus `contact_click`, `bot_click`, `email_click`, and `solution_click`. These are link clicks, **not** completed leads or sales. Custom events contain only the current page path and language, never email addresses, link query strings or message contents. Page location/referrer supplied to GA4 omit query strings and fragments. Disable automatic form-interaction collection in GA4 Enhanced Measurement if it is enabled in the property; this integration does not need it.

Clarity is prepared for session recordings and heatmaps, with consentv2 signals. In the Clarity project, require cookie consent and review masking (use Strict masking for the initial launch). Inputs and example customer cards are also marked for masking by the loader. Do not put personal data in page URLs or publicly rendered content. Recordings and heatmaps must be checked in the real project after deployment; unit tests do not confirm vendor data reception.

The privacy page describes the conditional integration. Configure and review the actual projects before activation. No advertising integration or Google Tag Manager container is needed for this setup.

Official references:

- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic
- https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2

## Verify

```sh
npm run build
npm run check
npm run test:foundation
```

Foundation tests exercise a translated build in a temporary output directory and a simulated browser for analytics. No vendor requests or real visits are sent. For a temporary build, `SITE_OUTPUT_DIR` changes the output directory and `SITE_TRANSLATIONS_DIR` changes the directory containing locale manifests and their sources.
