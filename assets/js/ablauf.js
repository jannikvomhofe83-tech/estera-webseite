/* ===========================================================================
   DIE ZUSAMMENARBEIT IN FUENF SCHRITTEN — der mitlaufende Schrittstand
   Gehoert ausschliesslich zu Section #zusammenarbeit auf variante-a.html.
   Regeln: assets/css/ablauf.css.

   ---------------------------------------------------------------------------
   WAS DIESE DATEI TUT — UND VOR ALLEM: WAS SIE NICHT TUT
   ---------------------------------------------------------------------------
   SIE TUT genau eines: sie rechnet aus, welcher der fuenf Schritte gerade auf
   Lesehoehe steht, und schreibt das an drei Stellen hin —
     ·  `data-aktiv` an das betreffende <li> (die Goldlinie des Kastens wird
        eine Spur bestimmter),
     ·  `data-aktiv` / `data-vorbei` an die fuenf Marken in der linken Spalte,
     ·  den Klartext „Schritt 03 von 05" in die Standzeile daneben.

   SIE TUT NICHT:
     ·  Sie fasst die STEHENDE LINKE SPALTE nicht an. Die ist reines CSS
        (`position: sticky`, siehe ablauf.css) und braucht kein Javascript.
        Wer hier eines einbaut, macht sie kaputt.
     ·  Sie greift NICHT in das Scrollen ein. Kein Scroll-Hijacking, kein
        Festhalten, kein Vorspulen — der Besucher rollt die Seite, wie er sie
        immer rollt. Diese Datei liest nur mit.
     ·  Sie erzeugt keinen Umbruch und keine Groessenaenderung. Alles, was sie
        umschaltet, ist Farbe. Die Standzeile hat in ablauf.css eine feste
        Mindestbreite, damit auch sie nichts verschiebt.

   ---------------------------------------------------------------------------
   OHNE JAVASCRIPT
   ---------------------------------------------------------------------------
   Der Abschnitt steht vollstaendig. Die Standzeile traegt im Markup den
   neutralen Text „Fünf Schritte", die Marken stehen alle ruhend, kein Kasten
   ist hervorgehoben. Es fehlt also eine Beigabe, kein Inhalt — die geordnete
   Liste sagt ohnehin alles, und der Stand ist im Markup aria-hidden.

   ---------------------------------------------------------------------------
   BEI prefers-reduced-motion
   ---------------------------------------------------------------------------
   Die Rechnung laeuft weiter. Sie ist keine Bewegung: es wechselt eine Farbe
   und eine Zahl, und ablauf.css nimmt in diesem Fall die Ueberblendung heraus,
   sodass der Wechsel hart und ohne jedes Wandern geschieht. Abzuschalten waere
   hier nichts gewonnen — der Stand ist eine Orientierungshilfe und gerade
   dann nuetzlich, wenn man Bewegung meidet.

   ---------------------------------------------------------------------------
   DIE RECHNUNG IST ZUSTANDSFREI
   ---------------------------------------------------------------------------
   Aktiv ist der LETZTE Schritt, dessen Kastenoberkante die Leselinie bei 42 %
   der Fensterhoehe schon passiert hat; hat noch keiner sie passiert, ist es
   der erste. Es wird nichts gespeichert und nichts hochgezaehlt. Rueckwaerts
   gescrollt faellt der Wert deshalb exakt genauso zurueck, wie er
   hochgelaufen ist — es kann nichts haengenbleiben und nichts „ueberspringen".
   =========================================================================== */
(function () {
  'use strict';

  var sec = document.querySelector('[data-zab]');
  if (!sec) return;

  var glieder = Array.prototype.slice.call(sec.querySelectorAll('[data-zab-glied]'));
  var marken  = Array.prototype.slice.call(sec.querySelectorAll('[data-zab-marke]'));
  var zeile   = sec.querySelector('[data-zab-stand-text]');
  if (!glieder.length) return;

  var n = glieder.length;

  /* Der zuletzt geschriebene Stand. Er dient allein dazu, ueberfluessige
     Schreibzugriffe zu vermeiden — gerechnet wird immer neu. -1 heisst
     „noch nichts geschrieben". */
  var gesetzt = -1;

  /* Zweistellig, wie die Zaehlung in den Kaesten: „Schritt 03 von 05". */
  var zwei = function (z) { return (z < 10 ? '0' : '') + z; };

  var schreiben = function (i) {
    if (i === gesetzt) return;
    gesetzt = i;

    for (var k = 0; k < n; k++) {
      if (k === i) glieder[k].setAttribute('data-aktiv', '');
      else         glieder[k].removeAttribute('data-aktiv');
    }
    for (var m = 0; m < marken.length; m++) {
      if (m === i) { marken[m].setAttribute('data-aktiv', ''); marken[m].removeAttribute('data-vorbei'); }
      else if (m < i) { marken[m].removeAttribute('data-aktiv'); marken[m].setAttribute('data-vorbei', ''); }
      else { marken[m].removeAttribute('data-aktiv'); marken[m].removeAttribute('data-vorbei'); }
    }
    if (zeile) zeile.textContent = 'Schritt ' + zwei(i + 1) + ' von ' + zwei(n);
  };

  var messen = function () {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (!vh) return;

    /* Die Leselinie. 42 % der Fensterhoehe: hoch genug, dass der Kasten schon
       gut im Bild steht, wenn er den Stand uebernimmt, und tief genug, dass
       der Wechsel nicht erst geschieht, wenn der Kasten oben wieder
       hinauslaeuft. */
    var linie = vh * 0.42;

    var i = 0;
    for (var k = 0; k < n; k++) {
      /* EIN getBoundingClientRect je Kasten und Bild. Bei fuenf Kaesten ist
         das billig; ein Zwischenspeicher waere hier nur eine weitere
         Fehlerquelle, weil sich die Hoehen mit der Fensterbreite aendern. */
      if (glieder[k].getBoundingClientRect().top <= linie) i = k;
    }
    schreiben(i);
  };

  /* --- Drosselung auf ein Bild --------------------------------------------
     Scroll-Ereignisse kommen deutlich haeufiger als Bilder gezeichnet werden.
     Gerechnet wird hoechstens einmal je Bild, passiv angemeldet, damit das
     Rollen nicht blockiert werden kann. */
  var wartet = false;
  var anstossen = function () {
    if (wartet) return;
    wartet = true;
    requestAnimationFrame(function () { wartet = false; messen(); });
  };

  /* --- An- und Abmelden ---------------------------------------------------
     Ist der Abschnitt gar nicht im Bild, muss auch nichts gerechnet werden.
     Der Beobachter meldet den Zuhoerer an, sobald der Abschnitt herankommt,
     und wieder ab, sobald er weg ist. Der zuletzt geschriebene Stand bleibt
     dabei stehen — er ist an der Grenze ohnehin der geometrisch richtige
     Randwert (erster oder letzter Schritt).

     Kein IntersectionObserver im Browser: dann laeuft der Zuhoerer eben
     dauerhaft. Fuenf Rechtecke je Bild sind auch das kein Problem. */
  var hoert = false;
  var an = function () {
    if (hoert) return;
    hoert = true;
    window.addEventListener('scroll', anstossen, { passive: true });
    window.addEventListener('resize', anstossen);
    messen();
  };
  var ab = function () {
    if (!hoert) return;
    hoert = false;
    window.removeEventListener('scroll', anstossen);
    window.removeEventListener('resize', anstossen);
  };

  if (!('IntersectionObserver' in window)) { an(); return; }

  var obs = new IntersectionObserver(function (eintraege) {
    for (var e = 0; e < eintraege.length; e++) {
      if (eintraege[e].isIntersecting) an(); else ab();
    }
  }, { rootMargin: '25% 0px 25% 0px' });
  obs.observe(sec);

  /* Schriften kommen spaeter als das Markup. Danach stehen die Kaesten an
     anderer Stelle und der Stand muss neu gerechnet werden. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    if (hoert) messen();
  });
})();
