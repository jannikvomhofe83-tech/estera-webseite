/* ===========================================================================
   UNSER ABLAUF — Steuerung der Section #ablauf
   Angelegt 25.08.2026. Gehoert ausschliesslich zu dieser Section.

   GRUNDSATZ
   Ohne dieses Skript steht die Section vollstaendig lesbar da: alle fuenf
   Beschreibungen untereinander, die Buehne klebt nicht, alle Knoepfe sind
   bedienbar (die Schrittknoepfe tun dann nichts, der Weiter-Knopf des
   letzten Schritts ist ohnehin ein echter Link). Erst wenn das Skript
   laeuft, setzt es [data-abl-bereit] und die Regeln fuer den festen
   Infokasten und die Laufstrecke greifen.

   DREI WEGE, EINEN SCHRITT ZU WAEHLEN
     1  Klick auf einen Eintrag der Liste links.
     2  Klick auf „Naechster Schritt".
     3  Weiterrollen: die Buehne bleibt stehen und die Auswahl wandert von
        selbst zum naechsten Schritt.
   Alle drei schreiben in dieselbe Funktion; sie koennen sich deshalb nicht
   widersprechen.

   TASTATUR
   Innerhalb der Schrittliste blaettern Pfeil links/rechts und hoch/runter,
   Pos1 und Ende springen an den Rand. Enter und Leertaste wirken wie ein
   Klick (es sind echte <button>).

   DER FESTE INFOKASTEN
   Die Lage des mittleren Blocks macht das Stylesheet, nicht dieses Skript:
   alle fuenf Beschreibungen liegen in derselben Rasterzelle, die
   ausgeblendeten stehen auf visibility: hidden. Damit liegt die Oberkante
   bei jedem Schritt auf demselben Bildpunkt und die Hoehe wechselt nie.
   Dieses Skript setzt nur, WELCHE sichtbar ist.
   =========================================================================== */
(function () {
  'use strict';

  var abschnitt = document.querySelector('[data-abl]');
  if (!abschnitt) return;

  var panels  = Array.prototype.slice.call(abschnitt.querySelectorAll('[data-abl-panel]'));
  var knoepfe = Array.prototype.slice.call(abschnitt.querySelectorAll('.abl__schritt'));
  var lauf    = abschnitt.querySelector('[data-abl-lauf]');
  var halt    = abschnitt.querySelector('[data-abl-halt]');
  if (!panels.length || !knoepfe.length) return;

  var nummern = panels.map(function (p) { return p.getAttribute('data-abl-panel'); });
  var jetzt   = null;

  /* --- Einen Schritt zeigen ---------------------------------------------- */
  function zeige(nr, fokusHalten) {
    if (nummern.indexOf(nr) < 0 || nr === jetzt) {
      if (nr === jetzt && fokusHalten) { fokus(nr); }
      return;
    }
    jetzt = nr;

    panels.forEach(function (p) {
      var offen = p.getAttribute('data-abl-panel') === nr;
      p.setAttribute('data-abl-offen', offen ? 'true' : 'false');
      /* Das Ausgeblendete ist per Stylesheet unsichtbar. Damit es auch fuer
         Vorlesewerkzeuge und den Tabulator weg ist, kommt `inert` dazu —
         NICHT `hidden`: das waere display:none und wuerde die Hoehe des
         Rasters wegnehmen, also genau den festen Kasten zerstoeren. */
      if (offen) {
        p.removeAttribute('inert');
        p.removeAttribute('aria-hidden');
      } else {
        p.setAttribute('inert', '');
        p.setAttribute('aria-hidden', 'true');
      }
    });

    knoepfe.forEach(function (b) {
      var an = b.getAttribute('data-abl-zu') === nr;
      b.setAttribute('aria-expanded', an ? 'true' : 'false');
      if (an) { b.setAttribute('aria-current', 'step'); }
      else    { b.removeAttribute('aria-current'); }
      /* Nur der gewaehlte Eintrag liegt im Tabulatorlauf; innerhalb der
         Liste blaettern die Pfeiltasten. */
      b.tabIndex = an ? 0 : -1;
    });

    if (fokusHalten) { fokus(nr); }
  }

  function fokus(nr) {
    var ziel = knoepfe.filter(function (b) { return b.getAttribute('data-abl-zu') === nr; })[0];
    if (ziel) { ziel.focus(); }
  }

  /* --- Klicks ------------------------------------------------------------ */
  abschnitt.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-abl-zu], [data-abl-weiter]') : null;
    if (!b || !abschnitt.contains(b)) return;
    var nr = b.getAttribute('data-abl-weiter') || b.getAttribute('data-abl-zu');
    if (!nr) return;
    e.preventDefault();
    /* Ein Klick setzt die Auswahl — und rollt zugleich an die Stelle der
       Laufstrecke, die zu diesem Schritt gehoert. Sonst wuerde die naechste
       Rollbewegung die Auswahl sofort wieder zurueckwerfen. */
    zeige(nr, false);
    rolleZu(nummern.indexOf(nr));
  });

  /* --- Tastatur ---------------------------------------------------------- */
  knoepfe.forEach(function (b, i) {
    b.addEventListener('keydown', function (e) {
      var k = e.key, ziel = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') { ziel = (i + 1) % knoepfe.length; }
      else if (k === 'ArrowLeft' || k === 'ArrowUp') { ziel = (i - 1 + knoepfe.length) % knoepfe.length; }
      else if (k === 'Home') { ziel = 0; }
      else if (k === 'End')  { ziel = knoepfe.length - 1; }
      else { return; }
      e.preventDefault();
      var nr = knoepfe[ziel].getAttribute('data-abl-zu');
      zeige(nr, 'schritt');
      rolleZu(ziel);
    });
  });

  /* ========================================================================
     DIE LAUFSTRECKE
     Der Kasten .abl__lauf bekommt die Hoehe „Buehne + vier Uebergaenge".
     Die Buehne darin klebt unter der Kopfleiste. Wie weit sie schon geklebt
     hat, ergibt den Schritt.

     Die Hoehe steht hier und nicht im Stylesheet, weil sie die GEMESSENE
     Buehnenhoehe braucht — die haengt an Schriftgroesse, Umbruch und
     Fensterbreite und ist in CSS nicht auszurechnen.
     ===================================================================== */
  var STUFE = 0.58;            /* Rollweg je Uebergang, in Fensterhoehen     */
  var klebt = false;           /* laeuft die Klebemechanik gerade?           */
  var strecke = 0;             /* Rollweg von Schritt 1 bis Schritt 5, in px */

  function telefon() {
    return window.matchMedia('(max-width: 760px)').matches;
  }

  /* Der aufgeloeste Klebeabstand in Pixeln.
     NICHT ueber --abl-klebe lesen: getPropertyValue liefert bei
     Benutzereigenschaften den ROHTEXT, hier also die ganze calc()-Zeile.
     parseFloat haette daraus NaN gemacht und die Umschaltpunkte um die volle
     Kopfleistenhoehe verschoben. `top` an einem klebenden Element ist dagegen
     bereits ausgerechnet. */
  function klebeTop() {
    if (!halt) return 0;
    var px = parseFloat(getComputedStyle(halt).top);
    return isNaN(px) ? 0 : px;
  }

  function vermessen() {
    if (!lauf || !halt) return;
    if (telefon()) {
      klebt = false;
      lauf.style.removeProperty('height');
      abschnitt.style.removeProperty('--abl-strecke');
      return;
    }
    klebt = true;
    var buehne = halt.offsetHeight;
    strecke = Math.round((panels.length - 1) * STUFE * window.innerHeight);
    abschnitt.style.setProperty('--abl-strecke', (buehne + strecke) + 'px');
  }

  /* Rollt an die Stelle der Strecke, die zu Schritt i gehoert. */
  function rolleZu(i) {
    if (!klebt || i < 0 || strecke <= 0) return;
    var oben = lauf.getBoundingClientRect().top + window.pageYOffset;
    /* Die Mitte des Abschnitts, der zu i gehoert — so landet man nicht auf
       der Kippkante zum Nachbarn. */
    var anteil = (i + 0.5) / panels.length;
    var ziel = oben - klebeTop() + Math.round(anteil * strecke);
    window.scrollTo({
      top: ziel,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  }

  /* Liest die Rollposition und leitet daraus den Schritt ab. */
  function ausRollen() {
    if (!klebt || strecke <= 0) return;
    var oben = lauf.getBoundingClientRect().top;
    var gelaufen = klebeTop() - oben;
    if (gelaufen < 0) { gelaufen = 0; }
    if (gelaufen > strecke) { gelaufen = strecke; }
    var t = gelaufen / strecke;
    var i = Math.floor(t * panels.length);
    if (i > panels.length - 1) { i = panels.length - 1; }
    zeige(nummern[i], false);
  }

  var wartet = false;
  function angestossen() {
    if (wartet) return;
    wartet = true;
    window.requestAnimationFrame(function () {
      wartet = false;
      ausRollen();
    });
  }

  window.addEventListener('scroll', angestossen, { passive: true });
  window.addEventListener('resize', function () {
    vermessen();
    angestossen();
  }, { passive: true });

  /* --- Erst jetzt umschalten --------------------------------------------- */
  abschnitt.setAttribute('data-abl-bereit', 'true');
  zeige(nummern[0], false);
  /* Nach dem Umschalten hat sich die Buehnenhoehe geaendert (die fuenf
     Beschreibungen liegen jetzt uebereinander statt untereinander) — erst
     danach messen. */
  window.requestAnimationFrame(function () {
    vermessen();
    ausRollen();
  });
  /* Schriften kommen spaeter als das Markup und aendern die Hoehe noch einmal. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { vermessen(); angestossen(); });
  }
  window.addEventListener('load', function () { vermessen(); angestossen(); });
})();
