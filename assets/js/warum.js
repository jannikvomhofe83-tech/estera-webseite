/* ===========================================================================
   WARUM IMMOBILIEN?   (#warum-immobilien)

   Neu geschrieben am 25.08.2026. Gehoert zu
   <section class="wi" id="warum-immobilien"> und assets/css/warum.css.

   WAS DIESE DATEI TUT — und sonst nichts
   Die vier Erklaertexte stehen im Dokument offen untereinander. Diese
   Datei blendet sie aus und zeigt genau einen davon — so wie auf der
   aktiven Vorlage. Beim Laden ist „01 Bankkapital" aktiv; das steht so
   im Kundenbriefing Briefing/interaktion-vier-kraefte.md vom 25.08.2026.
   Das Erklaerfeld wird nie auf- oder zugeklappt, es tauscht nur seinen
   Inhalt — ein zweites Antippen derselben Karte aendert deshalb nichts.

   OHNE JAVASCRIPT
   passiert nichts davon: alle vier Texte stehen offen da, die Karten und
   die Reiter sind gewoehnliche Links auf diese Texte. Kein toter Knopf,
   kein leerer Kasten.

   BEI prefers-reduced-motion: reduce
   bleibt es ebenfalls beim offenen Zustand. Der Abschnitt bewegt sich
   dann ueberhaupt nicht.

   Es gibt hier keine Animation, kein Aufdecken beim Scrollen und keinen
   Zeitgeber. Was die Vorlage nicht zeigt, steht auch nicht hier.
   =========================================================================== */
(function () {
  'use strict';

  var wi = document.querySelector('.wi#warum-immobilien');
  if (!wi) return;

  var liste = wi.querySelector('[data-wi-texte]');
  if (!liste) return;

  var texte = Array.prototype.slice.call(liste.querySelectorAll('[data-wi-text]'));
  var schalter = Array.prototype.slice.call(wi.querySelectorAll('[data-wi-punkt]'));
  if (!texte.length || !schalter.length) return;

  /* Ruhig bedeutet ruhig: bei reduzierter Bewegung bleibt alles offen. */
  var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ruhig) return;

  wi.setAttribute('data-js', 'an');

  var offen = null;

  function zeigen(nr) {
    offen = nr;

    texte.forEach(function (t) {
      var an = t.getAttribute('data-wi-text') === nr;
      if (an) { t.removeAttribute('hidden'); } else { t.setAttribute('hidden', ''); }
    });

    schalter.forEach(function (s) {
      var an = s.getAttribute('data-wi-punkt') === nr;
      s.setAttribute('aria-expanded', an ? 'true' : 'false');
      /* Die gewaehlte Karte ist auch fuer Vorlesesoftware die aktuelle —
         01.09.2026, Optimierungsbriefing, Abschnitt 05 („Aktiver Zustand
         der ausgewaehlten Karte klar markieren", tastaturbedienbar).
         aria-expanded sagt, dass sie etwas geoeffnet hat; aria-current
         sagt, dass sie die gewaehlte von vieren ist. Beides zusammen ist
         das, was der Navyrahmen sichtbar macht. */
      if (an) { s.setAttribute('aria-current', 'true'); }
      else if (s.classList.contains('wi__karte')) { s.removeAttribute('aria-current'); }
      /* Die goldene Marke im Reiterband folgt dem angetippten Punkt.
         Steht keiner offen, bleibt sie wie auf der ruhenden Vorlage
         unter dem ersten Reiter stehen. */
      if (s.parentNode && s.parentNode.parentNode &&
          s.parentNode.parentNode.tagName === 'OL') {
        var markiert = nr ? an : s.getAttribute('data-wi-punkt') === '01';
        if (markiert) { s.setAttribute('aria-current', 'true'); }
        else { s.removeAttribute('aria-current'); }
      }
    });

    if (nr) { wi.setAttribute('data-wi-offen', nr); }
    else { wi.removeAttribute('data-wi-offen'); }
  }

  /* Nach dem Antippen muss die Tafel auch zu SEHEN sein — 01.09.2026,
     Optimierungsbriefing, Abschnitt 05: „Beim Klick wird der zugehoerige
     Detailbereich direkt unterhalb eingeblendet beziehungsweise
     angesprungen." Am Schreibtisch steht die Tafel unmittelbar unter dem
     Feld und ist ohnehin im Bild; dann passiert hier nichts. Auf dem
     Telefon stehen die vier Karten untereinander, und wer die erste
     antippt, hat die Tafel drei Karten weiter unten — dann rollt die Seite
     so weit, dass die Tafel ganz im Fenster steht. `nearest` statt
     `start`: es wird nur so weit gerollt wie noetig, nichts springt an den
     Fensterrand. Bei angeforderter Ruhe ohne weiche Bewegung. */
  function tafelZeigen(nr) {
    var tafel = null;
    texte.forEach(function (t) { if (t.getAttribute('data-wi-text') === nr) tafel = t; });
    if (!tafel) return;
    var r = tafel.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    if (r.top >= 0 && r.bottom <= h) return;
    var kopf = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    if (r.height + kopf < h) {
      tafel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      tafel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  schalter.forEach(function (s) {
    s.addEventListener('click', function (e) {
      e.preventDefault();
      var nr = s.getAttribute('data-wi-punkt');
      zeigen(nr);
      tafelZeigen(nr);
    });
  });

  /* Ausgangslage: „01 Bankkapital" ist aktiv. */
  zeigen('01');
})();
