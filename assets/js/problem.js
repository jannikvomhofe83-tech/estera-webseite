/* ---------------------------------------------------------------------------
   ESTERA — Problem-Section (#problem)

   Eine einzige Aufgabe: den Scrollfortschritt am Schaubild messen und ihn
   als Zahl zwischen 0 und 1 in die Eigenschaft --pr-p schreiben. Was
   daraus wird — schmalere Abfluesse, kraeftigeres Gold — entscheidet
   allein assets/css/problem.css.

   DER SCHALTER. Die Scrollkopplung haengt vollstaendig an dem Merkmal
   `data-pr-js`, das ausschliesslich diese Datei setzt. Laedt sie nicht,
   ist Javascript aus oder wuenscht der Besucher weniger Bewegung, greift
   keine der gekoppelten Regeln: die Abfluesse stehen dann in ihrem
   ENDZUSTAND, also schmal, und das Gold steht voll da. Der Abschnitt ist
   damit in jedem Fall vollstaendig und in sich schluessig — er wartet nie
   auf ein Skript.

   KEIN SCROLL-HIJACKING. Das Skript liest die Scrollposition, es
   veraendert sie nie. Kein `scrollTo`, kein Abfangen von Radereignissen,
   kein Kleben.

   REVERSIBEL OHNE ZUTUN. Der Fortschritt wird bei jedem Bild neu aus der
   Geometrie gerechnet, es wird nichts gespeichert und nichts akkumuliert.
   Beim Zurueckscrollen faellt der Wert deshalb genauso, wie er gestiegen
   ist — die Abfluesse werden wieder breiter. Es kann nichts haengen
   bleiben, auch nicht nach einem Sprung ueber eine Ankermarke.

   GENAU EIN getBoundingClientRect() JE BILD, und die Messung selbst
   haengt an requestAnimationFrame. Geschrieben wird nur bei einer echten
   Aenderung des auf 0.5 Prozent gerundeten Wertes.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var sec = document.querySelector('[data-pr]');
  if (!sec) return;

  var figur = sec.querySelector('[data-pr-figur]');
  if (!figur) return;

  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Letzter geschriebener Wert. -1 ist absichtlich ausserhalb von [0,1],
     damit das erste Messen in jedem Fall schreibt. */
  var letzter = -1;

  var messen = function () {
    var r  = figur.getBoundingClientRect();      /* EIN Aufruf je Bild */
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (!vh) return;

    /* Gemessen wird an der MITTE des Schaubilds, nicht an einer Kante.
       An der Oberkante gemessen waere der Weg kuerzer als das Schaubild
       hoch ist — die Abfluesse waeren fertig geschrumpft, bevor man sie
       ganz gesehen hat.

         Mitte auf 88 % der Fensterhoehe  ->  0   (Abfluesse voll breit)
         Mitte auf 34 % der Fensterhoehe  ->  1   (Endzustand, schmal)

       Der Weg betraegt damit 54 Prozent der Fensterhoehe, bei 1080 px
       also rund 580 px Scrollstrecke. Das Schrumpfen ist genau dann
       fertig, wenn das Schaubild ins obere Drittel gewandert ist und der
       goldene Uebergang darunter in den Blick kommt.
       Reine Geometrie, kein gespeicherter Zustand — siehe Kopf. */
    var mitte = r.top + r.height / 2;
    var p = (vh * 0.88 - mitte) / (vh * 0.54);
    if (p < 0) p = 0; else if (p > 1) p = 1;

    /* Auf 0.5 Prozent gerundet. Der Unterschied ist bei einem 192
       Einheiten breiten Abfluss unter einem Zehntel Pixel und damit
       unsichtbar; es spart aber den grossen Teil der Schreibzugriffe.
       Die verbleibende Stufigkeit glaettet der 140-ms-Uebergang in
       problem.css. */
    p = Math.round(p * 200) / 200;
    if (p === letzter) return;
    letzter = p;
    sec.style.setProperty('--pr-p', p);
  };

  var wartet = false;
  var anstossen = function () {
    if (wartet) return;
    wartet = true;
    requestAnimationFrame(function () { wartet = false; messen(); });
  };

  var hoeren = false;

  var einschalten = function () {
    if (hoeren) return;
    hoeren = true;
    /* Merkmal UND Startwert im selben Durchlauf. Dazwischen kann der
       Browser nicht zeichnen — es gibt deshalb kein Bild, in dem die
       gekoppelte Regel schon gilt, der Fortschritt aber noch fehlt. */
    sec.setAttribute('data-pr-js', 'an');
    messen();
    window.addEventListener('scroll', anstossen, { passive: true });
    window.addEventListener('resize', anstossen);
    /* Die Schriften kommen spaeter als das Markup. Danach steht der
       Abschnitt an einer anderen Stelle und der Fortschritt muss neu
       gerechnet werden. */
    window.addEventListener('load', messen);
  };

  var ausschalten = function () {
    if (!hoeren) return;
    hoeren = false;
    sec.removeAttribute('data-pr-js');           /* Endzustand, ungekoppelt */
    sec.style.removeProperty('--pr-p');
    letzter = -1;
    window.removeEventListener('scroll', anstossen);
    window.removeEventListener('resize', anstossen);
    window.removeEventListener('load', messen);
  };

  var schalten = function () { if (ruhig.matches) ausschalten(); else einschalten(); };
  schalten();
  if (ruhig.addEventListener)   ruhig.addEventListener('change', schalten);
  else if (ruhig.addListener)   ruhig.addListener(schalten);
})();
