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
