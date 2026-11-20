# Vizuali i fontovi

Datum: 19. novembar 2026.

Izvorne logo slike `1.jpg`–`6.jpg`, posteri `11.jpg`–`66.jpg`, portret `myself1.png`, favicon i social preview potiču iz korisnikovog postojećeg repozitorijuma. Nisu dodavane nove fotografije niti menjani sami radovi.

`scripts/optimize-images.mjs` iz originala pravi lokalne responsive WebP varijante (320/640/960 px i veća varijanta do 1600 px prema stvarnim dimenzijama izvora), bez povećavanja manjih slika. Sharp kvalitet je 84; dimenzije i veličine datoteka beleži `assets/images/manifest.json`. Originalni fajlovi su očuvani.

Galerijski originali ukupno imaju 6.428.072 bajta. Zbir varijanti širine 640 px iznosi 1.158.408 bajtova, oko 82% manje. To je poređenje fajlova iste grupe, a ne merenje brzine stranice ili tvrdnja o Lighthouse rezultatu. Browser bira varijantu prema ekranu/DPR-u, a slike ispod prvog ekrana koriste lazy loading.

Postojeće porodice Montserrat i League Spartan preuzete su iz [Google Fonts CSS API-ja](https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&family=League+Spartan:wght@100..900&display=swap). Lokalno se služe Latin i Latin Extended WOFF2 podskupovi sa originalnim `unicode-range`, promenljivim težinama i `font-display:swap`.

OFL licence su uz fontove u `assets/fonts/`. Izvori licenci: [Montserrat](https://github.com/google/fonts/blob/main/ofl/montserrat/OFL.txt), [League Spartan](https://github.com/google/fonts/blob/main/ofl/leaguespartan/OFL.txt). FontAwesome stylesheet zamenjen je malim inline SVG ikonama društvenih mreža.
