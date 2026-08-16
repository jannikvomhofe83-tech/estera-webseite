/* ===========================================================================
   REFERENZOBJEKTE — Umschalter zwischen den beiden Objektarten
   Setzt nur data-art am Abschnitt; das Ein- und Ausblenden der beiden
   Fassungen und die Bewegung des Schiebers loest referenzobjekte.css daraus
   ab. Ohne Javascript bleibt die im HTML gesetzte Fassung sichtbar.
   =========================================================================== */
(function () {
  'use strict';

  var bloecke = document.querySelectorAll('[data-robj]');

  Array.prototype.forEach.call(bloecke, function (block) {
    var knoepfe = block.querySelectorAll('[data-art-knopf]');
    if (!knoepfe.length) return;

    function setzen(knopf) {
      block.setAttribute('data-art', knopf.getAttribute('data-art-knopf'));
      Array.prototype.forEach.call(knoepfe, function (k) {
        k.setAttribute('aria-pressed', String(k === knopf));
      });
    }

    Array.prototype.forEach.call(knoepfe, function (knopf, i) {
      knopf.addEventListener('click', function () { setzen(knopf); });

      /* Pfeiltasten wandern innerhalb der Pille — wie bei einer Gruppe
         zusammengehoeriger Schaltflaechen ueblich. Tab und Leertaste/Enter
         funktionieren ohnehin, weil es echte <button> sind. */
      knopf.addEventListener('keydown', function (e) {
        var richtung = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') richtung = 1;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') richtung = -1;
        if (!richtung) return;
        e.preventDefault();
        var ziel = knoepfe[(i + richtung + knoepfe.length) % knoepfe.length];
        ziel.focus();
        setzen(ziel);
      });
    });
  });
})();
