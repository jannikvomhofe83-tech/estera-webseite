/* ===========================================================================
   DER AUFBAU DER BEIDEN VERGLEICHSBILDER   (.wi__vgl)

   Gegenstueck zu assets/css/vgl-animation.css. Dort steht, WAS sich
   bewegt und wie lange; hier steht, WANN.

   KUNDENWUNSCH VOM 31.08.2026: beim Erreichen des Abschnitts, und
   zusaetzlich jedes Mal beim Ueberfahren mit der Maus.

   UMGESTELLT AM 01.09.2026 (Optimierungsbriefing, Abschnitt 04): die
   Abbildungen sind seither Inline-SVG statt Rasterbilder. Damit entfaellt
   alles, was hier am Laden der Bilddatei hing (`complete`, `load`,
   `error`, der Zwischenzustand fuer noch nicht geladene Bilder). Ein
   Inline-SVG ist da, sobald das Dokument da ist.

   DIE ARBEITSTEILUNG MIT DER CSS
   Das Skript setzt ausschliesslich `data-vgl-lauf` auf die <figure> und
   nimmt es wieder weg. Es schreibt keine Stilwerte. Damit gilt: solange
   das Skript nicht laeuft — Datei blockiert, Fehler weiter oben, alter
   Browser —, steht in der CSS keine Regel, die greift, und die Abbildung
   ist vollstaendig zu sehen.

     (kein Attribut)  Ruhezustand, alles sichtbar
     bereit           Startlage, laeuft noch nicht
     lauf             die Bewegung laeuft

   `bereit` gibt es, weil die Abbildungen weit unten auf der Seite stehen.
   Sie werden schon beim Laden in die Startlage gesetzt, lange bevor jemand
   hinsehen kann. Wuerde erst der Beobachter das tun, saehe man die
   Abbildung erst fertig und dann verschwinden.

   FRUEH AUSLOESEN — Optimierungsbriefing P0: der Beobachter meldet beim
   ersten Bildpunkt und schon 10 Prozent unter der Fensterkante. Vorher
   lag die Schwelle bei 0,35 der Flaeche; wer schnell rollte, hatte die
   Abbildung im Bild, bevor sie anfing.
   =========================================================================== */

(function () {
  'use strict';

  var figuren = document.querySelectorAll('.wi__vgl[data-vgl]');
  if (!figuren.length) return;
  if (!('IntersectionObserver' in window)) return;

  /* Abgeschaltete Bewegung: gar nicht erst anfassen. Die CSS faengt
     zusaetzlich den Fall ab, dass jemand die Einstellung erst umstellt,
     waehrend die Seite offen ist. */
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');

  var beobachter = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (eintrag) {
      if (!eintrag.isIntersecting) return;
      beobachter.unobserve(eintrag.target);
      starte(eintrag.target);
    });
  }, { rootMargin: '0px 0px 10% 0px', threshold: 0 });

  Array.prototype.forEach.call(figuren, ruesteAus);

  /* SICHERHEITSNETZ — wer sehr schnell rollt oder per Sprungmarke landet,
     kann am Beobachter vorbei. Jeder Rollvorgang prueft deshalb (gedrosselt)
     selbst nach; sind beide Abbildungen gelaufen, haengt sich der Lauscher
     aus. Und falls gar nichts ausloest, faellt die Startlage nach zwei
     Sekunden von allein: nichts darf dauerhaft unsichtbar bleiben. */
  var offen = Array.prototype.slice.call(figuren), ticket = 0;
  function nachsehen() {
    ticket = 0;
    var grenze = (window.innerHeight || 0) * 1.1;
    offen = offen.filter(function (f) {
      if (!f.hasAttribute('data-vgl-lauf')) return false;
      if (f.getBoundingClientRect().top < grenze) { beobachter.unobserve(f); starte(f); return false; }
      return true;
    });
    if (!offen.length) window.removeEventListener('scroll', anfordern);
  }
  function anfordern() { if (!ticket) ticket = requestAnimationFrame(nachsehen); }
  window.addEventListener('scroll', anfordern, { passive: true });
  window.setTimeout(function () {
    offen.forEach(function (f) {
      if (f.getAttribute('data-vgl-lauf') === 'bereit') {
        var r = f.getBoundingClientRect();
        if (r.top < (window.innerHeight || 0) * 1.1) starte(f);
      }
    });
  }, 2000);

  /* -------------------------------------------------------------------------
     EINE ABBILDUNG VORBEREITEN
  ------------------------------------------------------------------------- */
  function ruesteAus(figur) {
    var svg = figur.querySelector('svg');
    if (!svg) return;

    /* Nach dem Lauf faellt das Attribut weg. Die Abbildung liegt dann
       wieder blank da — ohne Startlage, ohne laufende Animation. Der
       Endzustand der Bewegung und der Ruhezustand sind deckungsgleich, es
       blitzt nichts auf. Die letzte Bewegung ist der wachsende Anteil. */
    svg.addEventListener('animationend', function (e) {
      if (e.animationName === 'vgl-anteil') figur.removeAttribute('data-vgl-lauf');
    });

    if (imFenster(figur)) {
      starte(figur);
    } else {
      if (!ruhig.matches) figur.setAttribute('data-vgl-lauf', 'bereit');
      beobachter.observe(figur);
    }

    /* Die Maus: der Kunde nennt das Ueberfahren ausdruecklich als zweiten
       Ausloeser. Gehorcht wird dem ganzen Kasten, nicht der Abbildung —
       der Kasten ist schlicht das Elternelement. */
    var ziel = figur.parentElement || figur;
    ziel.addEventListener('mouseenter', function () { starte(figur); });
    if (istAnsteuerbar(ziel)) {
      ziel.addEventListener('focusin', function () { starte(figur); });
    }
  }

  /* -------------------------------------------------------------------------
     STARTEN — auch mitten im Lauf
     Sauberer Neustart ueber `bereit`: so bleibt die Startlage die ganze
     Zeit gesetzt und nur die Animation wird ausgetauscht. Das Auslesen von
     offsetWidth erzwingt dazwischen die Neuberechnung; ohne sie fasst der
     Browser beide Schritte zusammen und die Animation liefe weiter.
  ------------------------------------------------------------------------- */
  function starte(figur) {
    if (ruhig.matches) { figur.removeAttribute('data-vgl-lauf'); return; }
    figur.setAttribute('data-vgl-lauf', 'bereit');
    void figur.offsetWidth;
    figur.setAttribute('data-vgl-lauf', 'lauf');
  }

  function imFenster(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < (window.innerHeight || 0) * 1.1;
  }

  function istAnsteuerbar(el) {
    if (el.hasAttribute && el.hasAttribute('tabindex')) return true;
    return !!(el.matches && el.matches('a[href], button, input, select, textarea, [contenteditable]'));
  }
})();
