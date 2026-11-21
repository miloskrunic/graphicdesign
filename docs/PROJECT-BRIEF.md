# Portfolio — navigacija i ispravke posle audita

Datum: 19. novembar 2026. Status: odobrena lokalna implementacija i QA; bez objave.

Korisnik je prvo odobrio čiste URL adrese i SPA navigaciju, zatim zatražio pregled celog koda bez izmena. Posle izveštaja odobrio je ispravku svih navedenih nalaza, uklanjanje CSS viškova/grešaka i sređivanje media query-ja.

## Potvrđen pravac

- Zadržati čist HTML/CSS/JavaScript i statičke rute. Bez migracije u Astro ili drugi framework.
- Očuvati tamnu/ljubičastu osnovu, Montserrat/League Spartan, beli prostor logo galerije, crnu poster galeriju i korisnikove radove.
- Čiste rute `/`, `/about/`, `/contact/`; stari HTML URL-ovi ostaju upotrebljivi.
- Korisnikova naknadna izričita korekcija: početna namerno ima tačno TRI SEKCIJE pune visine ekrana (100vh / 100lvh, stabilno pri promeni browser traka), sa obaveznim scroll-snap poravnavanjem. To je ključna funkcija dizajna i ne sme se ukloniti u ime čišćenja CSS-a.
- Donja galerija namerno koristi held-drag: pomera se cela traka, a slike istovremeno klize unutar uskih kadrova (object-position/paralaks). Očuvati oba kretanja, proporcije kadrova i indikator.
- Ujednačiti root pozadinu, mobilne ivice i navigaciju uz očuvanje tih funkcija. About/Contact imaju uobičajen rast sadržaja.
- Ispraviti SPA povratak, skrol nakon refresh-a, vidljivost vraćenih galerija i očuvanje započete kontaktne forme.
- Ispraviti heading strukturu, landmark-e, skip link, tastaturu/dodir, modalni fokus, kontrast i formu.
- Optimizovati slike, lokalno posluživati postojeće fontove uz licence i ujednačiti social metapodatke, robots i sitemap.

## Realizacija i odluke

Jedan zajednički `site.css` i izvori `partials/head.html` / `partials/header.html`. Generisane kopije zajedničkih HTML blokova održava mali Node script, bez framework-a i bez obaveznog produkcionog build-a. CSS stranica sadrži samo lokalne komponente i nekoliko smislenih media query-ja.

Početna koristi document scroll sa obaveznim poravnavanjem tri scene pune visine; header vizuelno pripada prvom ekranu i ne dodaje četvrtu visinsku zonu. About i Contact skroluju uobičajeno. Poster traka je ponovo transformisana held-drag scena sa sinhronizovanim pomeranjem slike unutar kadra. Native horizontalni overflow je samo fallback kada nema JavaScript-a, a ne zamena za traženi efekat. Galerijski linkovi i dalje imaju put do slike pune veličine bez JS-a.

Zajednička root/sistemska boja je `#141414`, uz prepoznatljiv ljubičasti gradient i `viewport-fit=cover` / safe-area razmake. Prikaz fizičke telefonske sistemske trake nije dokazan desktop emulacijom.

Forma ostaje povezana sa postojećim Formspree endpoint-om; ime, prezime, email i poruka su obavezni. Polja imaju autocomplete i proveru praznina. Nacrt se čuva u tekućem tabu/history stanju i briše posle uspešnog odgovora servisa. Slanje je lokalno provereno isključivo presretanjem zahteva i simuliranim odgovorima.

`CNAME` navodi `miloskrunic.com`; domena je izvor canonical/social/sitemap adresa. Podešavanja aktivnog produkcionog hostinga nisu menjana. QA zapis je u `docs/QA.md`.

## Odobrena nova About priča

Korisnik je prvo tražio dogovor pre izrade, zatim prihvatio predlog scroll priče i dao konkretan sadržaj. Zadržavaju se Biography naslov, tri postojeća bio pasusa, ista fotografija i društvene ikonice na dnu, postojeći fontovi, pozadina i paleta (posebno ljubičasta i off-white tekst). Ovaj obim se odnosi na About; izgled i ponašanje početne, uključujući tri VH sekcije, held-drag i lightbox, ostaju van promene.

About dobija poglavlja My story / Education / Experience / Technologies povezana vertikalnim pokazivačem skrola. Obrazovanje ima tri etape i sticky naslov na ekranu koji ima dovoljno prostora; na telefonu i niskom ekranu sadržaj je u običnom toku. Animacije prate stvarni skrol i poštuju reduced-motion; bez JS-a sav tekst ostaje dostupan.

Potvrđene činjenice: osnovna samo Andra Savčić, Valjevo; srednja tehnička, mehatronika; FTN Novi Sad, mehatronika, robotika i automatizacija, studije i dalje traju. Roboti, embedded i niži nivoi programiranja uz C/C# uvod su u potragu za vizuelnim izrazom; web je spoj logike i dizajna. SpotHopper od avgusta 2025, HTML/CSS/JavaScript/GSAP u svakodnevnom radu; automatizacija od juna 2026 uz Python i Docker. Korisnik dozvoljava autorske dopunske pasuse o aktivnom učenju i usavršavanju. Ne navoditi preostale ispite, datum diplomiranja, izmišljenu titulu, metrike ili naziv osnovne/srednje ustanove izvan dostavljenih činjenica.

## Odobrena urednicka dorada - 20. novembar 2026.

Korisnik je odobrio jednostavniji jezik i uklanjanje klisea iz originalne biografije, skracivanje apstraktnih fraza i ponavljanja, kao i brisanje generickih pasusa o usavrsavanju. Ostaju slogan Always learning. Always building., kontaktni uvod i doslovan Web development became the ideal meeting point between those interests... pasus. Home uvod je konkretniji. Fakultet sada ukljucuje C za robotiku/embedded, C# za neuronske mreze i Unity, i osnove Pythona. Dodati TypeScript, PHP i iskustvo sa MySQL bazama medju opste tehnologije, bez pripisivanja tih alata konkretnom poslu. Automatizacija ostaje kratko opisana Python skriptama i Docker okruzenjima. Naknadno su prihvaceni i primenjeni naslovi My background, Work experience, Python scripts & Docker i Languages & tools. Learning how things work. ostaje. Pozadina, boje, fotografija, ikonice, CSS/JS interakcije i struktura navigacije ostaju van ove dorade.

## Naznaka prevlacenja poster galerije - 20. novembar 2026.

Odobrena je diskretna animacija pri prvom ulasku u trecu scenu: posteri klize ulevo, indikator udesno, pa se vracaju na pocetni polozaj. Poslednji korisnicki zahtev: prepoznatljiv odskok kao lopta od poda, sa dva sve manja odskoka. Aktuelni profil je1100ms i najveci pomak36px ili6vw. Prvi paraboliski luk zauzima2/3vremena; drugi1/3vremena i1/4amplitude, uz isto ubrzanje i50%preostale brzine posle udara. Pokret je inspirisan GSAP CustomBounce primerom sa endAtStart (https://gsap.com/docs/v3/Eases/CustomBounce/); koristi mali lokalni proracun bez nove zavisnosti. Aktivira se kada je sekcija najmanje85% vidljiva,180ms nakon smirivanja vertikalnog skrola. Jednom po montiranju pre prve interakcije, bez petlje. Restore nenultog progress-a ne pokrece uvodnu naznaku. Drag, image pan, snap, tastatura i lightbox ostaju funkcionalni.

## Hero CTA - 20. novembar 2026.

Aktuelni Get In Touch CTA prati korisnikovu skicu: duga tanka strelica ulazi u kruzni obroc izvan njegove leve ivice. Na hover/focus jedna ista strelica klizi udesno, vrhom izlazi iz kruga, a obroc se blago smanjuje na84% i dobija ljubicast akcenat. Nema pune pozadine ili zamene dve strelice. Pokret traje550ms, sa mekim smirivanjem. Tekst i spoljne dimenzije ostaju mirni; reduced-motion menja samo akcenat. Dekoracija je jedan lokalni SVG i CSS. Pregledani su Codrops MagneticButtons primeri (https://github.com/codrops/MagneticButtons), uz sopstvenu realizaciju prema skici.

## Osetljivost galerije i CTA razmak -20.novembar2026.

Korisnik trazi umereno duzi potez za celu poster galeriju, sa izrazenijim smanjenjem touch osetljivosti. Realizacija zamrzava distance=innerWidth*(touch?0.95:0.7) na pocetku gesta; priroda held-draga, pan slika, smer indikatora,160ms sustizanje, tastatura i1100ms dvostruki entry bounce ostaju isti. CTA hover sada jasnije izvlaci celu glavu strelice izvan oboda: pomeraj0.9precnikakruga, uz prostor2.6precnikakruga i ocuvan polozaj kruga u mirovanju.

## Citljivi breakpoint-i - 20. novembar 2026.

Na izricit zahtev svi dimenzijski media-query uslovi pretvoreni su iz rem u px po osnovi 16px: ukupno osam blokova i devet uslova u site.css, style.css, about.css i contact.css. Zadrzani su isti numericki pragovi pri toj osnovi i postojeci uzlazni min-width pristup. Fontovi i razmaci nisu deo ove promene. Preporuka min-width zasnovana je na vec postojecoj mobilnoj osnovi CSS-a i javnim Google/MDN smernicama; max-width ostaje validan za ciljane izuzetke, bez planiranog prepisivanja kaskade.

## Stabilna Home geometrija na telefonu - 21. novembar 2026.

Prijavljeni Android Chrome trzaj resava se uklanjanjem dinamicne dvh geometrije iz tri Home snap scene. Koriste100lvh sa100vh fallback-om, pa Chrome toolbar ne pomera granice tokom gesta. Hero padding i scroll cue uzimaju u obzir stabilnu razliku velikog i malog viewporta da ostanu dostupni sa otvorenom browser trakom. Pratece visinske proporcije koriste lvh. Modal zadrzava90dvh da slika staje u stvarno vidljiv prozor. Obavezni native snap, tri scene, svi efekti/drag i ostale rute ostaju u istom obimu. Izmena je lokalna, bez commita/pusha; fizicki uredjaj treba ponovo proveriti posle objave.

## Leva About navigacija - 21. novembar 2026.

Konacan odobreni pravac kombinuje tacke za cetiri poglavlja sa ravnim vertikalnim lenjirom. Tanka prava linija i kratke poprecne crtice ostaju mirne; priguseni ljubicasti deo prati skrol. Aktivna tacka i naziv oznacavaju poglavlje. Prethodna magla, glow i vijuganje su odbijeni i uklonjeni. Nema numerisanih oboda, blur-a, bele svetle zone ili skaliranja tacaka. Telefon cuva usku kolonu i pristupacne nazive, sa visinom do320px; desktop prikazuje nazive uz lenjir i do360px visine. Visina je ogranicena raspolozivim prozorom. Cetiri linka, postojeci scroll model, desna skolska vremenska linija i sav sadrzaj ostaju isti. Bez nove biblioteke ili stalne animacione petlje. Lokalno, bez objave.

## Mobilni Home povratak i pokrivanje pozadine - 21. novembar 2026.

Dve ciljane CSS korekcije: hero snap oblast smanjena je za razliku velikog i malog viewporta (scroll-margin-block-end), uz nepromenjene tri100lvh scene. Povratak iz druge scene sada cilja sam vrh hero/headera umesto pozicije unutar prevelike snap oblasti. Zajednicka fiksna gradient pozadina dobija stabilnu veliku viewport visinu i svoj sloj kako bi pokrivala ekran dok Chrome sklanja kontrole. Originalni header polozaj, tekstovi, galerije, CTA, About lenjir i sve JS funkcije ostaju isti. Izmenjeni su samo site.css i style.css; lokalno bez commita/pusha/deploy-a.

## Citljiv napredak About lenjira - 21. novembar 2026.

Na prijavu slabe vidljivosti na telefonu odobrena je funkcionalna dorada postojeceg ravnog lenjira. Predjeni put je2px puna akcent ljubicasta, sa postepenim naglasavanjem nekoliko susednih crtica na tacnoj poziciji skrola (korisnikov izbor3; poseban marker je odbijen i uklonjen). Aktivna tacka je8px, ostale5px; predjene tacke dobijaju akcent boju. Crtice i buduci deo imaju bolji kontrast. CSS fill i naglasene crtice koriste isto kontinuirano stanje kao poglavlja; uklonjen je prethodni SVG gradient. Bez svetleceg efekta, promene oblika, nove biblioteke ili izmene sadrzaja/desnog timeline-a/drugih ruta.

## Uvod biografije i tehnologije - 21. novembar 2026.

Uvod glasi samo: I'm a front-end developer and graphic designer working at SpotHopper. Prica o fotografiji je ispod My background; recenica o minimalizmu, bold symbols i strong colour combinations je uklonjena. JavaScript / TypeScript su jedan red. Databases je ispod Automation u desnoj desktop koloni, uz isti mobilni redosled. Ostali tekstovi ostaju isti.

## SpotHopper hijerarhija i dopuna biografije - 21. novembar 2026.

Python/Docker automatizacija od juna2026 nalazi se kao h4 podnaslov unutar istog SpotHopper posla od avgusta2025. Nema druge firme ili zasebnog job unosa. Uvod je na naknadni zahtev prosiren na tri recenice uz prihvacenu prvu. My background sada objasnjava vezu porodicne fotografije i kasnijeg rada na kompoziciji/rasporedu u grafickom dizajnu. Ovo zamenjuje prethodnu kratku varijantu uvoda; ostali biografski podaci, lenjir i druge rute ostaju isti.
