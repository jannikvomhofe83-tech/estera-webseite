/* ---------------------------------------------------------------------------
   ESTERA — Über Estera

   DREI Aufgaben, sonst nichts:
     1  im Hero laeuft beim Laden einmal die Farbe von links ins Bild;
     2  der Vergleichskasten wird um die halbe eigene Hoehe hochgezogen,
        damit er zur Haelfte in die Hero ragt — CSS kann diese Hoehe nicht
        ausrechnen;
     3  in Abschnitt 2 fuellt sich die Unterzeile beim Scrollen Wort fuer
        Wort von Grau auf Schwarz.

   Beide haengen an Schaltern, die NUR diese Datei setzt: `data-hero-bereit`
   und `data-uab-fuellen`. Laedt sie nicht oder ist Javascript aus, greift
   keine der zugehoerigen Regeln in assets/css/ueber.css — das Bild steht
   dann farbig und der Satz steht schwarz. Beides ist der gewuenschte
   Endzustand; nichts bleibt halbfertig stehen.

   KEIN SCROLL-HIJACKING. Die Scrollposition wird gelesen, nie veraendert.

   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   ZUR ZWEITEN AUFGABE: die Unterzeile fuellt sich Wort fuer Wort.

   DAS VERFAHREN IST NICHT NEU. Es ist Zeile fuer Zeile das der Trustleiste
   auf der Startseite (assets/js/vertrauen.js): dieselbe Geometrie, dieselbe
   Schwelle von 0.5, derselbe harte Umschlag je Wort, dieselbe Drosselung
   ueber requestAnimationFrame, dieselbe Abmeldung bei
   prefers-reduced-motion. Geaendert sind allein die Attributnamen
   (data-uab-* statt data-vtr-*) und der Bezugspunkt: die Trustleiste ist ein
   flaches Band und misst deshalb ihre MITTE; die Unterzeile hier steht in
   einer hohen, zweispaltigen Section, deren Mitte weit unterhalb des Satzes
   liegt. Gemessen wird deshalb der Satz selbst.

   DER GRUNDZUSTAND IST VOLL GEFUELLT.
   Die Anfangszustaende stehen in assets/css/ueber.css hinter
   `data-uab-fuellen`, und dieses Attribut setzt allein diese Datei. Laedt
   sie nicht, ist Javascript aus, kennt der Browser IntersectionObserver
   nicht oder steht prefers-reduced-motion auf reduce, so greift keine der
   Regeln und der Satz steht vollstaendig schwarz da. Ein Text, der erst
   durch ein Skript lesbar wird, waere hier der falsche Handel.

   KEIN SCROLL-HIJACKING. Das Skript liest die Scrollposition, es veraendert
   sie nie.
--------------------------------------------------------------------------- */

/* ===========================================================================
   HERO — die Farbe laeuft einmal von links herein

   Beim Laden, EINMAL, von selbst. Nicht scrollgekoppelt, nicht wiederholt.

   DER ANFANGSZUSTAND WIRD ERST HIER GESETZT.
   `data-hero-bereit` beschneidet die Farblage (assets/css/ueber.css); ohne
   dieses Attribut steht sie unbeschnitten da. Gesetzt wird es ausschliesslich
   hier und ausschliesslich dann, wenn danach auch wirklich losgelaufen wird.
   Damit sind die beiden gefaehrlichen Faelle ausgeschlossen:
     · kein Javascript  -> Attribut faellt nie, Bild steht farbig;
     · reduzierte Bewegung -> wir setzen es gar nicht erst, Bild steht farbig.
   Ein beschnitten haengengebliebenes Farbbild kann es nicht geben.

   ERST WENN DAS BILD DA IST. Liefe der Wisch vorher, wischte er ueber ein
   leeres Feld. Gewartet wird auf `decode()`; kennt der Browser das nicht
   oder schlaegt es fehl, wird auf `complete` beziehungsweise das
   load-Ereignis zurueckgefallen.
   =========================================================================== */
(function () {
  'use strict';

  var hero = document.querySelector('[data-hero]');
  if (!hero) return;

  var farbe = hero.querySelector('[data-hero-farbe]');
  if (!farbe) return;

  /* Bei reduzierter Bewegung gar nicht erst anfangen: das Bild steht sofort
     farbig. Absichtlich einmalig abgefragt und nicht ueber `change`
     nachgefuehrt — ein Einlauf, der beim Umschalten der Systemeinstellung
     nachtraeglich losliefe, waere genau die Ueberraschung, die die
     Einstellung verhindern soll. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Kennt der Browser clip-path nicht, bliebe die Farblage sichtbar und es
     gaebe keinen Wisch — dann lieber gleich ohne Anfangszustand. */
  if (!(window.CSS && CSS.supports && CSS.supports('clip-path', 'inset(0 100% 0 0)'))) return;

  hero.setAttribute('data-hero-bereit', 'true');

  /* DER VERZUG. Kundenwunsch vom 23.08.2026: die Farbe soll nicht sofort
     losfahren, sondern das schwarz-weisse Bild einen Moment stehen lassen.
     500 ms, in der Mitte des vorgegebenen Fensters von 400 bis 600 ms.
     Er beginnt NACH dem Decodieren — davor waere er ein Verzug auf ein
     leeres Feld und damit unsichtbar. */
  var VERZUG = 500;

  var gelaufen = false;
  var los = function () {
    if (gelaufen) return;
    gelaufen = true;
    /* Zwei Bilder warten: das erste setzt den Anfangszustand in die
       Darstellung, im zweiten wird der Endwert gesetzt. Ohne diese Pause
       fasst der Browser beides zusammen und es gibt keinen Uebergang. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        window.setTimeout(function () {
          hero.setAttribute('data-hero-los', 'true');
        }, VERZUG);
      });
    });
  };

  /* Notbremse: laeuft aus irgendeinem Grund weder decode noch load durch,
     faengt der Wisch nach anderthalb Sekunden trotzdem an. */
  var notbremse = window.setTimeout(los, 1500);
  var fertig = function () { window.clearTimeout(notbremse); los(); };

  if (farbe.decode) {
    farbe.decode().then(fertig, fertig);
  } else if (farbe.complete) {
    fertig();
  } else {
    farbe.addEventListener('load',  fertig, { once: true });
    farbe.addEventListener('error', fertig, { once: true });
  }
})();


/* ===========================================================================
   DER VERGLEICHSKASTEN RAGT ZUR HAELFTE IN DIE HERO

   Kundenwunsch 23.08.2026: „muss aber höher gesetzt werden, sodass er zur
   Hälfte in die Hero-Section ragt und zur anderen Hälfte in die zweite
   Section."

   WARUM DAS NICHT IN CSS GEHT. Ein negativer Aussenabstand in Prozent
   bezieht sich auf die BREITE des Elternelements, nie auf die eigene Hoehe.
   `translateY(-50%)` verschoebe nur die Darstellung — im Fluss bliebe die
   volle Hoehe stehen und darunter entstuende eine Luecke von einer halben
   Kastenhoehe. Gebraucht wird also die gemessene Hoehe.

   OHNE JAVASCRIPT PASSIERT NICHTS, und das ist der richtige Rueckfall:
   --uvz-hoch bleibt 0, der Kasten steht schlicht unter der Hero. Kein
   Ueberstand ist besser als ein halb abgeschnittener Kasten.

   KEIN SCROLL-HIJACKING, keine dauernde Messung: gemessen wird beim Laden,
   bei Groessenaenderung des Kastens (ResizeObserver) und nachdem die
   Schriften da sind. Geschrieben wird nur bei einer echten Aenderung.
   =========================================================================== */
(function () {
  'use strict';

  /* GEMESSEN WIRD DER KASTEN „WARUM ESTERA", nicht der Behaelter um die
     ganze Verzweigung. Zuvor stand hier `.uvz` — dadurch zog sich der
     gesamte Block um eine halbe Blockhoehe (rund 500 px) nach oben und riss
     die Kaesten mit in die Hero. Es soll sich aber nur dieser eine Kasten
     bewegen. */
  var kasten = document.querySelector('.uvz__quelle');
  var band   = document.querySelector('.uvz-band');
  if (!kasten || !band) return;

  /* Unter dieser Breite ueberlappt nichts: auf dem Telefon ist die Hero
     flach, und ein Kasten, der in sie hineinragt, wirkt gedraengt statt
     eingelegt. Derselbe Haltepunkt wie in assets/css/ueber.css. */
  var SCHMAL = window.matchMedia('(max-width: 620px)');

  var letzter = null;

  var setzen = function () {
    var wert = 0;
    if (!SCHMAL.matches) {
      /* Die halbe Kastenhoehe — das ist der Wunsch. */
      wert = Math.round(kasten.getBoundingClientRect().height / 2);

      /* Ein Deckel ist nicht mehr noetig: dieser Kasten ist rund 200 px
         hoch, seine Haelfte also rund 100 px. Er kann die Hero-Ueberschrift
         nicht mehr erreichen. */
    }
    if (wert === letzter) return;
    letzter = wert;
    band.style.setProperty('--uvz-hoch', wert + 'px');
  };

  setzen();

  if ('ResizeObserver' in window) {
    /* Der Kasten aendert seine Hoehe bei jeder Fensterbreite und sobald die
       Schriften geladen sind. Ein Beobachter faengt beides ab. */
    new ResizeObserver(setzen).observe(kasten);
  } else {
    window.addEventListener('resize', setzen);
  }
  window.addEventListener('load', setzen);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setzen);

  if (SCHMAL.addEventListener) SCHMAL.addEventListener('change', setzen);
  else if (SCHMAL.addListener) SCHMAL.addListener(setzen);
})();


/* ===========================================================================
   ABSCHNITT 2 — die Wortfuellung der Unterzeile
   =========================================================================== */
(function () {
  'use strict';

  var sec = document.querySelector('[data-uab]');
  if (!sec) return;

  var woerter = Array.prototype.slice.call(sec.querySelectorAll('[data-uab-wort]'));
  if (!woerter.length) return;

  /* Der Satz, nicht der Abschnitt, ist der Bezugspunkt. Siehe oben. */
  var satz = woerter[0].parentNode;

  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');

  var n = woerter.length;
  var stand = new Array(n);        /* letzter gesetzter Zustand je Wort */

  var messen = function () {
    var r  = satz.getBoundingClientRect();          /* EIN Aufruf je Bild */
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (!vh) return;

    /* Gerechnet wird ueber die MITTE des Satzes.
         Mitte bei 88 % der Fensterhoehe  ->  0 (alle Woerter blass)
         Mitte bei 40 % der Fensterhoehe  ->  1 (alle Woerter schwarz)
       Die Strecke betraegt damit rund eine halbe Fensterhoehe — lang genug,
       dass man das Umschlagen Wort fuer Wort verfolgen kann, und kurz
       genug, dass der Satz fertig ist, bevor er oben aus dem Bild laeuft.

       Die Rechnung ist reine Geometrie ohne gespeicherten Zustand.
       Rueckwaerts gescrollt faellt der Wert deshalb genauso zurueck; es
       kann nichts haengenbleiben. */
    var mitte = r.top + r.height / 2;
    var p = (vh * 0.88 - mitte) / (vh * 0.48);
    if (p < 0) p = 0; else if (p > 1) p = 1;

    for (var i = 0; i < n; i++) {
      /* JA ODER NEIN, nichts dazwischen. Jedes Wort bekommt denselben
         Anteil der Strecke und schlaegt um, sobald der Fortschritt es
         erreicht hat. Die Wortgrenze selbst ist die Kante — genau das war
         der Punkt, auf den es dem Kunden bei der Trustleiste ankam.
         Geschrieben wird nur bei einer echten Aenderung. */
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
    sec.setAttribute('data-uab-fuellen', 'true');
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
    sec.removeAttribute('data-uab-fuellen');      /* Satz steht voll schwarz */
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
