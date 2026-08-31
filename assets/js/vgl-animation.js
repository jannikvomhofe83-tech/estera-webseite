/* ===========================================================================
   DER AUFBAU DER BEIDEN VERGLEICHSBILDER   (.wi__vgl)

   Gegenstueck zu assets/css/vgl-animation.css. Dort steht, WIE sich die
   Abbildungen aufbauen und warum laengs des Pfeils; hier steht, WANN.

   KUNDENWUNSCH VOM 31.08.2026: beim Erreichen des Abschnitts, und
   zusaetzlich jedes Mal beim Ueberfahren mit der Maus.

   DIE ARBEITSTEILUNG MIT DER CSS
   Das Skript setzt ausschliesslich `data-vgl-lauf` auf die <figure> und
   nimmt es wieder weg. Es schreibt keine Stilwerte. Damit gilt: solange
   das Skript nicht laeuft — Datei blockiert, Fehler weiter oben, alter
   Browser —, steht in der CSS keine Regel, die greift, und die Abbildung
   ist vollstaendig zu sehen.

     (kein Attribut)  Ruhezustand, keine Maske, Bild ganz sichtbar
     bereit           scharf gestellt, Bild verdeckt, laeuft noch nicht
     lauf             die Bewegung laeuft

   `bereit` gibt es, weil die Abbildungen weit unten auf der Seite
   stehen. Sie werden schon beim Laden verdeckt, also lange bevor jemand
   hinsehen kann. Wuerde erst der Beobachter verdecken, saehe man die
   Abbildung erst fertig und dann verschwinden.
   =========================================================================== */

(function () {
  'use strict';

  var figuren = document.querySelectorAll('.wi__vgl[data-vgl]');
  if (!figuren.length) return;

  /* Kann der Browser die drei Dinge, auf denen alles steht? Wenn nein,
     bleibt das Attribut ungesetzt und die Abbildungen stehen einfach da.
     Das ist der bessere Ausfall als ein dauerhaft verdecktes Bild. */
  var kannMaske = window.CSS && CSS.supports && (
        CSS.supports('mask-image', 'linear-gradient(#000, transparent)') ||
        CSS.supports('-webkit-mask-image', 'linear-gradient(#000, transparent)'));
  if (!kannMaske) return;
  if (!('IntersectionObserver' in window)) return;

  /* Abgeschaltete Bewegung: gar nicht erst anfassen. Die CSS faengt
     zusaetzlich den Fall ab, dass jemand die Einstellung erst umstellt,
     waehrend die Seite offen ist. */
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Der Beobachter darf jede Abbildung nur einmal ausloesen. 0.35 ist
     bewusst nicht 0: bei 0 liefe die Bewegung, waehrend die Abbildung
     noch mit einem Rand im Fenster steht und niemand hinsieht. */
  var beobachter = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (eintrag) {
      if (!eintrag.isIntersecting) return;
      beobachter.unobserve(eintrag.target);
      starte(eintrag.target);
    });
  }, { threshold: 0.35 });

  Array.prototype.forEach.call(figuren, ruesteAus);

  /* -------------------------------------------------------------------------
     EINE ABBILDUNG VORBEREITEN
  ------------------------------------------------------------------------- */
  function ruesteAus(figur) {
    var bild = figur.querySelector('img');
    if (!bild) return;

    /* Nach dem Lauf faellt das Attribut weg. Die Abbildung liegt dann
       wieder blank da — ohne Maske, ohne laufende Animation, ohne
       eigene Ebene im Compositor. Der Endzustand der Bewegung und der
       Ruhezustand sind deckungsgleich, es blitzt nichts auf. */
    bild.addEventListener('animationend', function (e) {
      if (e.animationName === 'vgl-aufbau') figur.removeAttribute('data-vgl-lauf');
    });

    /* Steht die Abbildung schon im Fenster, sofort loslaufen — sonst
       verdecken und auf den Beobachter warten. Der Unterschied ist
       wichtig: ein Zwischenschritt ueber `bereit` waere bei einer bereits
       sichtbaren Abbildung ein sichtbares Ausblenden. */
    if (imFenster(figur)) {
      starte(figur);
    } else {
      if (!ruhig.matches) figur.setAttribute('data-vgl-lauf', 'bereit');
      beobachter.observe(figur);
    }

    /* Die Maus: der Kunde nennt das Ueberfahren ausdruecklich als
       zweiten Ausloeser. Gehorcht wird dem ganzen Kasten, nicht der
       115 px schmalen Abbildung — sonst traefe man sie kaum. Der Kasten
       ist schlicht das Elternelement; auf einen Klassennamen stuetzt
       sich das Skript bewusst nicht. */
    var ziel = figur.parentElement || figur;
    ziel.addEventListener('mouseenter', function () { starte(figur); });

    /* Tastatur: nur, wenn der Kasten ueberhaupt angesteuert werden kann.
       Aus einem Kasten ohne Bedienteil einen Halt in der Tabreihenfolge
       zu machen, waere ein Eingriff in die Bedienung und nicht Aufgabe
       einer Bildbewegung. Im heutigen Markup trifft das nicht zu, die
       Zeile bleibt fuer den Fall, dass dort spaeter ein Link steht. */
    if (istAnsteuerbar(ziel)) {
      ziel.addEventListener('focusin', function () { starte(figur); });
    }
  }

  /* -------------------------------------------------------------------------
     STARTEN — auch mitten im Lauf
  ------------------------------------------------------------------------- */
  function starte(figur) {
    if (ruhig.matches) { figur.removeAttribute('data-vgl-lauf'); return; }

    var bild = figur.querySelector('img');
    if (!bild) return;

    /* Die Abbildungen haengen an `loading="lazy"`. Faehrt jemand mit der
       Maus darueber, bevor die Datei da ist, liefe die Bewegung auf
       einem leeren Kasten ab und waere vorbei, wenn das Bild erscheint.
       Also erst laden lassen, dann laufen. */
    if (!bild.complete) {
      figur.setAttribute('data-vgl-lauf', 'bereit');
      bild.addEventListener('load', function () { starte(figur); }, { once: true });
      /* Laedt die Datei gar nicht, bliebe die Figur sonst auf `bereit`
         stehen — verdeckt, ohne dass je etwas nachkaeme. Dann lieber das
         Attribut weg und dem Browser sein Ersatzbild lassen. */
      bild.addEventListener('error', function () { figur.removeAttribute('data-vgl-lauf'); }, { once: true });
      return;
    }

    /* Sauberer Neustart. Ueber `bereit` statt ueber das Entfernen des
       Attributs: so bleibt die Maske die ganze Zeit auf dem Bild liegen
       und nur die Animation wird ausgetauscht. Naehme man das Attribut
       weg, waere das Bild fuer einen Augenblick unverdeckt — beim
       zweiten Ueberfahren mitten im Lauf blitzte es auf.
       Das Auslesen von offsetWidth erzwingt dazwischen die Neuberechnung;
       ohne sie fasst der Browser beide Schritte zusammen und die
       Animation liefe einfach weiter. */
    figur.setAttribute('data-vgl-lauf', 'bereit');
    void figur.offsetWidth;
    figur.setAttribute('data-vgl-lauf', 'lauf');
  }

  /* -------------------------------------------------------------------------
     KLEINKRAM
  ------------------------------------------------------------------------- */
  function imFenster(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < (window.innerHeight || 0);
  }

  /* Ansteuerbar heisst: ein eigener Halt in der Tabreihenfolge. Ein
     `div` ohne `tabindex` ist das nicht, ein Link oder ein Knopf schon. */
  function istAnsteuerbar(el) {
    if (el.hasAttribute && el.hasAttribute('tabindex')) return true;
    return !!(el.matches && el.matches('a[href], button, input, select, textarea, [contenteditable]'));
  }
})();
