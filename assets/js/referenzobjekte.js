/* ===========================================================================
   MUSTERWOHNUNG — Abschnitt #referenzobjekte

   STAND 25.08.2026. Neu gesetzt nach der Bildvorlage Bilder/referenz-neu-A.png.
   Diese Datei regelt zwei Dinge, mehr nicht:

     1. DAS VIDEO. Es steht still, mit seinem Standbild und dem Abspielknopf
        aus der Vorlage. Erst ein Klick startet es — von selbst laeuft hier
        nichts. Das Video ist das vorhandene assets/video/referenz-wohnung.*,
        unveraendert; ausgetauscht oder neu erzeugt wurde nichts.

     2. DIE DREI ANSICHTEN. Pfeile und Punkte blaettern die Karte links unten
        weiter. Das Video bleibt dabei stehen, es liegt nur eine Aufnahme vor.

   OHNE JAVASCRIPT bleibt alles lesbar und bedienbar: das <video> traegt im
   Markup controls und laesst sich normal starten, Karte 01 steht, und die
   Blaetterelemente bleiben hidden — ein Knopf, der nichts tut, waere eine
   Zumutung. Erst dieses Skript nimmt das hidden weg und uebernimmt.
   =========================================================================== */

(function () {
  'use strict';

  var bloecke = document.querySelectorAll('[data-robj]');
  if (!bloecke.length) return;

  Array.prototype.forEach.call(bloecke, function (block) {

    /* --- Video und Abspielknopf ------------------------------------------ */

    var film    = block.querySelector('.robj__film');
    var knopf   = block.querySelector('[data-robj-play].robj__play');
    var auslpr  = block.querySelectorAll('[data-robj-play]');

    if (film && knopf) {
      // Solange der gezeichnete Knopf steht, braucht es die Leiste des
      // Browsers nicht. Sie kommt zurueck, sobald das Video laeuft.
      film.removeAttribute('controls');
      knopf.hidden = false;

      var starten = function () {
        film.setAttribute('controls', '');
        knopf.hidden = true;
        var p = film.play();
        if (p && typeof p.catch === 'function') {
          // Verweigert der Browser das Abspielen, kommt der Knopf zurueck.
          p.catch(function () { knopf.hidden = false; });
        }
      };

      Array.prototype.forEach.call(auslpr, function (el) {
        el.addEventListener('click', starten);
      });

      // Haelt jemand das Video an, ist der Knopf wieder da.
      film.addEventListener('pause', function () {
        if (!film.ended) return;
        knopf.hidden = false;
      });
    }

    /* --- Die drei Ansichten ---------------------------------------------- */

    var karten  = block.querySelectorAll('[data-robj-karte]');
    var punkte  = block.querySelectorAll('[data-robj-punkt]');
    var leiste  = block.querySelector('.robj__punkte');
    var zurueck = block.querySelector('[data-robj-zurueck]');
    var vor     = block.querySelector('[data-robj-vor]');

    if (karten.length < 2) return;

    var stand = 0;

    function setzen(i, fokus) {
      stand = (i + karten.length) % karten.length;

      Array.prototype.forEach.call(karten, function (k, n) {
        k.hidden = (n !== stand);
      });

      Array.prototype.forEach.call(punkte, function (p, n) {
        var an = (n === stand);
        p.classList.toggle('is-an', an);
        if (an) { p.setAttribute('aria-current', 'true'); }
        else    { p.removeAttribute('aria-current'); }
        if (an && fokus) p.focus();
      });
    }

    if (leiste) leiste.hidden = false;
    if (zurueck) {
      zurueck.hidden = false;
      zurueck.addEventListener('click', function () { setzen(stand - 1); });
    }
    if (vor) {
      vor.hidden = false;
      vor.addEventListener('click', function () { setzen(stand + 1); });
    }

    Array.prototype.forEach.call(punkte, function (p, n) {
      p.addEventListener('click', function () { setzen(n); });
      p.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault(); setzen(stand + 1, true);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault(); setzen(stand - 1, true);
        } else if (e.key === 'Home') {
          e.preventDefault(); setzen(0, true);
        } else if (e.key === 'End') {
          e.preventDefault(); setzen(karten.length - 1, true);
        }
      });
    });

    setzen(0);
  });

}());
