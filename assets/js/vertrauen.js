/* ---------------------------------------------------------------------------
   ESTERA — Vertrauensleiste (#vertrauen)

   Zwei Aufgaben, sonst nichts:
     1  der einmalige Einlauf des Zitats beim Erscheinen;
     2  die Fuellung des Zitats Wort fuer Wort entlang der Scrollposition.

   BEIDE HAENGEN AN EINEM SCHALTER, DEN NUR DIESE DATEI SETZT.
   Die Anfangszustaende stehen in assets/css/vertrauen.css hinter
   `data-vtr-bereit` beziehungsweise `data-vtr-fuellen`. Laedt diese Datei
   nicht, ist Javascript aus oder kennt der Browser IntersectionObserver
   nicht, greift keine dieser Regeln: die Leiste steht vollstaendig da und
   der Satz steht voll schwarz da. Ein Inhalt, der erst durch ein Skript
   sichtbar oder lesbar wird, waere hier der falsche Handel — die Leiste
   traegt eine Aussage des Unternehmens, keine Zierde.

   KEIN SCROLL-HIJACKING. Das Skript liest die Scrollposition, es
   veraendert sie nie.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var sec = document.querySelector('[data-vtr]');
  if (!sec) return;

  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ======================================================================
     1  EINLAUF
     ====================================================================== */
  (function () {
    var zeigen = function () { sec.setAttribute('data-vtr-sicht', 'true'); };

    /* Ohne IntersectionObserver gar nicht erst verstecken — sonst bliebe
       die Leiste dauerhaft unsichtbar. */
    if (!('IntersectionObserver' in window)) { zeigen(); return; }

    sec.setAttribute('data-vtr-bereit', 'true');

    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        zeigen();
        beob.disconnect();          /* einmalig: beim Zurueckscrollen nicht wieder */
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -6% 0px' });

    beob.observe(sec);
  })();

  /* ======================================================================
     2  FUELLUNG
     ====================================================================== */
  var woerter = Array.prototype.slice.call(sec.querySelectorAll('[data-vtr-wort]'));
  if (!woerter.length) return;

  var n = woerter.length;
  var stand = new Array(n);        /* letzter gesetzter Zustand je Wort */

  var messen = function () {
    var r  = sec.getBoundingClientRect();          /* EIN Aufruf je Bild */
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (!vh) return;

    /* Der Fortschritt haengt an der MITTE der Leiste, nicht an ihrer
       Ober- oder Unterkante. Die Leiste ist flach — an einer Kante
       gemessen waere die Strecke, ueber die gefuellt wird, kuerzer als
       die Leiste hoch ist, und der Satz waere fertig, bevor man ihn
       gelesen hat. Ueber die Mitte gerechnet betraegt die Strecke rund
       eine halbe Fensterhoehe.
         Mitte bei 90 % der Fensterhoehe  ->  0 (alle Woerter blass)
         Mitte bei 42 % der Fensterhoehe  ->  1 (alle Woerter schwarz)
       Die Rechnung ist reine Geometrie ohne gespeicherten Zustand.
       Rueckwaerts gescrollt faellt der Wert deshalb genauso zurueck; es
       kann nichts haengenbleiben. */
    var mitte = r.top + r.height / 2;
    var p = (vh * 0.90 - mitte) / (vh * 0.48);
    if (p < 0) p = 0; else if (p > 1) p = 1;

    for (var i = 0; i < n; i++) {
      /* JA ODER NEIN, nichts dazwischen. Jedes Wort bekommt denselben
         Anteil der Strecke und schlaegt um, sobald der Fortschritt es
         erreicht hat. Vorher wanderte hier ein Zwischenwert zwischen 0
         und 1 durch das Wort und zog eine Kante hindurch — das war dem
         Kunden zu unauffaellig. Der harte Umschlag macht die Wortgrenze
         selbst zur Kante: man sieht, wie ein Wort nach dem anderen
         schwarz wird.
         Geschrieben wird nur bei einer echten Aenderung — bei 29
         Woertern sind das ueber den ganzen Scrollweg 29 Zugriffe statt
         einer je Bild. */
      var voll = (p * n - i) >= 0.5;
      if (stand[i] !== voll) {
        if (voll) woerter[i].setAttribute('data-voll', '');
        else      woerter[i].removeAttribute('data-voll');
        stand[i] = voll;
      }
    }
  };

  var wartet = false;
  var anstossen = function () {
    if (wartet) return;
    wartet = true;
    requestAnimationFrame(function () { wartet = false; messen(); });
  };

  var hoeren = false;
  var einschalten = function () {
    if (hoeren) return;
    hoeren = true;
    sec.setAttribute('data-vtr-fuellen', 'true');
    messen();                                     /* Startwert vor dem ersten Scroll */
    window.addEventListener('scroll', anstossen, { passive: true });
    window.addEventListener('resize', anstossen);
    /* Schriften kommen spaeter als das Markup; danach steht der Satz an
       einer anderen Stelle und der Fortschritt muss neu gerechnet werden. */
    window.addEventListener('load', messen);
  };

  var ausschalten = function () {
    if (!hoeren) return;
    hoeren = false;
    sec.removeAttribute('data-vtr-fuellen');      /* Satz steht voll schwarz */
    for (var i = 0; i < n; i++) { woerter[i].removeAttribute('data-voll'); stand[i] = undefined; }
    window.removeEventListener('scroll', anstossen);
    window.removeEventListener('resize', anstossen);
    window.removeEventListener('load', messen);
  };

  var schalten = function () { if (ruhig.matches) ausschalten(); else einschalten(); };
  schalten();
  if (ruhig.addEventListener) ruhig.addEventListener('change', schalten);
  else if (ruhig.addListener) ruhig.addListener(schalten);
})();
