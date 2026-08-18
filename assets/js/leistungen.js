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

    /* ===== DER HALS DER PFEILE ============================================
       Bis zum 17.08. sass an jedem Pfeil nur die Spitze und praktisch kein
       Strich davor („Die Pfeile … haben keinen Hals. Die brauchen auch einen
       Strich und dann einen Pfeil."). Ursache war die Rechenrichtung: die
       Querbalken lagen auf festen Bruchteilen des Zwischenraums, und was
       hinter der Rundung uebrig blieb, war Rest — bei 1512x950 ganze 0,75 px
       sichtbarer Strich, weil die 9 px lange Spitze das Segment auffrass.

       Gerechnet wird deshalb jetzt von HINTEN: erst steht fest, wie lang das
       gerade Stueck vor der Spitze sein muss, dann erst, wo der Querbalken
       liegen darf. Seit dem 18.08. steht auch der Eckenradius fest (siehe
       den naechsten Block); der gerade Anlauf ist der Rest — und dass er
       nicht ins Minus geraet, haelt --verb-hoehe frei.
       ==================================================================== */
    /* ===== DIE ECKEN =====================================================
       Kundenwunsch 18.08.: „Ich will, dass die Striche bei unseren
       Leistungen alle so eckig sind und eher abgerundet sind." Gemeint ist
       die Anmutung eines sauber gezogenen Schaltplans: gerade Strecke,
       gerundete Ecke, gerade Strecke — keine Boegen, keine Diagonalen.

       ECKE ist deshalb kein Hoechstmass mehr, sondern DER Radius. Er gilt
       an jeder einzelnen Ecke des Diagramms, und dass er ueberall
       hineinpasst, ist keine Hoffnung, sondern gerechnet: --verb-hoehe in
       assets/css/auswahl.css haelt den Platz frei (siehe die Rechnung
       dort). Die Klammer unten bleibt trotzdem stehen — sie ist die
       Notbremse fuer Fenstermasse, an die niemand gedacht hat, und wenn sie
       greift, sieht man es sofort: dann ist eine Ecke runder als die
       anderen.
       ==================================================================== */
    var ECKE   = 9;   /* Radius JEDER Ecke — ueberall derselbe Wert          */
    var SPITZE = 9;   /* Laenge der Pfeilspitze — das refX des Markers       */
    var SCHAFT = 20;  /* SICHTBARER gerader Strich davor (Vorgabe: >= 18 px) */
    var STUMPF = 12;  /* Mindestlaenge der Stichleitung ueber dem Sammler    */
    var HALS   = SCHAFT + SPITZE;   /* Laenge des letzten Pfadsegments      */

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

    /* Eine Viertelrundung als echter Kreisbogen.

       WARUM `A` UND NICHT `Q`: eine quadratische Bezier-Kurve mit den
       Kontrollarmen r sieht aus wie eine Rundung, IST aber keine — ihr
       Kruemmungsradius im Scheitel betraegt r / Wurzel 2, also rund 0,71 r.
       Wer den Radius nennen koennen muss — und das ist hier ausdruecklich
       verlangt —, kann ihn nicht ueber ein Naeherungsverfahren nennen. Der
       Bogen `A r r 0 0 f` liefert exakt r.

       Zum Drehsinn: das Fahnenbit ist 1, wenn der Bogen im Uhrzeigersinn
       laeuft (SVG rechnet y nach unten). Runter-nach-rechts ist gegen den
       Uhrzeigersinn (0), rechts-nach-runter mit ihm (1); nach links
       jeweils andersherum. */
    var bogen = function (r, imUhrzeigersinn, x, y) {
      return 'A' + r + ' ' + r + ' 0 0 ' + (imUhrzeigersinn ? 1 : 0) +
             ' ' + x + ' ' + y;
    };

    /* Senkrecht, dann waagerecht, dann wieder senkrecht — mit gerundeten
       Ecken. Genau diese Form braucht jede Verzweigung im Plan.

       Die Reihenfolge der Rechnung ist der ganze Punkt:
       1. HALS abziehen — das letzte gerade Stueck ist gesetzt, nicht Rest.
       2. Vom Rest gehen ZWEI Radien ab, nicht einer: die obere Ecke frisst
          r Hoehe unter dem Anfangspunkt, die untere noch einmal r ueber dem
          Hals. Was dann noch bleibt, ist der gerade Anlauf.
       3. Der Querbalken liegt dort, wo beides aufgeht.
       Eine Pfeilspitze am Ende eines Segments ohne Laenge wuerde sich nach
       dem Segment DAVOR richten und zur Seite statt nach unten zeigen —
       auch dagegen hilft dieselbe Rechnung. */
    var knick = function (x1, y1, x2, y3) {
      var lauf = y3 - y1;                                   /* ganze Fallhoehe */
      var hals = Math.min(HALS, Math.max(0, lauf - 2));
      var rest = lauf - hals;               /* Platz fuer Anlauf UND Rundung */
      var r = Math.max(0, Math.min(ECKE, rest / 2, Math.abs(x2 - x1) / 2));
      var y2 = y3 - hals - r;               /* daraus erst der Querbalken */
      var sx = x2 > x1 ? 1 : -1;
      return 'M' + x1 + ' ' + y1 +
             'V' + (y2 - r) +
             bogen(r, sx < 0, x1 + sx * r, y2) +
             'H' + (x2 - sx * r) +
             bogen(r, sx > 0, x2, y2 + r) +
             'V' + y3;
    };

    /* Wo der Sammler einer Ebene liegen darf. Dieselbe Rechnung fuer die
       geraden Verbindungen: so tief wie noetig, damit unter ihm der volle
       Hals Platz hat — und nie so hoch, dass die Stichleitungen darueber
       verschwinden. */
    var sammelY = function (oben, unten) {
      var tief = unten - HALS;
      var hoch = oben + Math.min(STUMPF, Math.max(0, (unten - oben) * 0.4));
      return tief > hoch ? tief : hoch;
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
         Wo der Querbalken liegt, rechnet `knick` selbst aus: von der
         Pfeilspitze aus rueckwaerts, damit der Hals steht. */
      for (var c = 0; c < q.length; c++) {
        lege(knick(s.mx, s.unten, q[c].mx, q[c].oben - luft), true, 1);
      }

      /* --- eine Ebene an die naechste ------------------------------------
         Stichleitungen aus den Karten auf einen Sammler, von dessen Mitte
         eine Linie mit Spitze in die Ebene darunter.

         STEHEN DIE KARTEN IN MEHREREN ZEILEN, faellt beides weg. Unter
         1180 px ruecken die vier Leistungen in zwei Reihen; eine
         Stichleitung aus der oberen Reihe muesste dann quer durch die
         untere laufen, um den Sammler zu erreichen. Genau das tat sie bis
         zum 17.08. — zwei goldene Striche mitten durch die Karten
         „Finanzierung" und „Begleitung & Betreuung". In dem Fall bleibt
         die eine Linie von der Unterkante des Blocks zur naechsten Ebene;
         die Leserichtung traegt dort ohnehin allein. */
      var verbinde = function (kaesten, zielY, takt) {
        var unten = -Infinity, i;
        for (i = 0; i < kaesten.length; i++) unten = Math.max(unten, kaesten[i].unten);
        var eineZeile = true;
        for (i = 0; i < kaesten.length; i++) if (unten - kaesten[i].unten > 1) eineZeile = false;

        if (!eineZeile) {
          lege('M' + s.mx + ' ' + unten + 'V' + zielY, true, takt);
          return;
        }
        var y = sammelY(unten, zielY);

        /* DER SAMMLER ALS EIN ZUG, nicht als drei gekreuzte Striche.
           Bis zum 18.08. lagen hier lauter einzelne Teilpfade: aus jeder
           Karte ein Senkrechter hinunter, quer darueber ein Waagerechter.
           Wo die beiden aeusseren aufeinandertrafen, stand eine harte
           rechtwinklige Ecke — und genau die hat der Kunde beanstandet.

           Jetzt laeuft AUSSEN ein durchgehender Zug: aus der linken Karte
           hinunter, gerundet nach rechts, quer hinueber, gerundet wieder
           hinauf in die rechte Karte. Das sind die beiden einzigen echten
           Ecken dieses Sammlers, und beide tragen ECKE.

           Die Karten DAZWISCHEN stossen als T von oben auf den Balken. Ein
           T ist keine Ecke: dort wechselt die Linie nicht die Richtung,
           sondern zweigt ab. Wollte man auch dort runden, muesste man sich
           fuer eine Seite entscheiden — und die Rundung laege unter dem
           durchlaufenden Balken und waere ohnehin nicht zu sehen. Dasselbe
           gilt fuer den Abgang in der Mitte zur naechsten Ebene. */
        var links  = kaesten[0];
        var rechts = kaesten[kaesten.length - 1];
        var spanne = Math.abs(rechts.mx - links.mx);
        var r = Math.max(0, Math.min(ECKE, y - unten, spanne / 2));
        var d;
        if (kaesten.length > 1 && r > 0) {
          d = 'M' + links.mx + ' ' + links.unten +
              'V' + (y - r) +
              bogen(r, false, links.mx + r, y) +
              'H' + (rechts.mx - r) +
              bogen(r, false, rechts.mx, y - r) +
              'V' + rechts.unten;
        } else {
          /* Notbremse: bliebe fuer die Rundung kein Platz, ist ein harter
             Winkel immer noch besser als ein fehlender Balken. */
          d = 'M' + links.mx + ' ' + links.unten + 'V' + y;
          if (kaesten.length > 1) {
            d += 'M' + rechts.mx + ' ' + rechts.unten + 'V' + y +
                 'M' + links.mx + ' ' + y + 'H' + rechts.mx;
          }
        }
        for (i = 1; i < kaesten.length - 1; i++) {
          d += 'M' + kaesten[i].mx + ' ' + kaesten[i].unten + 'V' + y;
        }
        lege(d, false, takt);
        lege('M' + s.mx + ' ' + y + 'V' + zielY, true, takt);
      };

      var oberkante = function (kaesten) {
        var o = Infinity;
        for (var i = 0; i < kaesten.length; i++) o = Math.min(o, kaesten[i].oben);
        return o;
      };

      verbinde(q, oberkante(k) - luft, 3);   /* Quellen  -> Leistungen */
      verbinde(k, z.oben - luft, 8);         /* Leistungen -> Ziel     */
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
