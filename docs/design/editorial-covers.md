# Editorial covers

The site uses a shared illustration system: warm ivory paper (#F2EFE5), black ink (#171714), and a vermilion accent (#D94B32). Artwork uses restrained woodcut / screenprint textures and concrete business situations. Headings remain HTML text outside the illustration.

## Assets and metadata

- `content/covers.json` records the nine current covers, their alternative text and sharing images.
- Six published articles declare `image`, `image_alt` and `og_image` in front matter.
- Product and case cards use their respective JSON records. The current homepage contains explicit cover paths in `pages/home.html`.
- Web artwork: 1200×750 WebP, 16:10. Sharing export: 1200×630 JPEG, preserving the complete artwork without cropping its subjects.
- Article images preserve 16:10; the ecommerce product hero uses `editorial-cover` to prevent the earlier portrait crop.
- Photography of the author and documentary screenshots remain separate from cover artwork.

## Replacing a cover

Create a new versioned asset; retain the previous file for recovery and avoid reusing a cached URL. Update the manifest and all matching source references, then run `npm run build` and `npm run check`. Check the article, relevant cards, social metadata and a narrow viewport. `python3 scripts/covers.py` validates and retains editorial assets; it does not regenerate them with the older typographic renderer.

New illustrations should preserve the palette and print style, but use an appropriate subject rather than copying a box, ribbon or mechanical gate into every topic. Dental illustrations should read as dentistry, not a closed garage. Do not add fabricated metrics or simulated evidence screenshots.

Original PNG masters and exact generation prompts are retained in the owner's Goria design-system archive. Social-media and YouTube layouts will be developed separately using this same visual foundation.
