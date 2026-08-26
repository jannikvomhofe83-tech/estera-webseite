/* ---------------------------------------------------------------------------
   ESTERA — Karriereseite: der Stellen-Aufklapper

   WARUM EINE EIGENE DATEI UND NICHT faq.js
   faq.js bedient bewusst GENAU EINE Wurzel: es sucht mit
   `document.querySelector('[data-faq]')`, nicht mit querySelectorAll. Auf
   dieser Seite ist diese eine Wurzel bereits von den haeufigen Fragen
   belegt. Die Stellenliste braucht deshalb ihr eigenes Skript. Es haengt
   an [data-stellen] und ruehrt nichts an, was faq.js gehoert — die
   Merkmalsnamen (data-stelle-knopf statt data-faq-knopf) sind bewusst
   verschieden, damit sich die beiden nicht gegenseitig finden koennen.

   WARUM UEBERHAUPT JAVASCRIPT UND KEIN <details>
   Dieselbe Begruendung wie in faq.js: das Aufklappen soll weich in der
   Hoehe laufen, und das Projektmuster dafuer ist
   `grid-template-rows: 0fr -> 1fr`. <details> kann das nicht.

   OHNE JAVASCRIPT
   Steht im HTML ALLES offen: aria-expanded="true", data-offen="true".
   Die Zuklapp-Regeln in karriere.css haengen an
   .kar-stellen[data-js='an'], und dieses Merkmal setzt erst diese Datei.
   Faellt das Skript aus, ist die Section eine vollstaendig lesbare
   Stellenanzeige — nie eine leere Karte.

   ZUKLAPPEN BEIM START
   Genau einmal, direkt nach dem Setzen von data-js, und OHNE Bewegung:
   der Besucher soll die Karte nicht erst zulaufen sehen. Dafuer wird fuer
   einen Bilddurchlauf `transition: none` gesetzt (data-start="true") und
   danach wieder freigegeben.

   ES IST DERZEIT GENAU EINE STELLE AUSGESCHRIEBEN. Das Skript ist
   trotzdem fuer mehrere gebaut — kommt eine zweite Karte ins Markup,
   findet es sie von selbst. „Nur einer offen" ist deshalb hier
   ausgeschaltet: bei einer einzigen Karte waere die Regel wirkungslos,
   und bei zweien ist der Vergleich zweier Stellen der haeufigere Fall.

   SPRUNG AUS DEM SEITENKOPF
   Der Knopf im Kopfbereich fuehrt auf #stellen. Landet jemand ueber
   einen solchen Sprung hier, soll die Karte offen sein — sonst springt
   er auf eine zugeklappte Zeile und sieht nichts.

   ESCAPE
   Schliesst die offene Karte und legt den Fokus zurueck auf deren Knopf.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var wurzel = document.querySelector('[data-stellen]');
  if (!wurzel) return;

  var knoepfe = Array.prototype.slice.call(wurzel.querySelectorAll('[data-stelle-knopf]'));
  if (!knoepfe.length) return;

  /* Zu jedem Knopf sein Fach. Der Bezug laeuft ueber aria-controls und
     nicht ueber die Nachbarschaft im Baum — so bleibt beides
     zwangslaeufig synchron: was die Hilfstechnik liest, ist genau das,
     was bewegt wird. Findet sich zu einem Knopf kein Fach, bleibt er
     unangetastet; lieber ein Knopf ohne Funktion als ein Absturz, der
     die ganze Section lahmlegt. */
  var paare = [];
  knoepfe.forEach(function (knopf) {
    var id = knopf.getAttribute('aria-controls');
    var fach = id ? document.getElementById(id) : null;
    if (fach) paare.push({ knopf: knopf, fach: fach });
  });
  if (!paare.length) return;

  var zuFach = function (knopf) {
    for (var i = 0; i < paare.length; i++) {
      if (paare[i].knopf === knopf) return paare[i].fach;
    }
    return null;
  };

  var istOffen = function (knopf) {
    return knopf.getAttribute('aria-expanded') === 'true';
  };

  var setzen = function (knopf, offen) {
    var fach = zuFach(knopf);
    if (!fach) return;
    knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
    fach.setAttribute('data-offen', offen ? 'true' : 'false');
  };

  /* --- Schaltbetrieb einschalten ----------------------------------------
     BEI GENAU EINER STELLE BLEIBT DIE KARTE OFFEN. Das ist eine bewusste
     Abweichung von der Vorlage, die zwei Stellen fuehrt und beide
     zuklappt. Bei einer einzigen Karte waere der ganze Abschnitt sonst
     eine einzelne zugeklappte Zeile in einem hellen Band — der Besucher
     scrollt daran vorbei und erfaehrt nicht, dass es ueberhaupt eine
     Stelle gibt. Der Aufklapper bleibt trotzdem in Betrieb: er ist
     bedienbar, und sobald eine zweite Karte im Markup steht, faehrt
     dieser Zweig automatisch wieder alles zu.

     Zugeklappt wird ohne Bewegung (data-start sperrt die
     Ueberblendungen fuer einen Bilddurchlauf) — der Besucher soll die
     Karten nicht erst zulaufen sehen. */
  wurzel.setAttribute('data-start', 'true');
  wurzel.setAttribute('data-js', 'an');
  if (paare.length > 1) {
    paare.forEach(function (p) { setzen(p.knopf, false); });
  }

  /* Zwei Bilddurchlaeufe warten, dann die Ueberblendungen freigeben. Einer
     reicht in Chromium, nicht zuverlaessig in Safari. */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { wurzel.removeAttribute('data-start'); });
  });

  /* --- Bedienung -------------------------------------------------------- */
  paare.forEach(function (p) {
    p.knopf.addEventListener('click', function () {
      setzen(p.knopf, !istOffen(p.knopf));
    });
  });

  wurzel.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    for (var i = 0; i < paare.length; i++) {
      if (istOffen(paare[i].knopf)) {
        setzen(paare[i].knopf, false);
        paare[i].knopf.focus();
        e.preventDefault();
        return;
      }
    }
  });

  /* --- Sprung von aussen ------------------------------------------------
     Der Knopf im Kopfbereich und der im Abschnitt „Fuer wen Estera passt"
     fuehren beide auf #stellen. Bei genau einer Karte steht sie ohnehin
     offen; hat jemand sie zwischendurch zugeklappt, geht sie beim Sprung
     wieder auf. Bei mehreren Karten wird nichts aufgerissen — dann soll
     der Besucher die Liste sehen und selbst waehlen. */
  var oeffneErste = function () {
    if (paare.length === 1) setzen(paare[0].knopf, true);
  };
  var pruefeSprung = function () {
    if (location.hash === '#stellen') oeffneErste();
  };
  pruefeSprung();
  window.addEventListener('hashchange', pruefeSprung);

  /* Auch der Knopf im Seitenkopf und der im Abschnitt „Fuer wen Estera
     passt" fuehren auf #stellen. Steht der Anker schon in der Adresse,
     loest hashchange nicht aus — deshalb zusaetzlich am Klick. */
  Array.prototype.forEach.call(
    document.querySelectorAll('a[href="#stellen"]'),
    function (a) { a.addEventListener('click', oeffneErste); }
  );
})();
