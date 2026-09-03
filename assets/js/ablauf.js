/* ===========================================================================
   UNSER ABLAUF — Section #ablauf
   Angelegt 25.08.2026, neu geschrieben 30.08.2026, erweitert 01.09.2026.

   WAS HIER FRUEHER STAND
   Bis zum 30.08.2026 waren die fuenf Schritte eine Liste mit einem
   Einzelheitenblock daneben, und dieses Skript hat den Block beim Rollen
   durchgeschaltet — rund 230 Zeilen mit eigener Laufstrecke und
   Klebepunkt. Danach war die Datei leer: die Karten stapelten sich allein
   ueber `position: sticky`, ein Skript war nicht noetig.

   WAS JETZT GILT — DIE FORTSCHRITTSSCHIENE
   Kundenwunsch vom 01.09.2026, woertlich:
     „Ich will, dass du die Punkte 01 bis 06 mit einem Strich verbindest,
      der immer mitgeht, wenn man scrollt, sodass man immer weiss, bei
      welchem Punkt man gerade ist. Die Punkte sollen nicht nacheinander
      aufploppen, sondern schon gleich sichtbar sein. Das 01 faehrt beim
      Scrollen nach unten, bis es an 02 stoesst, und wird dann zu 02 …
      Immer wenn man bei der naechsten Zahl ist, gibt es einen kurzen
      Effekt."

   ZWEITE FASSUNG, gleicher Tag. Die erste machte aus der Ziffer an Ort und
   Stelle eine Kreisscheibe. Der Kunde: „Das 01 soll nicht in einem Kreis
   sein. Das 01 soll auf dem Strich nach unten fahren, bis es bei 02 ist."
   Jetzt wandert eine EIGENE Ziffer auf der Schiene; die feste Ziffer, auf
   der sie gerade sitzt, tritt zurueck, damit die Zahl nicht doppelt steht.
   Ausserdem liegt die Schiene auf der ZIFFERNMITTE — gemessen, nicht auf
   der Mitte der Spalte, denn die Ziffern stehen linksbuendig darin.
   Die Schritte selbst sind von Anfang an sichtbar; dieses Skript deckt
   nichts auf, es zeigt nur den Stand an.

   WARUM MIT SKRIPT UND NICHT MIT `animation-timeline`
   Rollgebundene Animationen in reiner CSS koennen das inzwischen, aber
   nicht ueberall — und der Laeufer muss zusaetzlich WISSEN, an welcher der
   sechs Ziffern er steht, um sie umzuschalten. Das ist eine Entscheidung,
   keine Interpolation.

   ZWEI DINGE, DIE HIER ABSICHT SIND
   1. Gerechnet wird nur in `requestAnimationFrame`, nie im Rollhorcher
      selbst. Sonst rechnet der Browser bei jedem Rollpunkt mehrfach.
   2. Ohne Javascript und bei `prefers-reduced-motion: reduce` passiert
      nichts: die Schiene bleibt dann ungefuellt und alle Ziffern stehen
      gleichwertig da — der Abschnitt ist ohne den Laeufer vollstaendig
      lesbar, er ist Zugabe und nicht Traeger.
   =========================================================================== */
(function () {
  'use strict';

  var spur = document.querySelector('.abl__spur');
  var liste = spur && spur.querySelector('.abl__folge');
  var laeufer = spur && spur.querySelector('.abl__laeufer');
  if (!spur || !liste || !laeufer) return;

  var stufen = Array.prototype.slice.call(liste.querySelectorAll('.abl__stufe'));
  if (stufen.length < 2) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  spur.setAttribute('data-schiene', 'an');
  laeufer.textContent = stufen[0].querySelector('.abl__stufe-nr').textContent.trim();

  var ticket = 0;
  var letzte = -1;

  /* Alle Masse in Koordinaten der Spur. Sie muessen sich bei jeder
     Groessenaenderung neu rechnen — Schriftgrade und Spaltenbreiten haengen
     an Fenstermassen. */
  function messen() {
    var ersteNr = stufen[0].querySelector('.abl__stufe-nr');
    var letzteNr = stufen[stufen.length - 1].querySelector('.abl__stufe-nr');
    if (!ersteNr || !letzteNr) return null;

    var s = spur.getBoundingClientRect();
    var a = ersteNr.getBoundingClientRect();
    var z = letzteNr.getBoundingClientRect();

    /* Die WAAGRECHTE Lage der Schiene ist die Mitte der Ziffer selbst, nicht
       die Mitte ihrer Spalte: die Ziffern stehen linksbuendig in einer
       breiteren Spalte, die Spaltenmitte laege sichtbar daneben. Weil „01"
       und „06" gleich breit gesetzt sind (tabular-nums), genuegt eine
       Messung. */
    var x = (a.left - s.left) + a.width / 2;
    var oben = (a.top - s.top) + a.height / 2;
    var hoehe = ((z.top - s.top) + z.height / 2) - oben;

    spur.style.setProperty('--abl-schiene-x', x + 'px');
    spur.style.setProperty('--abl-schiene-oben', oben + 'px');
    spur.style.setProperty('--abl-schiene-hoehe', hoehe + 'px');
    return { oben: oben, hoehe: hoehe };
  }

  function rechnen() {
    ticket = 0;
    var mass = messen();
    if (!mass || mass.hoehe <= 0) return;

    /* Der Laeufer haengt an einer festen Linie im Fenster — genau das meint
       „faehrt beim Scrollen nach unten". 55 Prozent Fensterhoehe, also
       etwas unter der Mitte: dort steht der Schritt, den man gerade liest,
       nicht der, den man schon hinter sich hat. */
    var linie = window.innerHeight * 0.55;
    var s = spur.getBoundingClientRect();
    var start = s.top + mass.oben;
    var anteil = Math.max(0, Math.min(1, (linie - start) / mass.hoehe));

    spur.style.setProperty('--abl-fortschritt', anteil);
    laeufer.style.top = (mass.oben + anteil * mass.hoehe) + 'px';

    /* Welche Ziffer ist erreicht? Die letzte, deren Mitte der Laeufer
       ueberfahren hat. Die zwei Bildpunkte Toleranz sind der Rundungsrest
       zwischen gemessener und gesetzter Lage. */
    var laufY = start + anteil * mass.hoehe;
    var aktiv = 0;
    for (var i = 0; i < stufen.length; i++) {
      var nr = stufen[i].querySelector('.abl__stufe-nr');
      if (!nr) continue;
      var r = nr.getBoundingClientRect();
      if (r.top + r.height / 2 <= laufY + 2) aktiv = i;
    }

    if (aktiv !== letzte) {
      for (var j = 0; j < stufen.length; j++) {
        if (j === aktiv) stufen[j].setAttribute('data-aktiv', 'true');
        else stufen[j].removeAttribute('data-aktiv');
      }
      laeufer.textContent = stufen[aktiv].querySelector('.abl__stufe-nr').textContent.trim();
      /* Neu setzen erzwingt den Neustart der Bewegung — sonst liefe der
         Ring beim Zurueckrollen auf dieselbe Ziffer nicht noch einmal. */
      laeufer.removeAttribute('data-puls');
      void laeufer.offsetWidth;
      laeufer.setAttribute('data-puls', 'true');
      letzte = aktiv;
    }
  }

  function anfordern() {
    if (!ticket) ticket = requestAnimationFrame(rechnen);
  }

  window.addEventListener('scroll', anfordern, { passive: true });
  window.addEventListener('resize', anfordern);
  window.addEventListener('load', anfordern);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(anfordern);
  anfordern();
})();
