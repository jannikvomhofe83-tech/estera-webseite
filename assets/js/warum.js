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

  schalter.forEach(function (s) {
    s.addEventListener('click', function (e) {
      e.preventDefault();
      zeigen(s.getAttribute('data-wi-punkt'));
    });
  });

  /* Ausgangslage: „01 Bankkapital" ist aktiv. */
  zeigen('01');
})();
