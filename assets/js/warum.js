/* ===========================================================================
   WARUM IMMOBILIEN?  (#warum-immobilien)

   Neu geschrieben am 24.08.2026. Gehoert zu
   <section class="wimm" id="warum-immobilien"> und assets/css/warum.css.

   Die vorige Fassung war die Maschinerie hinter der klebenden Buehne:
   Scrollmessung, Wechsel des aktiven Vorteils, Farbwisch, Anfangs-
   zustaende. Mit dem Wording-Master ist diese Bauart entfallen; ihr Code
   steht in der Versionsgeschichte.

   WAS HIER NOCH GESCHIEHT — und was ausdruecklich nicht
   Der Abschnitt hat nichts zum Umschalten. Kein Reiter, kein Pfeil, kein
   Aufklapper. Der Wortlaut ist bindend und steht vollstaendig im
   Dokument; es gibt nichts auszublenden und damit auch keinen Knopf, der
   ohne Javascript tot waere.
   Uebrig bleibt eine einzige Aufgabe: die Bloecke beim Hereinscrollen
   aufdecken.

   DER SCHALTER data-js="an"
   Saemtliche Startzustaende in warum.css haengen an diesem Attribut.
   Gesetzt wird es NUR, wenn beides zutrifft:
     — es gibt einen IntersectionObserver, und
     — `prefers-reduced-motion` steht nicht auf `reduce`.
   Faellt eines davon weg oder laeuft ueberhaupt kein Javascript, wird das
   Attribut nie gesetzt. Dann greift keine Regel des Aufdeck-Blocks, und
   der Abschnitt steht von Anfang an vollstaendig sichtbar da. Es gibt
   keinen Weg, auf dem hier Inhalt unsichtbar haengen bleiben koennte.

   Wer die Bewegung mitten im Besuch abschaltet, bekommt das ueber den
   Listener am MediaQueryList mit: data-js faellt dann weg, und alles
   steht sofort.
   =========================================================================== */
(function () {
  'use strict';

  var abschnitt = document.querySelector('.wimm');
  if (!abschnitt) return;

  var bloecke = abschnitt.querySelectorAll('[data-wi-block]');
  if (!bloecke.length) return;

  // Ohne Observer bleibt es beim sichtbaren Grundzustand.
  if (!('IntersectionObserver' in window)) return;

  var mq = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  var beobachter = null;

  function alleZeigen() {
    Array.prototype.forEach.call(bloecke, function (el) {
      el.setAttribute('data-sicht', 'an');
    });
  }

  function anschalten() {
    abschnitt.setAttribute('data-js', 'an');

    beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-sicht', 'an');
        beobachter.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(bloecke, function (el) {
      beobachter.observe(el);
    });
  }

  function abschalten() {
    if (beobachter) { beobachter.disconnect(); beobachter = null; }
    abschnitt.removeAttribute('data-js');
    alleZeigen();
  }

  if (mq && mq.matches) {
    // Bewegung ist abbestellt: gar nicht erst einschalten.
    alleZeigen();
  } else {
    anschalten();
  }

  if (mq) {
    var wechsel = function () {
      if (mq.matches) { abschalten(); }
      else if (!beobachter) { anschalten(); }
    };
    if (mq.addEventListener) { mq.addEventListener('change', wechsel); }
    else if (mq.addListener) { mq.addListener(wechsel); }
  }
})();
