# Provera očuvanih funkcija početne i strukturnih ispravki

Datum: 19. novembar 2026. Lokalna nekomitovana verzija, bez objave.

## Važeći kriterijumi

Korisnik je izričito potvrdio da su tri sekcije pune visine sa scroll-snap zaključavanjem i held-drag galerija sa pomeranjem slike unutar kadra NAMERNE FUNKCIJE. Prethodna zamena ovih funkcija prirodnim rastom sekcija i običnim horizontalnim sliderom nije odgovarala zahtevu. Provere su dopunjene da štite traženo ponašanje, umesto da potvrđuju tu zamenu.

- Početna ima tačno tri sekcije visine viewporta: hero, logo galerija i poster galerija. Header pripada prvom ekranu; dokument nema dodatni visinski pojas.
- Vertikalni skrol poravnava početnu na početke sekcija (`y mandatory`). About i Contact zadržavaju uobičajen skrol.
- Donja galerija se pomera dok je klik/touch zadržan, a istovremeno se menja `object-position` slike unutar uskog kadra. Pokreti trake, kadra i indikatora izvode se iz jednog napretka.
- Dodatni semantički naslovi ne menjaju izgled originalnih scena. Pomoćne kontrole galerije prikazuju se pri tastaturnom fokusu.

## Izvršene provere

Izolovan headless Chrome 158.0.8127.36, Playwright Core 1.65.1 i axe-core 4.11.1. Korisnikov aktivni browser nije korišćen. Bez CPU/mrežnog usporenja; DPR 1. Posebno provereni normalan pokret, reduced-motion i simulirani mobilni touch događaji.

Browser suite obuhvata sve tri rute na 320×568, 360×640, 390×844, 480×800, 768×1024, 820×700, 821×700, 900×700, 1024×768, 1440×900, 844×390 i 667×375. Za Work se na svakoj veličini proverava da su sve tri scene tačno visine ekrana, da dokument ima visinu tri ekrana i da je scroll snap obavezan.

Provereni su i:

- Wheel poravnanje na granicu punog ekrana; PageDown/Space, skip link i tastaturni fokus.
- Stvaran mouse held-drag: track transform se menja pre puštanja klika i image crop se istovremeno pomera; drag ne otvara lightbox.
- Regresija prijavljenog native image/link drag-a: 18 gestova iz sredine slike, ivice i praznine, u oba smera, sa horizontalnim, dijagonalnim i prvo vertikalnim početkom miša. Svi moraju pomeriti traku bez browserovog drag-and-drop preuzimanja. Dodatno provereno otkazivanje `dragstart` sa linka, picture omotača i slike. Touch namera vertikalnog skrola proverava se odvojeno od miša.
- Stvarni emulirani touch drag, uključujući prenos pointer capture-a sa slike na scenu.
- Tastaturno pomeranje trake i povratak njenog napretka posle Back/Forward.
- Back/Forward i refresh skrola, normal-motion vidljivost galerije, kontaktni nacrt, čiste i stare rute, metapodaci i brze konkurentne navigacije.
- Dodir/Enter otvaranje slike, Escape, Tab u dijalogu i povratak fokusa.
- Lightbox je ponovo originalni fullscreen overlay: sam dijalog je providan, bez okvira/panela/padding-a, a samo backdrop zatamnjuje stranicu originalnim `rgba(0,0,0,.9)`. Slika staje u 90% viewporta, opis je samo za pomoćne tehnologije i X je nenametljiv. Provereni klik van slike, klik na sliku, X i Escape za zatvaranje.
- Lokalna forma: whitespace provere i simulirani odgovori greške/uspeha bez slanja stvarne poruke.
- Nativna navigacija i linkovi ka slikama bez JavaScript-a; horizontalni scroll je samo no-JS fallback.
- Podrazumevani širi axe audit tri glavne stranice i 404, bez filtera pravila.
- Robots/sitemap, stvarni 404, lokalne reference, image budžet, sintaksa i usklađen zajednički HTML.

Aktuelne rezultate i screenshotove generiše `npm.cmd run qa` u ignorisanom `docs/qa/` folderu. Pokretanje zahteva lokalni server i razvojne zavisnosti (`npm.cmd ci`); `QA_URL` i `CHROME_PATH` podešavaju server/browser.

Vizuelno su pregledani hero na telefonu i desktopu i kadar donje galerije posle prevlačenja. Dokaz ponašanja je stvarna promena transform/object-position, a ne samo prisustvo CSS klase.

## Granice

Ovo nije fizički iOS/Android test sistemske trake, puni screen-reader/WCAG audit ili Lighthouse/Core Web Vitals merenje. Root/safe-area pravila ostaju usklađena. Produkcioni hosting i stvarno Formspree slanje nisu menjani/proveravani ovim prolazom. Nema javne objave.

## Nova About scroll priča

Posle potvrđenog predloga i dostavljenog sadržaja implementirana je isključivo About priča. Namenski `scripts/qa-about.mjs` prolazi 29 grupa provera: sadržaj i očuvani originalni pasusi, portret i social linkovi; layout na 320×568, 390×844, 768×1024, 1024×768, 1440×900 i 844×390; četiri poglavlja, oba smera/brzi skrol, tri obrazovna stanja i njihove progress promenljive; anchor linkovi, Back/Forward, reload dubokog skrola i ponovljene SPA posete; no-JS, reduced-motion i 200% tekst; podrazumevani axe na 390/1440 bez violations. Nema JavaScript izuzetaka ili neuspelih lokalnih resursa. Izveštaji i reprezentativni viewport screenshotovi su u ignorisanom `docs/qa-about/`.

Pokretanje: uz lokalni server i instalirane razvojne zavisnosti, `node scripts/qa-about.mjs`. Isti `QA_URL`, `QA_MODULE_ROOT`, `QA_OUTPUT` i `CHROME_PATH` parametri važe kao za opšti QA. Sintaksa novog modula i test skripte prolazi proveru.

Van About-a upoređeni su izvori početne, njenog CSS-a, zajedničkog CSS-a, router-a, held-drag kontrolera, Contact-a i zajedničkih partiala: sadržaj je identičan početku ovog zadatka. Zajednički `page-effects.js` dobija samo import i uslovno pokretanje novog About modula. Funkcionalno je provereno i da povratak sa About-a zadržava tri VH scene, image pan, popravljeni diagonal mouse drag i providni lightbox.

Pre početka ove dorade postojao je nesklad u opštoj static proveri zajedničkog headera: korisnikova početna ima Work link `/#`, dok partial ima `/`. Taj postojeći izbor nije prepisan ili automatski sinhronizovan. Zbog toga globalni `scripts/check.mjs` i dalje prijavljuje postojeći shared-header nesklad; About shared blokovi su usklađeni, a About-specific provere prolaze.

## Zajednicka scrollbar pravila - 20. novembar 2026.

Po izricito prihvacenom predlogu root scrollbar je skriven na svim rutama, uz scrollbar-gutter:auto. Pravila su premestena u site.css; iz style.css uklonjene su samo duplirane scrollbar deklaracije. Tri Home snap scene i modalni overflow:hidden ostaju kakvi su bili.

Fokusirani QA izvrsen je na http://localhost:5500 uz izolovan headless Chrome 158.0.8127.36, Playwright Core 1.65.1, DPR 1, normalan pokret, bez CPU/mreznog usporenja. Na 1920x910, 1440x900, 390x844 i 844x390 proverene su sve tri direktne rute i ponovljeni SPA prelazi. Ime i navigacija imaju potpuno iste x koordinate na svim rutama svake velicine; na 1920px ime je x=352, navigacija x=1333.03125. Root zauzima ceo viewport i nema rezervisane prazne desne trake. Tri scene i ukupna visina Home-a ostaju tacno jedan, odnosno tri viewporta, a scroll-snap y mandatory.

Prolaze native wheel/PageDown skrol na About-u, Home wheel snap, held-drag sa istovremenim image pan-om, providni backdrop rgba(0,0,0,.9), zabrana skrola dok je lightbox otvoren i povratak na istu scroll poziciju nakon Escape. Nema JavaScript izuzetaka. Vizuelno pregledan Contact na 1920px i 390px: gradient ide do desne ivice. Artefakti su u ignorisanom docs/qa/scrollbar-policy/. Postojeci nesklad Work href-a iz prethodnog zapisa nije menjan. Ovo je lokalna provera, bez objave i bez fizickog telefona.

## Animirani underline navigacije - 20. novembar 2026.

U zajednickom site.css hover i focus-visible underline sada koriste scaleX sa pocetkom u centru, 250ms ease. Aktivni link ostaje podvucen; reduced-motion nema tranziciju. Izolovan headless Chrome: provereni medjustepenovi rasta i skupljanja, centralno poreklo, nepromenjena geometrija linkova, tastaturni fokus/Enter, aktivno stanje nakon SPA prelaza i reduced-motion. Vizuelno pregledani 1440x900 hover i 390x844 aktivni link. Bez JavaScript gresaka. Dokazi su u ignorisanom docs/qa/nav-underline/. Bez drugih izmena funkcija ili objave.

## Obicne crtice - 20. novembar 2026.

Na izricit zahtev zamenjen je em dash obicnom crticom u svim HTML/JS/CSS/MJS izvorima sajta i povezanim QA ocekivanjima (26 pojavljivanja u 11 fajlova; ukljuceni komentari font CSS-a). Postojece interne MD beleske ostaju istorijski zapis. Za svaki izmenjeni fajl potvrdeno je da je jedina razlika trazena zamena znakova. Nema preostalih em dash znakova u navedenim izvorima; servirani Home/About/Contact/404 provereni u izolovanom Chrome-u na localhost:5500. Prolaze node --check za izmenjene JS/MJS fajlove i git diff --check. Druge formulacije sadrzaja nisu menjane; korisnik prvo dobija urednicke predloge.

## Provera urednicke dorade - 20. novembar 2026.

Izmenjeni su samo sadrzaj about/index.html, hero opis u index.html i prethodna QA ocekivanja biografije/tehnologija u scripts/qa-about.mjs. Zastitni pregled potvrdjuje da su omiljeni Web pasus, ceo footer/slogan, postojeci naslovi i SpotHopper pasus identicni pocetku dorade. Contact nije menjan.

Na localhost:5500, izolovan Chrome 158.0.8127.36, DPR 1, bez usporenja, prolazi svih 29 About QA grupa: sest viewporta 320/390/768/1024/1440 i landscape, skrol u oba smera, tri obrazovne etape, brzi prelazi, Back/Forward/reload, ponovljene SPA posete, no-JS, reduced motion, 200% tekst i podrazumevani axe na 390/1440. Nema JS izuzetaka ili neuspelih lokalnih resursa. Vizuelno pregledani novi tehnologije blok na 1440px i obrazovanje na 390px. Prolaze node --check i git diff --check. Dokazi su u ignorisanom docs/qa/copy-refinement/. Nije ponavljan puni audit ostalih funkcija, koje ovom tekstualnom doradom nisu menjane. Postojeci shared-header Work href nesklad ostaje izvan obima.

## Prihvaceni About naslovi - 20. novembar 2026.

Posle prihvacenog predloga zamenjena su samo cetiri naslova: My background, Work experience, Python scripts & Docker, Languages & tools. Learning how things work. ostaje. Potvrdjeno je da su to jedine cetiri izmene About HTML-a u ovom koraku. U izolovanom Chrome-u provereni su svi naslovi i odsustvo horizontalnog overflow-a na 1440x900 i 390x844; git diff --check prolazi. Efekat baloncica ostaje ogranicen na Home hero dok traje razgovor o mogucem sirenju.

## Naznaka prevlacenja poster galerije - 20. novembar 2026.

Izmenjeni su poster-gallery.js i thumb transform u style.css: jedan nasledjeni CSS offset pomera track i thumb u suprotnim smerovima, a shown/target/dataset/object-position ostaju van uvodne animacije. Finalni profil je1500ms sa jednim blagim odlaskom i povratkom, maksimalno24px desktop /15.6px na390px telefonu. Input, kontrole, restore, izlazak, reduced-motion, hidden i cleanup otkazuju offset. Wheel inercija resetuje samo jos nezapoceto cekanje, a resize tokom cekanja ponovo zakazuje hint.

Opsti regresioni suite prolazi58/58 grupa na localhost:5500, izolovan Chrome158/Playwright1.65.1, DPR1, bez usporenja. Pokriveni su tri VH scene/snap, mouse/touch held-drag i image pan,18 kombinacija native drag regresije, keyboard, history, forma sa simuliranim odgovorima bez stvarnog slanja, lightbox i svi podrazumevani axe audit-i. Postojeca opsta axe provera je stabilizovana da ceka zavrsetak konacnih CSS tranzicija: prethodno je merila About tekst usred fade-a i davala prolazan contrast nalaz. Boje nisu menjane i nijedno axe pravilo nije iskljuceno.

Fokusirana provera pre poslednjeg doterivanja profila prolazi20/20 grupa: fizicki smerovi, povratak na nulu, nema poster-change dogadjaja za hint, nema ponavljanja na drugom ulasku, mouse/touch prekid sa ispravnim crop-om, keyboard/restore, aktivna otkazivanja, stvaran wheel ulazak i resize tokom180ms cekanja. Originalna greska test-harness-a koja pokusava pointer klik na namenski skrivenu kontrolu sacuvana je uz ispravnu ponovljenu proveru fokus+Enter. Posle poslednjeg korisnickog zahteva ponovljene su ciljane provere sporijeg profila i suprotnih smerova:5/5 prolazi, sa24px desktop /15.6px telefon, jednim mirnim pokretom od1500ms i kratkom pauzom od120ms. Izvestaj je u evidence/refined artefaktima.

Sintaksa i git diff --check prolaze. Artefakti su u ignorisanom docs/qa/poster-entry/. Touch i hidden uslovi su emulirani (hidden getter/event), bez fizickog telefona ili preuzimanja korisnikovog aktivnog browsera. Nema javne objave.

## Dva odskoka prema primeru sa loptom - 20. novembar 2026.

Na nov zahtev promenjen je samo profil offset-a u poster-gallery.js:36px/6vw,1100ms, dva paraboliska odskoka sa drugim vrhom25%prvog. Posteri idu ulevo, tacka udesno. Princip je proveren u primarnom GSAP CustomBounce primeru endAtStart: https://gsap.com/docs/v3/Eases/CustomBounce/. Nema dodate biblioteke ili promene postoje?eg drag smoothing-a.

Fokusirana provera5/5 prolazi: na1440/390 merena su dva opadajuca vrha, ispravni suprotni smerovi, povratak offset-a na0 i isto crop/progress stanje, bez poster-change dogadjaja i ponavljanja na drugom ulasku. Drag odmah prekida hint i zadrzava image pan; reduced-motion ga preskace; nema JS gresaka. Opsti58/58 i prethodne lifecycle/restore provere ostaju zapis prethodne funkcionalno iste implementacije; nakon ove promene samo krive ponovljene su ciljane provere. Sintaksa i git diff --check prolaze. Finalni dokazi su u docs/qa/poster-entry/evidence/ball-bounce/.

## Hero CTA sa kruznom strelicom - 20. novembar 2026.

Izmenjeni su samo CTA markup u index.html i lokalni hero CTA stilovi u style.css, uz reduced-motion pravila. Nema novog JS-a. Aktuelni hero tekst, href i ostale funkcije su sacuvani. Izolovan Chrome158, DPR1, bez usporenja: provereni320x568,390x844,1440x900 i844x390, click target najmanje44px, odsustvo horizontalnog overflow-a,200%tekst na320px i geometrija tri pune Home scene. Hover pokazuje medjustanje izlazne/ulazne SVG strelice, ljubicastu ispunu i potpuno istu geometriju linka/teksta pre i posle. Fokus tastaturom ima vidljiv outline; Enter i direktan klik na krug otvaraju Contact kroz SPA. Reduced-motion nema pomeranja strelice i prikazuje samo jednu dekorativnu ikonu. Nema JS gresaka; git diff --check prolazi. Vizuelno pregledani1440px hover i390px normalan prikaz. Dokazi su u docs/qa/hero-cta/. Puni regresioni audit nije ponavljan za ovu ciljanu vizuelnu izmenu.

## Hero CTA prema skici - 20. novembar 2026.

index.html i style.css sada koriste jednu dugu SVG strelicu i nezavisan CSS obroc, bez ispune/klipovanja. Hover/focus pomera strelicu za62%precnikakruga, smanjuje obroc na84% i vrhom prelazi njegov desni rub. Rezervisan prostor cuva iste dimenzije CTA-a i labelu;550ms transform easing cubic-bezier(.22,1,.36,1). Fleks prelama dekoraciju kada200%tekst to zahteva. Vizuelno istrazivanje: Codrops MagneticButtons (https://github.com/codrops/MagneticButtons) i korisnikova skica; nije dodata biblioteka.

Izolovan Chrome158, DPR1, localhost:5500:4viewporta320x568,390x844,1440x900,844x390. Proverena jedna dekorativna strelica, normalni vrh blizu centra kruga i rep izvan levog ruba, hover vrh izvan desnog ruba uz ravnu centriranu liniju, bez promene tekst/link geometrije i bez horizontalnog overflow-a. Sva tri Home ekrana ostaju iste pune visine. Prolaze200%tekst, Enter sa fokusom, klik na vizuelni detalj i mobilni tap ka Contact-u. Reduced-motion cuva geometriju i nema tranzicije. Nema JS gresaka; git diff --check prolazi. Vizuelno uporedjeni1440px normal/hover i390px normal. Artefakti:docs/qa/hero-cta-outline/. Nema drugih izmena sadrzaja, href-a ili galerijskih kontrolera.

## Duzi poster drag i veci CTA razmak -20.novembar2026.

Izmenjena su samo dva izvora: tri CTA geometrijske vrednosti u style.css i distance za pointer gesture u poster-gallery.js. CTA normalni oblik ostaje na istoj poziciji. Na1440px hover-u izmeren razmak cele glave strelice od kruga17.17px (vrh24.6px). Prolaze cetiri viewporta320/390/1440/844landscape,200%tekst, stabilna labela/bounds, ispravno smanjenje kruga, vidljiv fokus, Enter/klik/touch navigacija na Contact, reduced-motion i tri pune Home scene. Vizuelno pregledan novi hover.

Fokusirana provera galerije koristi stvarne mouse i CDP touch poteze, proverava isti100px potez, reverse/regrab i dostupnost krajeva, sinhronizaciju object-position/indikatora, native drag i lightbox zastitu, vertikalni touch snap, tastaturu i Back/Forward restore. Svi zabelezeni checks prolaze; tacni rezultati su u docs/qa/control-tuning/. Izolovan Chrome158/Playwright1.65.1, localhost:5500, DPR1 bez usporenja; touch je emuliran. Ne menja se entry bounce niti brzina interpolacije, vec samo potreban put prsta/misa. Sintaksa i git diff --check prolaze; nema objave ili stvarnog slanja forme.

## Media query pragovi u px - 20. novembar 2026.

Zamenjeni su samo rem brojevi u devet dimenzijskih media-query uslova cetiri CSS fajla. Osam min-width uslova ostaje istog smera i redosleda; jedan min-height uslov postaje 768px. Cetiri reduced-motion uslova ostaju ista.

Pre i posle konverzije snimljeno je 36 CSSOM/layout stanja u izolovanom Chrome-u na localhost:5500, DPR 1 i reduced-motion, sa podrazumevanom font osnovom 16px: sve tri rute na 480/481, 575/576, 767/768, 820/821, 1023/1024px; dodatno sticky granica visine 767/768px pri sirini1024px. MQL matches, header font/gap, galerijske kolone, dimenzije postera, About kolone/rail/type/sticky i Contact kolone potpuno su identicni osnovnom snimku. Nema horizontalnog overflow-a ili JS izuzetaka; git diff --check prolazi. Dokazi su u docs/qa/px-breakpoints/. Korisnicki povecana pocetna font osnova sada ne pomera px pragove; to je ocekivana semanticka razlika od rem.

Izvori za preporuku pristupa: https://web.dev/articles/responsive-web-design-basics#how_to_choose_breakpoints i https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries . Nije ponavljan funkcionalni audit neizmenjenog JavaScript-a.

## Android Chrome scroll-snap trzaj - 21. novembar 2026.

Korisnik prijavio trzaj na fizickom Android/Chrome-u na miloskrunic.com. Read-only javni fetch potvrdio iste style.css/router.js/poster-gallery.js izvore kao lokalni. Router ne vraca scroll tokom redovnog skrola/resize-a; restore pozivi su vezani za navigaciju. Problematicna geometrija je bila100dvh uz y mandatory.

U kontrolisanom browser modelu sa odvojenim malim/velikim viewport merama dinamicka visina700->800px pomerala je granicu druge scene i nativni scrollY700->800, pri povratku i nazad. Novi100lvh ostaje800px i scrollY800 tokom iste promene; tri granice su stabilne. Model koristi samo QA CSS promenljive kroz presretnut stylesheet, nisu dodate u produkcioni kod i ne predstavlja fizicku Android toolbar emulaciju. Dodatne provere prolaze za tri scene na390/700/800,320/480/568 i844/330/390: isti stops/fonts pri promeni dinamicke vrednosti, vidljiv scroll cue, bez horizontalnog overflow-a. Stvarna emulirana promena orijentacije390x844<->844x390 zadrzava aktivnu drugu scenu. Vizuelno pregledani portrait/landscape hero sa rezervisanim prostorom browser trake.

Opsti suite58/58 prolazi na lokalnom4173 serveru, Chrome158.0.8127.36, Playwright1.65.1, DPR1, bez CPU/mreznog usporenja. Ukljuceni native scroll-snap, held-drag i object-position,18native-drag gestova, touch, history/reload, CTA, lightbox, forma sa presretnutim zahtevima bez stvarnog slanja i podrazumevani axe. git diff --check prolazi. Jedini promenjeni produkcioni fajl je style.css. Dokazi:docs/qa/mobile-snap/. Nema commita/pusha ili fizicke potvrde poboljsanja; Android telefon treba proveriti nakon objave.

Primarni izvori: https://web.dev/blog/viewport-units i https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type .

## Ravna About navigacija sa lenjirom - 21. novembar 2026.

Izmenjeni produkcioni izvori: about/index.html, about.css, about-story.js. Lokalni staticki sajt na http://127.0.0.1:4173/about/, izolovan Chrome158.0.8127.36 / Playwright1.65.1, DPR1, bez CPU/mreznog usporenja. About suite prolazi29/29 na320x568,390x844,768x1024,1024x768,1440x900 i844x390: sadrzaj, oba smera skrola, tri obrazovne etape, sidra/Back/Forward/reload, ponovljeni SPA ulasci, no-JS, reduced-motion,200%tekst i podrazumevani axe na390/1440px. Vizuelno pregledani390px i1440px prikazi ravne putanje sa crticama.

Fokusirana provera390x844,1440x900 i844x390 potvrdjuje ravan i nepromenljiv oblik pri skrolu u oba smera, pomeranje ljubicaste obojenosti unutar istog poglavlja, odsustvo blur-a/glow-a/senke/skaliranja tacaka,1px potez, poravnanje cetiri tacke sa putanjom ispod1px odstupanja, celu sticky navigaciju u prozoru, najmanje44px mete, Enter/emulirani tap, promenu reduced-motion u radu i miran SVG bez unosa. node --check about-story.js i git diff --check prolaze. Dokazi:docs/qa/about-ruler/results.json, ruler-interaction.json i screenshotovi. Fizicki telefon i performanse na njemu nisu mereni. Desni timeline, tekstovi, Home i Contact nisu menjani. Nema commita/pusha/deploy-a ni slanja forme.

## Android Chrome: Home header i About pozadina - 21. novembar 2026.

Osnova HEAD2339aac sa prihvacenim About lenjirom. Jedini izmenjeni produkcioni fajlovi su site.css i style.css. Prethodni apsolutni header ostaje na svom mestu; nema novog sticky headera, wrappera ni JS scroll korektora. Hero dobija scroll-margin-block-end:calc(100svh - 100lvh). Kontrolisani model800px scene /700px prozora pre izmene dozvoljava scrollY100 pri povratku, header top-100. Sa smanjenom snap oblasti isti zahtev zavrsava na scrollY0 i header top0; scene ostaju0/800/1600 i ukupno2400px. Ovo je ponovljeno za390/700/800,320/480/568 i844/330/390, sa jednim emuliranim CDP touch potezom iz druge u prvu scenu, uspeh na sva tri modela.

Pozadina body::before dobija100lvh uz100vh fallback i translateZ(0), umesto automatske visine po inset0. U144 kontrolisana uzorka brzih skokova skrola i promene viewporta mala/velika visina njen sloj pokriva ceo prozor. Ponovljena tri SPA About/Work ulaska po modelu, bez dupliranja headera i JS gresaka. Vizuelno pregledani320/390px Home povratak i390px About dno. Model odvaja male/velike CSS viewport jedinice samo u QA presretnutom stylesheet-u; ne emulira fizicku Android Chrome compositor/toolbar animaciju. Uzrok crnog pojasa nije direktno snimljen na fizickom uredjaju posle korekcije; to ostaje potrebna potvrda nakon objave.

Opsti lokalni suite58/58 prolazi na http://127.0.0.1:4173, izolovan Chrome158.0.8127.36 / Playwright1.65.1, DPR1, bez CPU/mreznog usporenja. Pokriveni layout svih ruta, snap, drag/pan, touch, history/reload/SPA, no-JS,200%tekst, CTA, lightbox, default axe i forma sa presretnutim zahtevima bez stvarnog slanja. git diff --check prolazi. Dokazi:docs/qa/mobile-chrome/standard/results.json, checks.json, snap-area.json i screenshotovi. Nema commita/pusha/deploy-a.

Oslonci za snap oblast i prevelike scene: https://www.w3.org/TR/css-scroll-snap-1/#scroll-margin i https://www.w3.org/TR/css-scroll-snap-1/#snap-overflow .
