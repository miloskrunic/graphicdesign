# Miloš Krunić — portfolio

Statički HTML/CSS/JavaScript portfolio sa SPA navigacijom. Nema framework-a, produkcionih npm zavisnosti ili obaveznog build koraka.

## Pokretanje

Node.js 22.12 ili noviji podržani LTS:

```powershell
node scripts/serve.mjs
```

Otvori http://127.0.0.1:4173. `npm.cmd run dev` pokreće isti server. Za drugi port postavi `PORT`. Koristi HTTP server umesto `file://` otvaranja jer navigacija koristi ES module i Fetch API.

## Organizacija

- `index.html`, `about/index.html`, `contact/index.html`: pravi statički dokumenti ruta `/`, `/about/`, `/contact/`.
- `site.css`: zajednički tokeni, root pozadina, fontovski sistem, header, fokus, safe-area i osnovna semantika.
- `style.css`, `about.css`, `contact.css`: samo stilovi odgovarajuće stranice; mobile-first pravila bez prepisanih kopija navigacije.
- `partials/head.html`, `partials/header.html`: jedini izvori zajedničkog HTML-a.
- `router.js`: SPA promene, metapodaci, istorija, čuvanje skrola i lokalnog nacrta kontaktne forme u okviru taba.
- `page-effects.js`: galerije, modalni pregled, otkrivanje sadržaja, cursor čestice i kontaktna forma sa gašenjem efekata pri odlasku.
- `poster-gallery.js`: originalna held-drag traka, istovremeni image pan/object-position i indikator iz jednog animacionog stanja.
- `about-story.js`: scroll rail biografije, aktivno poglavlje, tri obrazovne etape i diskretni ulazni prelazi; efekti su ograničeni na About.
- `assets/images`: responsive WebP verzije korisnikovih originalnih slika i manifest.
- `assets/fonts`: lokalni WOFF2 fontovi, precizni Latin/Latin Extended podskupovi i OFL licence.
- `docs`: dogovor, izvori i rezultati provera. Generisani `docs/qa/` artefakti su ignorisani u Gitu.

Sadržaj se menja u HTML fajlovima odgovarajućih stranica. Posle izmene zajedničkog head/header izvora pokreni:

```powershell
node scripts/sync-shared.mjs
node scripts/check.mjs
```

Zajednički blokovi između `shared:*` markera su generisane kopije. Ostali delovi HTML-a ostaju izvor sadržaja. `check` proverava da su kopije usklađene, da lokalne reference postoje i da osnovna struktura prolazi proveru.

## Ponašanje

Početna namerno ima tačno tri scene visine celog ekrana, sa `scroll-snap-type:y mandatory`. Na telefonu se koriste dinamičke viewport jedinice; header pripada prvom ekranu, pa ukupna visina ostaje tri ekrana. About i Contact skroluju uobičajeno. Ne uklanjati ovu kompoziciju tokom refaktorisanja.

Donja galerija vraća originalni efekat: držanje klika i prevlačenje pomeraju celu traku, a slike se istovremeno pomeraju unutar uskih kadrova. Track transform, object-position i indikator dele isti prikazani napredak. Prevlačenje radi i dodirom; tastatura ima dodatne kontrole. Bez JavaScript-a ostaje horizontalni scroll kao fallback. Sekcijski naslovi ostaju semantički dostupni bez dodavanja novih velikih natpisa u originalnu kompoziciju.

Interne navigacije ažuriraju sadržaj bez novog dokumenta; Back/Forward vraća skrol i nacrt forme. Refresh vraća sačuvano stanje trenutne history stavke. Stari `.html` linkovi vode na čiste rute. Novi tabovi i spoljašnji linkovi zadržavaju nativno ponašanje. Bez JavaScript-a navigacija radi standardno, a radovi su linkovi ka slikama pune veličine. Neuspešan SPA fetch koristi standardnu navigaciju kao fallback.

Kontakt zadržava postojeći Formspree endpoint. Sa JavaScript-om prikazuje stvarni odgovor uspeha/greške i sprečava dvostruko slanje. Bez JavaScript-a ostaje nativni POST obrazac. Nacrt se ne šalje tokom SPA navigacije i ne čuva se u lokalnom storage-u; čuva ga stanje tekućeg taba/istorije. Uspešno slanje briše nacrt.

## Razvojni alati i provere

Za browser QA i ponovnu optimizaciju slika instaliraj razvojne zavisnosti:

```powershell
npm.cmd ci
npm.cmd run qa
npm.cmd run images
```

Nova About priča ima i namensku proveru: `node scripts/qa-about.mjs`, sa rezultatima u `docs/qa-about/`.

QA očekuje instaliran Chrome; `CHROME_PATH` podešava drugi izvršni fajl. `QA_URL` podešava URL lokalnog servera. Test koristi zaseban headless browser i simulira odgovore kontaktne forme, bez slanja stvarnih poruka. Izveštaji i screenshotovi nastaju u `docs/qa/`.

`images` pravi WebP varijante od originala u korenu i ažurira manifest. Pri zameni izvornog materijala uskladi i pripadajuće HTML `srcset`, dimenzije, alt tekst i preview odredište. Originali ostaju sačuvani. Sharp, Playwright Core i axe-core su razvojni alati; sajt ih ne učitava kod posetioca.

## Hosting

Objavljuju se statički HTML/CSS/JS, `assets/`, favicon, preview, `CNAME`, `404.html`, robots i sitemap. Sajt služi koren domena `miloskrunic.com`; hosting u podfolderu zahteva izmenu osnovnih putanja. Za postojeće rute nije potreban SPA rewrite, a nepoznate rute treba da dobiju pravi HTTP 404.

Lokalna implementacija ne objavljuje sajt. Boja mobilnih sistemskih traka i ponašanje safe-area prostora proveravaju se i na stvarnom telefonu posle pregleda lokalne/javne verzije.
