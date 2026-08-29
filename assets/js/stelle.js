/* ===========================================================================
   ESTERA — STELLENSEITEN
   Eine einzige Aufgabe: das Kopfvideo bei prefers-reduced-motion: reduce
   wirklich anhalten.

   Sichtbar ist es dort schon durch stelle.css nicht mehr (display: none,
   darunter steht das Standbild). Ohne Javascript bleibt es genau dabei —
   die Seite ist vollstaendig lesbar und bedienbar. Diese Datei geht einen
   Schritt weiter und stoppt die Wiedergabe auch tatsaechlich, damit im
   Ruhemodus nichts im Hintergrund weiterlaeuft.

   Alles andere auf diesen Seiten ist reines CSS: beide Laufbaender, der
   Aufbau, die Typografie. Genau wie in der Vorlage, die ohne Javascript
   praktisch vollstaendig steht.
   =========================================================================== */
(function () {
  'use strict';

  var video = document.querySelector('.stl-hero__video');
  if (!video || !window.matchMedia) return;

  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');

  function anwenden() {
    if (ruhig.matches) {
      try { video.pause(); } catch (e) {}
      video.removeAttribute('autoplay');
    } else if (video.paused) {
      /* Kehrt der Besucher die Einstellung um, laeuft es wieder an.
         play() gibt in manchen Browsern ein Promise zurueck, das
         abgelehnt werden kann — das ist hier ohne Folgen. */
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    }
  }

  anwenden();

  if (typeof ruhig.addEventListener === 'function') {
    ruhig.addEventListener('change', anwenden);
  } else if (typeof ruhig.addListener === 'function') {
    ruhig.addListener(anwenden);
  }
})();
