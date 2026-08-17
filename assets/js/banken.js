/* ---------------------------------------------------------------------------
   ESTERA — Banken-Leiste

   Dieselbe Mechanik wie bei den Google-Rezensionen, aber eigenstaendig:
   die Spur wird geklont, die Bewegung laeuft von translateX(-50%) auf 0,
   der Weg entspricht exakt einer Spurbreite. Weil Original und Klon
   identisch sind, sieht das Bild am Umschlagpunkt genauso aus wie am
   Anfang — an der Naht springt nichts.

   Ein Unterschied zu den Rezensionen: Logos sind schmal. Fuenf Stueck
   ergeben eine Spur, die auf breiten Fenstern kuerzer ist als das Band.
   Dann waere bei translateX(0) rechts eine Luecke. Deshalb wird die
   Logofolge zuerst so oft wiederholt, bis eine Spur mindestens die
   Bandbreite erreicht; erst danach wird geklont.

   Die Wiederholungen und der Klon sind reine Optik. Sie tragen dieselben
   Bildbeschreibungen und wuerden von Screenreadern mehrfach vorgelesen —
   deshalb aria-hidden und leeres alt.

   Ohne Javascript bleibt die Reihe stehen und ist seitlich scrollbar; es
   geht kein Logo verloren.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var band = document.querySelector('[data-bank-band]');
  if (!band) return;

  var lauf = band.querySelector('[data-bank-lauf]');
  var spur = band.querySelector('[data-bank-spur]');
  if (!lauf || !spur) return;

  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Die fuenf echten Felder einmal merken — alles Weitere sind Kopien. */
  var basis = Array.prototype.slice.call(spur.children);
  if (!basis.length) return;

  var stumm = function (el) {
    el.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(el.querySelectorAll('img'), function (bild) {
      bild.setAttribute('alt', '');
    });
    return el;
  };

  /* --- 1. Spur auf mindestens Bandbreite bringen ------------------------- */
  /* Rueckgabe: wie viele Durchgaenge die Spur jetzt enthaelt. Daran laesst
     sich erkennen, ob nach einer Fenstergroessenaenderung ueberhaupt neu
     gebaut werden muss — sonst wuerde die Bewegung bei jedem Pixel
     Breitenaenderung von vorn beginnen. */
  var fuellen = function () {
    Array.prototype.forEach.call(spur.querySelectorAll('[data-bank-wdh]'), function (el) {
      el.parentNode.removeChild(el);
    });

    var soll = band.getBoundingClientRect().width;
    var runden = 1;
    /* 24 Runden sind reichlich: fuenf Logos ergeben schon rund 600 px. */
    while (spur.getBoundingClientRect().width < soll && runden < 24) {
      basis.forEach(function (feld) {
        var kopie = stumm(feld.cloneNode(true));
        kopie.setAttribute('data-bank-wdh', '');
        spur.appendChild(kopie);
      });
      runden++;
    }
    return runden;
  };

  /* --- 2. Zweite Spur fuer den nahtlosen Umlauf -------------------------- */
  var klonen = function () {
    var alt = lauf.querySelector('[data-bank-klon]');
    if (alt) alt.parentNode.removeChild(alt);

    var klon = stumm(spur.cloneNode(true));
    klon.removeAttribute('data-bank-spur');
    klon.setAttribute('data-bank-klon', '');
    lauf.appendChild(klon);
  };

  /* --- 3. Dauer nach tatsaechlicher Breite ------------------------------- */
  /* Damit die Logos ueberall gleich schnell wandern — sonst rast die Reihe
     auf schmalen Fenstern und kriecht auf breiten. Rund 46 Pixel je
     Sekunde, eine Spur Weg je Durchlauf. */
  var setzeDauer = function () {
    var breite = spur.getBoundingClientRect().width;
    if (!breite) return;
    var s = Math.max(18, Math.round(breite / 46));
    if (lauf.style.getPropertyValue('--dauer') === s + 's') return;   // kein Neustart ohne Not
    lauf.style.setProperty('--dauer', s + 's');
  };

  var runden = 0;
  var aufbauen = function (erzwingen) {
    var neu = fuellen();
    if (!erzwingen && neu === runden) {                // Anzahl unveraendert:
      klonen();                                        // Klon trotzdem auffrischen
      setzeDauer();
      return;
    }
    runden = neu;
    klonen();
    setzeDauer();
  };

  aufbauen(true);

  /* Sind die SVG erst nach dem ersten Messen da, stimmen die Breiten noch
     nicht — deshalb nach dem Laden einmal nachrechnen. */
  window.addEventListener('load', function () { aufbauen(true); });

  var wartend = null;
  window.addEventListener('resize', function () {
    if (wartend) clearTimeout(wartend);
    wartend = setTimeout(function () { aufbauen(false); }, 180);
  });

  /* --- 4. Bewegung nur, wenn sie gewuenscht ist -------------------------- */
  var laufSchalten = function () {
    if (ruhig.matches) band.removeAttribute('data-laeuft');
    else band.setAttribute('data-laeuft', 'true');
  };
  laufSchalten();
  if (ruhig.addEventListener) ruhig.addEventListener('change', laufSchalten);
})();
