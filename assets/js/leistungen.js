/* ESTERA — Abschnitt „Unsere Leistungen": den Plan einmal aufziehen lassen.
   ---------------------------------------------------------------------------
   Zwei Schalter am Block, ausgewertet in assets/css/auswahl.css:

   data-bereit      schaltet die Startzustaende (unsichtbar, versetzt, Linien
                    zugedeckt) ueberhaupt erst frei. Genau deshalb steht das
                    hier und nicht im Stylesheet: faellt Javascript aus, wird
                    der Schalter nie gesetzt und der Abschnitt steht
                    vollstaendig sichtbar da.
   data-gezeichnet  loest den Ablauf aus. Er laeuft genau einmal — der
                    Beobachter trennt sich danach, und der Schalter bleibt
                    stehen, auch wenn man wieder heraus- und hineinscrollt.

   site.js kennt dasselbe Muster ueber [data-zeichnen] und setzt denselben
   Schalter. Beides zusammen ist ungefaehrlich: wer zuerst kommt, startet den
   Ablauf, ein zweites Setzen aendert nichts.                                */
(function () {
  'use strict';

  var plan = document.querySelector('#leistungen .leist');
  if (!plan) return;

  /* =======================================================================
     DIE VERBINDUNGSLINIEN
     Sie stehen nicht im Markup und nicht in CSS, sondern werden hier aus
     den tatsaechlichen Kartenmitten gezeichnet. Zwei Gruende:
     1. Eine Linie, die die Mitte einer Karte treffen muss, kann ihre
        Koordinate nicht aus Prozentwerten raten — die Karten sitzen in
        Rastern mit Fugen, und die Mitte einer Spalte ist nicht die Mitte
        der Karte darin.
     2. Die Pfeilspitze haengt als `marker-end` am Pfad. Damit sitzt sie
        konstruktionsbedingt am Pfadende und kann nicht verrutschen.
     Alle Koordinaten sind CSS-Pixel im Bezugssystem von .leist__plan; das
     SVG bekommt dieselbe viewBox und wird deshalb nicht skaliert.
     ======================================================================= */
  var zeichnen = (function () {
    var feld = document.querySelector('#leistungen .leist__plan');
    var svg  = feld && feld.querySelector('.leist__linien');
    if (!feld || !svg) return function () {};

    var NS = 'http://www.w3.org/2000/svg';
    var ecke = 9;   /* Radius der gerundeten Ecken */

    /* Die Karten tragen waehrend des Einlaufens eine Verschiebung (20 px
       nach unten) und beim Ueberfahren eine zweite (3 px nach oben).
       getBoundingClientRect zeigt sie mit; gezeichnet werden muss aber die
       Ruhelage, sonst haengen die Linien 20 px zu tief. Beide werden
       deshalb herausgerechnet. */
    var verschub = function (el) {
      var cs = getComputedStyle(el), x = 0, y = 0;
      if (cs.transform && cs.transform !== 'none' && window.DOMMatrixReadOnly) {
        try { var m = new DOMMatrixReadOnly(cs.transform); x += m.e; y += m.f; } catch (e) {}
      }
      if (cs.translate && cs.translate !== 'none') {
        var t = cs.translate.split(/\s+/);
        x += parseFloat(t[0]) || 0;
        y += parseFloat(t[1]) || 0;
      }
      return { x: x, y: y };
    };

    var kasten = function (el, bezug) {
      var r = el.getBoundingClientRect();
      var v = verschub(el);
      return {
        links: r.left - bezug.left - v.x, rechts: r.right - bezug.left - v.x,
        oben: r.top - bezug.top - v.y, unten: r.bottom - bezug.top - v.y,
        mx: r.left - bezug.left - v.x + r.width / 2,
        my: r.top - bezug.top - v.y + r.height / 2
      };
    };

    /* Senkrecht, dann waagerecht, dann wieder senkrecht — mit gerundeten
       Ecken. Genau diese Form braucht jede Verzweigung im Plan.
       Der Eckenradius darf hoechstens die HALBE Strecke danach aufbrauchen:
       sonst bleibt hinter der Rundung kein gerades Stueck mehr uebrig, das
       letzte Segment hat die Laenge null — und eine Pfeilspitze am Ende
       eines Segments ohne Laenge richtet sich nach dem Segment DAVOR und
       zeigt dann zur Seite statt nach unten. */
    var knick = function (x1, y1, y2, x2, y3) {
      var rx = Math.min(ecke, Math.abs(x2 - x1) / 2);
      var ry = Math.min(ecke, Math.abs(y2 - y1) * 0.6, Math.abs(y3 - y2) * 0.5);
      var sx = x2 > x1 ? 1 : -1;
      return 'M' + x1 + ' ' + y1 +
             'V' + (y2 - ry) +
             'Q' + x1 + ' ' + y2 + ' ' + (x1 + sx * rx) + ' ' + y2 +
             'H' + (x2 - sx * rx) +
             'Q' + x2 + ' ' + y2 + ' ' + x2 + ' ' + (y2 + ry) +
             'V' + y3;
    };

    return function () {
      var bezug = feld.getBoundingClientRect();
      var start = feld.querySelector('.lstart');
      var quellen = feld.querySelectorAll('.lq');
      var karten = feld.querySelectorAll('.lk');
      var ziel = feld.querySelector('.lz');
      if (!start || !quellen.length || !karten.length || !ziel) return;

      var luft = parseFloat(getComputedStyle(feld).getPropertyValue('--pfeil-luft')) || 8;

      /* Alte Gruppen weg, defs bleiben stehen. */
      var alt = svg.querySelectorAll('g.ll');
      for (var i = 0; i < alt.length; i++) svg.removeChild(alt[i]);

      svg.setAttribute('viewBox', '0 0 ' + bezug.width + ' ' + bezug.height);
      svg.setAttribute('width', bezug.width);
      svg.setAttribute('height', bezug.height);

      var lege = function (d, mitSpitze, takt) {
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'll');
        g.style.setProperty('--auf', takt);
        var pf = document.createElementNS(NS, 'path');
        pf.setAttribute('d', d);
        if (mitSpitze) pf.setAttribute('marker-end', 'url(#l-spitze)');
        g.appendChild(pf);
        svg.appendChild(g);
        return pf;
      };

      var s = kasten(start, bezug);
      var q = [], k = [];
      for (var a = 0; a < quellen.length; a++) q.push(kasten(quellen[a], bezug));
      for (var b = 0; b < karten.length; b++) k.push(kasten(karten[b], bezug));
      var z = kasten(ziel, bezug);

      /* --- ESTERA -> die beiden Quellen ----------------------------------
         Der Querbalken liegt bei 38 % des Zwischenraums und nicht in der
         Mitte: darunter braucht jede der beiden Abzweigungen noch Platz
         fuer ihre Rundung UND ein gerades Stueck bis zur Spitze. */
      var gabelY = s.unten + (q[0].oben - s.unten) * 0.38;
      for (var c = 0; c < q.length; c++) {
        lege(knick(s.mx, s.unten, gabelY, q[c].mx, q[c].oben - luft), true, 1);
      }

      /* --- die beiden Quellen -> die vier Leistungen ---------------------
         Zwei Stichleitungen auf einen Sammler, von dessen Mitte eine Linie
         mit Spitze in die Ebene darunter. */
      var sammel1 = (q[0].unten + k[0].oben) / 2;
      var d1 = '';
      for (var e = 0; e < q.length; e++) {
        d1 += 'M' + q[e].mx + ' ' + q[e].unten + 'V' + sammel1;
      }
      d1 += 'M' + q[0].mx + ' ' + sammel1 + 'H' + q[q.length - 1].mx;
      lege(d1, false, 3);
      lege('M' + s.mx + ' ' + sammel1 + 'V' + (k[0].oben - luft), true, 3);

      /* --- die vier Leistungen -> das Ziel -------------------------------- */
      var sammel2 = (k[0].unten + z.oben) / 2;
      var d2 = '';
      for (var f = 0; f < k.length; f++) {
        d2 += 'M' + k[f].mx + ' ' + k[f].unten + 'V' + sammel2;
      }
      d2 += 'M' + k[0].mx + ' ' + sammel2 + 'H' + k[k.length - 1].mx;
      lege(d2, false, 8);
      lege('M' + s.mx + ' ' + sammel2 + 'V' + (z.oben - luft), true, 8);
    };
  })();

  zeichnen();
  /* Nach dem Laden der Schriften sitzen die Karten anders — dann noch
     einmal. Und bei jeder Groessenaenderung, gebuendelt. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(zeichnen);
  var bremse;
  window.addEventListener('resize', function () {
    window.clearTimeout(bremse);
    bremse = window.setTimeout(zeichnen, 120);
  });

  var starten = function () { plan.setAttribute('data-gezeichnet', 'true'); };

  /* Wer keine Bewegung will oder keinen Beobachter hat, bekommt den fertigen
     Zustand sofort — ohne Startzustand gibt es auch nichts zu verbergen. */
  var ruhig = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ruhig || !('IntersectionObserver' in window)) { starten(); return; }

  plan.setAttribute('data-bereit', 'true');

  var beob, notbremse;
  var los = function () {
    starten();
    if (beob) beob.disconnect();
    window.clearTimeout(notbremse);
  };

  beob = new IntersectionObserver(function (eintraege) {
    for (var i = 0; i < eintraege.length; i++) {
      if (eintraege[i].isIntersecting) { los(); return; }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
  beob.observe(plan);

  /* Notbremse: sollte der Beobachter aus irgendeinem Grund nie ausloesen,
     steht der Abschnitt spaetestens nach fuenf Sekunden vollstaendig da. */
  notbremse = window.setTimeout(los, 5000);
})();
