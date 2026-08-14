/* ===========================================================================
   ESTERA — Ablauf: aktive Stufe beim Scrollen
   ---------------------------------------------------------------------------
   Der Abschnitt „So funktioniert Estera" haelt die Architekturaufnahme mit
   position: sticky fest, waehrend die sechs Schritte daran vorbeiziehen.
   Diese Datei markiert dabei den Schritt, der gerade auf der Lesezeile liegt.

   Kein Scroll-Jacking: es wird nichts angehalten, nichts gescrollt, nichts
   umgeleitet. Es aendert sich ausschliesslich ein Attribut.

   Warum IntersectionObserver und kein scroll-Handler: der Beobachter meldet
   sich nur beim Wechsel, nicht bei jedem Pixel. Die Lesezeile ist ein
   Streifen von rund zwei Prozent der Fensterhoehe; da die Schritte
   lueckenlos aneinandergrenzen, liegt immer genau einer davon darauf. Welcher
   das ist, wird bei jeder Meldung aus der Geometrie neu bestimmt — dadurch
   stimmt der Zustand auch nach einem Sprung im Scrollverlauf.
   =========================================================================== */
(function () {
  'use strict';

  var liste = document.querySelector('[data-ablauf]');
  if (!liste) return;

  var schritte = Array.prototype.slice.call(liste.querySelectorAll('.ablauf__schritt'));
  if (!schritte.length) return;

  var motive = Array.prototype.slice.call(document.querySelectorAll('[data-ablauf-bild]'));
  var wenigerBewegung = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Lesezeile: 45 % der Fensterhoehe. Etwas oberhalb der Mitte, weil der
     Blick beim Lesen dort liegt und der Kopf oben Platz braucht. */
  var LESEZEILE = 0.45;

  var aktiv = -1;

  function setzeStufe(i) {
    if (i === aktiv) return;
    aktiv = i;

    schritte.forEach(function (el, n) {
      var an = (n === i);
      el.setAttribute('data-aktiv', String(an));
      if (an) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });

    if (!motive.length) return;

    /* Ohne Bewegung bleibt ein einziges Motiv stehen — ein Wechsel waere
       dort nur ein harter Schnitt. */
    var b = wenigerBewegung
      ? 0
      : Math.min(motive.length - 1, Math.floor(i * motive.length / schritte.length));

    motive.forEach(function (bild, n) {
      if (n === b) bild.setAttribute('data-an', 'true');
      else bild.removeAttribute('data-an');
    });
  }

  /* Welcher Schritt liegt auf der Lesezeile? Liegt keiner darauf — weil der
     Abschnitt noch bevorsteht oder schon durch ist — gilt der naechstgelegene.
     So ist vorher immer der erste und nachher immer der letzte markiert. */
  function bestimmeStufe() {
    var linie = window.innerHeight * LESEZEILE;
    var beste = 0;
    var naechste = Infinity;

    for (var n = 0; n < schritte.length; n++) {
      var r = schritte[n].getBoundingClientRect();
      if (linie >= r.top && linie < r.bottom) { beste = n; naechste = 0; break; }
      var d = (linie < r.top) ? (r.top - linie) : (linie - r.bottom);
      if (d < naechste) { naechste = d; beste = n; }
    }

    setzeStufe(beste);
  }

  /* Ohne Beobachter bleibt der erste Schritt markiert — nichts bleibt leer. */
  if (!('IntersectionObserver' in window)) { setzeStufe(0); return; }

  /* rootMargin schneidet das Fenster auf einen schmalen Streifen um die
     Lesezeile herunter: oben 44 %, unten 54 % weg, bleiben 2 % Hoehe.
     Ein Streifen von exakt 0 % waere wirkungslos — ohne Flaeche gibt es
     keine Ueberschneidung und der Beobachter meldet sich nie. */
  var beobachter = new IntersectionObserver(bestimmeStufe, {
    rootMargin: '-44% 0px -54% 0px',
    threshold: 0
  });
  schritte.forEach(function (el) { beobachter.observe(el); });

  bestimmeStufe();

  /* Nach Schriftwechsel und bei Groessenaenderung neu messen — beides
     verschiebt die Hoehen der Schritte. Der Resize-Handler ist ueber
     requestAnimationFrame gedrosselt. */
  var laeuft = false;
  window.addEventListener('resize', function () {
    if (laeuft) return;
    laeuft = true;
    requestAnimationFrame(function () { laeuft = false; bestimmeStufe(); });
  }, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(bestimmeStufe);
  }
})();
