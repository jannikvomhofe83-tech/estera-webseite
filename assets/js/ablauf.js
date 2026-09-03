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

   Also: eine Schiene durch die Ziffernspalte, ein Laeufer, der auf ihr
   nach unten wandert, und die Ziffer, an der er gerade steht, wird
   hervorgehoben. Die Schritte selbst sind von Anfang an sichtbar — dieses
   Skript deckt nichts auf, es zeigt nur den Stand an.

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

  var liste = document.querySelector('.abl__folge');
  if (!liste) return;

  var stufen = Array.prototype.slice.call(liste.querySelectorAll('.abl__stufe'));
  if (stufen.length < 2) return;

  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (ruhig.matches) return;

  liste.setAttribute('data-schiene', 'an');

  var ticket = 0;
  var letzte = -1;

  /* Die Schiene laeuft von der MITTE der ersten Ziffer bis zur MITTE der
     letzten — nicht ueber die ganze Liste. Sonst begaenne sie ueber der 01
     und endete unter der 06, und der Laeufer stuende am Anfang und am Ende
     neben nichts. Die Werte sind Seitenkoordinaten und muessen sich bei
     jeder Groessenaenderung neu rechnen. */
  function schieneMessen() {
    var ersteNr = stufen[0].querySelector('.abl__stufe-nr');
    var letzteNr = stufen[stufen.length - 1].querySelector('.abl__stufe-nr');
    if (!ersteNr || !letzteNr) return null;
    var l = liste.getBoundingClientRect();
    var a = ersteNr.getBoundingClientRect();
    var z = letzteNr.getBoundingClientRect();
    var oben = (a.top - l.top) + a.height / 2;
    var hoehe = ((z.top - l.top) + z.height / 2) - oben;
    liste.style.setProperty('--abl-schiene-oben', oben + 'px');
    liste.style.setProperty('--abl-schiene-hoehe', hoehe + 'px');
    return { oben: oben, hoehe: hoehe };
  }

  function rechnen() {
    ticket = 0;
    var mass = schieneMessen();
    if (!mass || mass.hoehe <= 0) return;

    /* Der Laeufer haengt an einer festen Linie im Fenster — der Kunde
       beschreibt genau das: die Ziffer faehrt mit, waehrend man rollt.
       55 Prozent Fensterhoehe, also etwas unter der Mitte: dort steht der
       Schritt, den man gerade liest, und nicht der, den man schon hinter
       sich hat. */
    var linie = window.innerHeight * 0.55;
    var l = liste.getBoundingClientRect();
    var start = l.top + mass.oben;                  // Fensterkoordinate der 01
    var weg = linie - start;
    var anteil = Math.max(0, Math.min(1, weg / mass.hoehe));
    liste.style.setProperty('--abl-fortschritt', anteil);

    /* Welche Ziffer ist gemeint? Die, deren Mitte der Laeufer zuletzt
       erreicht hat. Ohne die halbe Ziffernhoehe Toleranz schaltete es
       schon um, waehrend der Laeufer noch sichtbar ueber der Ziffer steht —
       genau das „kurz vor 03" aus der Ansage. */
    var laeufer = start + anteil * mass.hoehe;
    var aktiv = 0;
    for (var i = 0; i < stufen.length; i++) {
      var nr = stufen[i].querySelector('.abl__stufe-nr');
      if (!nr) continue;
      var r = nr.getBoundingClientRect();
      if (r.top + r.height / 2 <= laeufer + 2) aktiv = i;
    }

    if (aktiv !== letzte) {
      for (var j = 0; j < stufen.length; j++) {
        if (j === aktiv) stufen[j].setAttribute('data-aktiv', 'true');
        else stufen[j].removeAttribute('data-aktiv');
      }
      /* Der kurze Effekt beim Wechsel: die CSS haengt an diesem Attribut,
         das eine Bildfolge lang gesetzt und dann wieder entfernt wird —
         so laeuft die Bewegung auch dann erneut, wenn man zurueckrollt
         und dieselbe Ziffer noch einmal erreicht. */
      var nr2 = stufen[aktiv].querySelector('.abl__stufe-nr');
      if (nr2) {
        nr2.removeAttribute('data-puls');
        void nr2.offsetWidth;
        nr2.setAttribute('data-puls', 'true');
      }
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
