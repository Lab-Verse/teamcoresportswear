# Team Core Sports Wear — SEO audit of the first five competitors

**Audit date: 4 November 2026.** This English edition covers ZipaSports, Juggle Sports, Shazbro, Ahmyz Impex and Delta Craft, in the order supplied in the Asial Sports shortlist. The order reflects business overlap. It does not represent search ranking, revenue or market share. The comparison focuses on custom uniforms and teamwear for clubs, schools, brands, resellers and wholesale buyers.

**Recommendation:** Use ZipaSports as the model for answering buyer questions, Shazbro for sport and product pages, and Juggle Sports for carrying a buyer's selection into the quote form. Team Core already has a design studio, quote basket and dedicated pages for six sports. Start by strengthening those pages and connecting them to the existing quote flow.

The audit used public HTML, robots.txt and XML sitemaps; representative category, product and quotation pages; eight English search queries; direct checks of external link sources; and a small mobile browser sample. The audit shows how buyers can inquire. It does not establish how many orders competitors receive, which channels generated those orders, or whether their advertised service terms are consistently met. No forms were submitted.

| Competitor | URLs listed in XML sitemaps | Strongest observed practice | Main issue or limitation |
| --- | ---: | --- | --- |
| ZipaSports | 1,791 entries across 10 child sitemaps | Separate pages by sport, product, buyer type, service and country | The homepage and general service page address overlapping search intent. A browser challenge prevented a usable speed measurement. |
| Juggle Sports | 30 | Sport pages, Finnish equivalents and item-specific quotes | Its non-www homepage redirects to www, while its canonical and sitemap point to non-www. |
| Shazbro | 118 entries, including 97 products and 11 product categories | Distinct sport categories and SKU-level pages | The sampled product lacked Product markup. A browser challenge prevented a usable speed measurement. |
| Ahmyz Impex | Five entries; **zero on its own domain** | Sport selection, interactive mockups and a direct inquiry route | The sitemap lists another business's domain; robots.txt returned 404, and the homepage lacked a canonical. |
| Delta Craft | One | Detailed factory and quality-control content in the search snapshot | The raw homepage and search snapshot differed; the browser run failed at DNS resolution. |

Sitemap entries are not a Google index count. ZipaSports' total is the sum of the XML entries. Alternate sitemap addresses for Shazbro were not counted twice.

## 1. ZipaSports

**Keyword targeting.** The [homepage](https://zipasports.com/) targets “custom sportswear manufacturer in Sialkot Pakistan.” It also has pages for [custom sportswear suppliers](https://zipasports.com/custom-sportswear/), [private-label sportswear](https://zipasports.com/private-label/), [custom football kits](https://zipasports.com/sports-teamwear/football/), [ice hockey jerseys](https://zipasports.com/sports-teamwear/ice-hockey/), [clubs and teams](https://zipasports.com/for-clubs/), and [US sportswear and soccer uniforms](https://zipasports.com/custom-sportswear-usa/). These are separate entry points for different buyer needs.

**Technical and e-commerce SEO.** The sampled pages had descriptive titles, descriptions, H1 headings, self-referencing canonicals and breadcrumbs. The sampled [football match jersey page](https://zipasports.com/sports-teamwear/football/football-match-jerseys/) included Product markup. The [sitemap index](https://zipasports.com/sitemap.xml) groups products, buyer pages and guides. The site also publishes [llms.txt](https://zipasports.com/llms.txt); its effect on rankings or AI citations was not measured. The homepage and general service page both appeared for a similar query, which shows overlap without proving that the pages are hurting each other's rankings.

**Public order path.** Buyers can move from a sport or product page to WhatsApp or a [quote form](https://zipasports.com/contact.html) that asks for country, buyer type, category and estimated quantity. The site advertises a typical minimum of 20–25 units per design, a free digital mockup within 24 hours, a sample before bulk production and a remake policy. These offers address common questions before buyers inquire.

## 2. Juggle Sports

**Keyword targeting.** “Custom sublimated teamwear,” “custom floorball kits,” “custom ice hockey jerseys,” “custom football kits for clubs” and “custom basketball uniforms.” See [teamwear](https://www.jugglesports.com/teamwear/), [floorball](https://www.jugglesports.com/teamwear/floorball/) and [ice hockey](https://www.jugglesports.com/teamwear/ice-hockey/).

**Technical and e-commerce SEO.** English and Finnish pages carried `en`, `fi` and `x-default` hreflang tags. The [sitemap](https://jugglesports.com/sitemap-0.xml) and canonical use non-www URLs, but the non-www homepage returned a 308 redirect to www. Redirects, canonical tags, hreflang and sitemap entries should agree on the final hostname. Product, ItemList and BreadcrumbList markup appeared in the sampled football and catalogue pages. The [catalogue](https://www.jugglesports.com/catalogue/) supports lookup by article number; the sample did not reveal a dedicated search landing page for each item.

**Public order path.** Buyers select a sport or catalogue item and open a [quote form with the item number](https://www.jugglesports.com/request-a-quote/?item=1605). It collects quantity, deadline and optional artwork. The site offers a free mockup with its quote and shows [contact points in Pakistan, Miami and Finland](https://www.jugglesports.com/contact/). Carrying the item number into the form is the feature Team Core can use most directly.

## 3. Shazbro

**Keyword targeting.** “Custom teamwear manufacturer in Sialkot,” “custom soccer uniforms manufacturer,” “custom 7v7 flag football uniforms” and “custom baseball uniforms.” See the [7v7](https://www.shazbro.com/product-category/7v7-uniform/), [soccer](https://www.shazbro.com/product-category/soccer-uniform/) and [baseball](https://www.shazbro.com/product-category/baseball-uniform/) pages.

**Technical and e-commerce SEO.** The [WordPress/WooCommerce sitemap](https://www.shazbro.com/wp-sitemap.xml) listed 97 products and 11 product categories. The sampled categories used distinct titles, descriptions, headings, canonicals and breadcrumbs. The [SC-02 soccer uniform](https://www.shazbro.com/product/soccer-uniform-green-and-white-sc-02/) has its own URL, model number and quote call to action. BreadcrumbList was detected on that page; Product markup was not. A quote-only product does not automatically qualify for a Google product rich result.

**Public order path.** Buyers move from a sport to a product model, then use a quick quote, [contact form](https://www.shazbro.com/contact-us/) or WhatsApp. Pages explain what buyers can change, such as colours, names, numbers and logos, and the site describes a sample before bulk production. A completed checkout or order was not verified.

## 4. Ahmyz Impex

**Keyword targeting.** “Custom sports uniform manufacturer,” “custom team uniforms,” “dye-sublimated uniforms,” plus American football, 7v7, soccer and basketball. Most of the sampled content and catalogue were concentrated on the [homepage](https://ahmyzimpex.com/); separate searchable sport pages were not found in the sample.

**Technical and e-commerce SEO.** The homepage returned HTTP 200 and had a title, description, H1 and Organization markup, but no canonical. [robots.txt](https://ahmyzimpex.com/robots.txt) returned 404, which does not by itself block crawling. All five URLs in the [XML sitemap](https://ahmyzimpex.com/sitemap.xml) pointed to `aslamelectronics.pk`. The homepage still appeared for several sampled search queries.

**Public order path.** Buyers can select a sport, adjust colours or design, download a mockup, and proceed to a form or WhatsApp. The site advertises a 20-piece minimum, free mockup and a sample before bulk orders. The presence of a button does not confirm that the workflow creates a paid order.

## 5. Delta Craft

**Keyword targeting.** “Custom sportswear manufacturer and exporter Sialkot,” “dye-sublimated team uniforms,” “custom activewear manufacturer” and “private label sportswear.” A search snapshot of the [homepage](https://deltacraft.biz/) described football, soccer, basketball, baseball, training gear, fabrics, CAD, sublimation and quality checks.

**Technical and e-commerce SEO.** The [child sitemap](https://deltacraft.biz/wp-sitemap-posts-page-1.xml) listed only the homepage. The direct HTTP response returned 200 with a title, description and a JavaScript module. The raw HTML did not expose an H1, canonical, Product markup or internal catalogue links. The search snapshot contained more content, and Chrome encountered a DNS error in this run. That discrepancy does not establish a persistent outage or that Googlebot cannot render the page.

**Public order path.** The search snapshot showed factory capabilities and commercial terms alongside WhatsApp and email. The likely route is direct contact followed by a quotation. A live form, checkout and order volume were not verified.

## Keyword visibility and ranking sample

The numbers are positions within the first 12 results returned by the public search tool for each query. They are **not verified Google US or UK positions**, search volumes or Keyword Difficulty scores. A dash means the domain did not appear in that particular sample. Team Core did not appear in the first 12 results for any of the seven unbranded queries. A direct Google US test returned a redirect screen without usable results.

| Search query | ZipaSports | Juggle | Shazbro | Ahmyz | Delta |
| --- | ---: | ---: | ---: | ---: | ---: |
| custom sportswear manufacturer Sialkot Pakistan | 1 | — | — | — | — |
| custom sublimated team uniforms manufacturer Pakistan | — | 3 | — | 2 | — |
| private label sportswear manufacturer Pakistan Sialkot | 5 | — | — | — | — |
| custom sublimated soccer jerseys manufacturer Sialkot Pakistan | — | 5 | — | 3 | — |
| custom ice hockey jerseys manufacturer Sialkot Pakistan | 4 | — | — | — | — |
| custom 7v7 flag football uniforms manufacturer Pakistan | — | — | 1 | — | — |
| custom floorball teamwear kits manufacturer club Sialkot | 7 | 3 | 12 | 11 | — |
| Delta Craft Sialkot custom sportswear deltacraft.biz (branded) | 11 | — | — | — | 1 |

The [search evidence](seo-20261104/search-sample.json) includes the result URLs for all eight queries.

## Backlinks and domain authority

| Competitor | Evidence from external sites |
| --- | --- |
| ZipaSports | [Grayback International's training shorts roundup](https://graybackinternational.com/best-10-training-shorts-manufacturers/) links to the www homepage with the anchor “ZipaSports” and `rel="nofollow noopener"`. The www URL redirects to the non-www homepage. The commercial relationship and how the placement was obtained are unknown. |
| Juggle Sports | [Sialkot Chamber, page 167](https://scci.com.pk/jotelab/2024/08/FINAL-ASSOCIATE-VOTING-LIST-ELECTION-2024-26.pdf#page=167) and [TDAP, page 18](https://tdap.gov.pk/wp-content/uploads/2022/02/Chapter-95-Toys-games-and-sports-requisites.pdf#page=18) contain business mentions. [TradeWheel](https://www.tradewheel.com/p/best-quality-sublimation-soccer-jersey-sets-1207298/) displays the separate `.com.pk` domain as plain text. A return link from the [Alibaba storefront](https://pk1363062232lonz.trustpass.alibaba.com/) to the audited `.com` domain was not verified. |
| Shazbro | [Sialkot Chamber, page 67](https://scci.com.pk/jotelab/2024/08/FINAL-ASSOCIATE-VOTING-LIST-ELECTION-2024-26.pdf#page=67) has a matching business entry, with no backlink in that entry. |
| Ahmyz Impex | An [indexed LinkedIn profile](https://pk.linkedin.com/in/ahmyz-impex) was found. An inbound link from that profile to the audited domain was not verified. |
| Delta Craft | No relevant external backlink to the exact audited domain was verified in the checked sample. |

**Ahrefs DR, Semrush Authority Score, and total backlinks and referring domains were unverified for all five competitors.** Public checks did not yield dependable domain-level figures. [Ahrefs DR](https://ahrefs.com/website-authority-checker) and [Semrush Authority Score](https://www.semrush.com/kb/747-authority-score-backlink-scores) are different metrics. The [Ahrefs free DR API](https://docs.ahrefs.com/en/api/reference/public/get-domain-rating-free) requires an account-issued API key. The [Common Crawl web graph](https://data.commoncrawl.org/projects/hyperlinkgraph/cc-main-2026-aug-sep-oct/index.html) measures something different, and comparable figures for these domains were not retrieved. An unverified count does not mean zero.

To complete this part with an existing Ahrefs or Semrush account, export the five competitors and Team Core on the same date and with the same root-domain scope. Export US and UK organic keywords separately, including position, ranking URL, volume and update date. For backlinks, include source and target URLs, anchor text, follow status, first and last seen, and active or lost status. Open relevant source pages before deciding which opportunities to pursue.

## Mobile performance and rendering

One headless Chrome run per homepage used a 390 × 844 viewport without artificial throttling. Juggle Sports showed an LCP of **2.07 seconds** and an initial layout-shift sum of **0.000**. Ahmyz showed an initial LCP of **2.76 seconds** and a layout-shift sum of **0.153**, but was still loading at the time of measurement. ZipaSports and Shazbro returned a browser challenge, Delta Craft encountered a DNS error, and Team Core hit a temporary connection error; timings for those error pages were excluded. These are lab observations, not CrUX field data, Lighthouse scores or a comparative Core Web Vitals assessment. Team Core's separate [technical SEO report](../TEAM-CORE-SEO-20261104.md) records a successful mobile run and the Search Console baseline available at the time.

## Eight-week action plan for Team Core

Team Core already has [custom uniforms](https://teamcoresportswear.org/custom-uniforms), [wholesale](https://teamcoresportswear.org/wholesale), [private label](https://teamcoresportswear.org/private-label), six sport pages, a design studio, a quote basket and a [66-URL sitemap](https://teamcoresportswear.org/sitemap.xml). The previous Search Console checks showed the homepage and three buyer pages as indexed. The saved Performance report was still processing, so there was no usable performance baseline in that snapshot.

| When | What to do | What to measure |
| --- | --- | --- |
| First seven days | Export a 28-day Search Console baseline when data is available. Use `custom team uniforms manufacturer` for `/custom-uniforms`, `wholesale team uniforms` for `/wholesale`, and `private label sportswear manufacturer Sialkot` for `/private-label`. Track quote starts, successful submissions, WhatsApp clicks and design studio opens separately. | Impressions, clicks and CTR by country, device and landing page; submitted and qualified inquiries. |
| Weeks 2–3 | Improve the existing soccer, basketball and ice hockey pages. Target `custom soccer uniforms`, `custom sublimated basketball uniforms` and `custom ice hockey jerseys for teams`. Add actual minimum quantities, lead times, fabrics, size options, artwork requirements, sample policy and delivery details. Pass the sport and design or SKU into the quote form. | Clicks and quote completion by sport page; how often submitted requests include the selected design. |
| Weeks 3–4 | Apply the same treatment to American football, baseball and rugby. Consider a separate `custom 7v7 flag football uniforms` page if Team Core has a distinct range and enough buyer information to justify it. Link it from American football if it is created. | Unbranded search impressions and qualified inquiries for the new or updated pages. |
| Weeks 4–8 | Publish a sizing guide, artwork checklist or permission-based club case study. Seek relevant links from genuine clubs, partners, trade bodies and directories where the content helps their audience. | Relevant referring domains, referral visits and qualified inquiries attributable to those visits. |

Track `quote_start`, successful `quote_submit`, `whatsapp_click` and `design_studio_open` as distinct events. Keep names, phone numbers, email addresses and artwork out of analytics. In the CRM, follow web inquiry → qualified inquiry → quote → won order. A qualified inquiry should identify a real team or brand, the sport or product, the quantity and delivery needs. A WhatsApp click alone is not an inquiry or order. Review the trend after 60–90 days.

Keep Team Core's existing server-rendered HTML, canonicals, sitemap and breadcrumbs. Add structured prices, availability or reviews only when the underlying facts are real, visible and eligible. Create country pages when there is useful country-specific information, such as sizing, shipping, payment terms or examples. See [Google's e-commerce site structure guidance](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure) and [product snippet eligibility](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).

**Supporting evidence:** [HTML and sitemap audit](seo-20261104/crawl.json), [targeted HTTP checks](seo-20261104/targeted-http.json), [search results](seo-20261104/search-sample.json), [browser observations](seo-20261104/rendered.json), and the [original Urdu report](COMPETITOR_ANALYSIS.md). This is an English edition of the existing audit; it does not claim a new crawl or any live site changes.
