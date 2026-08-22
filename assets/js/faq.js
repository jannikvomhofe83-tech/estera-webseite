/* ---------------------------------------------------------------------------
   ESTERA — FAQ-Aufklapper  (Nachbau der Kundenvorlage, 21.08.2026)

   WARUM UEBERHAUPT JAVASCRIPT UND KEIN <details>
   Das Aufklappen soll weich in der Hoehe laufen. <details> kann das nicht:
   sein Inhalt ist entweder da oder nicht, und `content-visibility` ist in
   den Zielbrowsern noch zu ungleich. Das Projektmuster fuer weiche Hoehen
   ist `grid-template-rows: 0fr -> 1fr` (siehe assets/css/warum.css,
   .wimm__fenster) — dafuer braucht es einen echten <button>, der einen
   Zustand umschaltet. Der Knopf traegt aria-expanded und aria-controls und
   ist von Haus aus mit Tastatur bedienbar (Enter und Leertaste).

   OHNE JAVASCRIPT
   Steht im HTML ALLES offen: aria-expanded="true", data-offen="true", kein
   `hidden`. Die Zuklapp-Regeln in faq.css haengen an .faq[data-js='an'],
   und dieses Merkmal setzt erst diese Datei. Faellt das Skript aus, ist die
   FAQ eine schlichte Liste aus Fragen und Antworten — nie eine leere Seite.

   ZUKLAPPEN BEIM START
   Genau einmal, direkt nach dem Setzen von data-js, und OHNE Bewegung: der
   Besucher soll die Section nicht erst zufahren sehen. Dafuer wird fuer
   einen Bilddurchlauf `transition: none` gesetzt (data-start="true") und
   danach wieder freigegeben.

   EINER OFFEN, NICHT MEHRERE
   Bewusste Entscheidung, in der Vorlage nicht entschieden: bei sechs
   Antworten von je drei bis vier Saetzen waere die Section sonst
   ellenlang, und der Nutzen eines Aufklappers — Uebersicht — waere weg.
   Wer es anders will, aendert unten `nurEinerOffen` auf false.

   ESCAPE
   Schliesst den offenen Punkt und legt den Fokus zurueck auf dessen Knopf.
   Das ist die erwartete Bedienung und steht ausdruecklich im Auftrag.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var nurEinerOffen = true;

  var faq = document.querySelector('[data-faq]');
  if (!faq) return;

  var knoepfe = Array.prototype.slice.call(faq.querySelectorAll('[data-faq-knopf]'));
  if (!knoepfe.length) return;

  /* Zu jedem Knopf sein Fach. Der Bezug laeuft ueber aria-controls und
     nicht ueber die Nachbarschaft im Baum — so bleibt beides zwangslaeufig
     synchron: was die Hilfstechnik liest, ist genau das, was bewegt wird.
     Findet sich zu einem Knopf kein Fach, bleibt er unangetastet; lieber
     ein Knopf ohne Funktion als ein Absturz, der die ganze Section
     lahmlegt. */
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

  /* --- Schaltbetrieb einschalten und alles einmal lautlos zufahren ------- */
  faq.setAttribute('data-start', 'true');   /* sperrt die Ueberblendungen */
  faq.setAttribute('data-js', 'an');
  paare.forEach(function (p) { setzen(p.knopf, false); });

  /* Zwei Bilddurchlaeufe warten: der erste laesst den Browser den neuen,
     zugeklappten Zustand rechnen, der zweite gibt die Bewegung wieder frei.
     Mit nur einem koennte beides im selben Durchlauf zusammenfallen — dann
     liefe der erste Klick ohne Bewegung. */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      faq.removeAttribute('data-start');
    });
  });

  /* --- Klicken ------------------------------------------------------------ */
  paare.forEach(function (p) {
    p.knopf.addEventListener('click', function () {
      var offen = istOffen(p.knopf);
      if (nurEinerOffen && !offen) {
        paare.forEach(function (q) {
          if (q.knopf !== p.knopf) setzen(q.knopf, false);
        });
      }
      setzen(p.knopf, !offen);
    });
  });

  /* --- Escape ------------------------------------------------------------- */
  faq.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    var offene = paare.filter(function (p) { return istOffen(p.knopf); });
    if (!offene.length) return;
    e.stopPropagation();

    /* Liegt der Fokus in einem offenen Fach, wandert er auf dessen Knopf —
       sonst bliebe er auf einem Element, das gleich verschwindet, und der
       Browser wuerde ihn an den Seitenanfang werfen. */
    var ziel = null;
    offene.forEach(function (p) {
      if (p.fach.contains(document.activeElement) || p.knopf === document.activeElement) {
        ziel = p.knopf;
      }
    });
    offene.forEach(function (p) { setzen(p.knopf, false); });
    if (ziel) ziel.focus();
  });
})();
