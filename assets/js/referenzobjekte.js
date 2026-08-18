/* ===========================================================================
   REFERENZOBJEKTE — Umschalter zwischen den beiden Objektarten
   Setzt nur data-art am Abschnitt; das Ein- und Ausblenden der beiden
   Fassungen und die Bewegung des Schiebers loest referenzobjekte.css daraus
   ab. Ohne Javascript bleibt die im HTML gesetzte Fassung sichtbar.
   =========================================================================== */
(function () {
  'use strict';

  var bloecke = document.querySelectorAll('[data-robj]');

  Array.prototype.forEach.call(bloecke, function (block) {
    var knoepfe = block.querySelectorAll('[data-art-knopf]');
    if (!knoepfe.length) return;
    var schieber = block.querySelector('.robj__schieber');

    /* Der Schieber legt sich genau auf die gewaehlte Schaltflaeche. Auf
       breiten Fenstern sind beide gleich breit, auf schmalen richtet sich
       die Breite nach der laengeren Beschriftung — deshalb wird gemessen
       statt mit 50 % gerechnet. Ohne Javascript bleibt die Haelften-Loesung
       aus referenzobjekte.css stehen. */
    function schieberLegen(knopf, sofort) {
      if (!schieber || !knopf.offsetWidth) return;
      var alt = schieber.style.transition;
      if (sofort) schieber.style.transition = 'none';
      schieber.style.width = knopf.offsetWidth + 'px';
      schieber.style.transform = 'translateX(' + (knopf.offsetLeft - schieber.offsetLeft) + 'px)';
      if (sofort) {
        void schieber.offsetWidth;          /* Zwischenstand erzwingen */
        schieber.style.transition = alt;
      }
    }

    function aktiver() {
      for (var i = 0; i < knoepfe.length; i++) {
        if (knoepfe[i].getAttribute('aria-pressed') === 'true') return knoepfe[i];
      }
      return knoepfe[0];
    }

    function setzen(knopf) {
      block.setAttribute('data-art', knopf.getAttribute('data-art-knopf'));
      Array.prototype.forEach.call(knoepfe, function (k) {
        k.setAttribute('aria-pressed', String(k === knopf));
      });
      schieberLegen(knopf, false);
      /* Die verlassene Objektart soll nicht unsichtbar weiterlaufen. */
      Array.prototype.forEach.call(block.querySelectorAll('.robj__film'), function (film) {
        if (!film.paused) film.pause();
      });
    }

    schieberLegen(aktiver(), true);
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { schieberLegen(aktiver(), true); })
        .observe(schieber.parentElement);
    } else {
      window.addEventListener('resize', function () { schieberLegen(aktiver(), true); });
    }
    /* Nach dem Laden der Schrift verschieben sich die Breiten noch einmal. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { schieberLegen(aktiver(), true); });
    }

    Array.prototype.forEach.call(knoepfe, function (knopf, i) {
      knopf.addEventListener('click', function () { setzen(knopf); });

      /* Pfeiltasten wandern innerhalb der Pille — wie bei einer Gruppe
         zusammengehoeriger Schaltflaechen ueblich. Tab und Leertaste/Enter
         funktionieren ohnehin, weil es echte <button> sind. */
      knopf.addEventListener('keydown', function (e) {
        var richtung = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') richtung = 1;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') richtung = -1;
        if (!richtung) return;
        e.preventDefault();
        var ziel = knoepfe[(i + richtung + knoepfe.length) % knoepfe.length];
        ziel.focus();
        setzen(ziel);
      });
    });
  });
})();

/* ===========================================================================
   REFERENZOBJEKTE — der Bildplatz: Vorschaubild -> Video

   Vorschaubild, Zwischenansicht und Video liegen im SELBEN 16:9-Rahmen
   uebereinander. Der Klick auf den Abspielknopf blendet das Vorschaubild aus
   und startet die Wiedergabe; die Hoehe des Rahmens aendert sich dabei um
   0 px, weil alle drei absolut im Rahmen sitzen.

   SOBALD DAS VIDEO VORLIEGT ist an dieser Datei NICHTS zu aendern. Gefuellt
   wird allein im HTML das Attribut data-film="" an <div class="robj__video">:

       data-film="assets/video/referenz-wg-konzept.mp4"

   Ist der Wert gesetzt, haengt der Klick ein <video class="robj__film">
   (controls, playsinline, poster = das Vorschaubild) in den Rahmen und
   startet es. Ist der Wert leer, zeigt der Klick stattdessen die ruhige
   Zwischenansicht .robj__ersatz — kein Fehler und kein leeres Feld.

   Das Video wird VOR den Abspielknopf gehaengt. Die Reihenfolge im DOM
   bestimmt hier nicht die Stapelung — die regelt z-index in
   referenzobjekte.css —, wohl aber die Tabreihenfolge: so kommt zuerst das
   Video mit seinen Bedienelementen und danach der (dann verborgene) Knopf.

   Ohne Javascript bleibt das Vorschaubild stehen; der Abschnitt bleibt
   vollstaendig lesbar.
   =========================================================================== */
(function () {
  'use strict';

  var schirme = document.querySelectorAll('.robj__video');

  Array.prototype.forEach.call(schirme, function (schirm) {
    var knopf = schirm.querySelector('.robj__play');
    if (!knopf) return;

    var bild    = schirm.querySelector('.robj__bild');
    var ersatz  = schirm.querySelector('.robj__ersatz');
    var zurueck = ersatz ? ersatz.querySelector('.robj__zurueck') : null;

    function zurVorschau() {
      if (ersatz) ersatz.hidden = true;
      schirm.setAttribute('data-zustand', 'vorschau');
      knopf.hidden = false;
      knopf.focus();
    }

    function starten() {
      if (schirm.getAttribute('data-zustand') !== 'vorschau') return;
      var quelle = (schirm.getAttribute('data-film') || '').trim();

      if (quelle) {
        var film = document.createElement('video');
        film.className = 'robj__film';
        film.setAttribute('controls', '');
        film.setAttribute('playsinline', '');
        film.setAttribute('preload', 'auto');
        if (bild) film.setAttribute('poster', bild.getAttribute('src'));
        film.src = quelle;
        schirm.insertBefore(film, knopf);
        schirm.setAttribute('data-zustand', 'film');
        knopf.hidden = true;
        var lauf = film.play();
        /* Weist der Browser das selbsttaetige Starten ab, bleibt das Video
           mit seinen eigenen Bedienelementen stehen — kein Fehler im Bild. */
        if (lauf && typeof lauf.catch === 'function') { lauf.catch(function () {}); }
        film.focus();
        return;
      }

      schirm.setAttribute('data-zustand', 'folgt');
      knopf.hidden = true;
      if (ersatz) {
        ersatz.hidden = false;
        /* Der Fokus lag auf dem Knopf, der eben verschwunden ist — er wandert
           deshalb weiter auf den Rueckweg. */
        if (zurueck) zurueck.focus();
      }
    }

    knopf.addEventListener('click', starten);
    if (zurueck) zurueck.addEventListener('click', zurVorschau);
  });
})();

/* ===========================================================================
   REFERENZOBJEKTE — die Ueberlappung der Infokarte

   Kundenwunsch 18.08.: „Unten links vom Video ragt er halb ueber das Video
   und halb unter dem Video raus." Genau die Haelfte ihrer eigenen Hoehe —
   und die haengt daran, wie der Satz in der Karte umbricht. Deshalb wird sie
   gemessen und als --robj-ueber an die Karte geschrieben; referenzobjekte.css
   zieht die Karte um diesen Wert nach oben.

   Der Wert steht als Naeherung bereits im CSS. Ohne Javascript, vor dem
   Laden der Schrift und mit abgeschaltetem Script bleibt er stehen — die
   Karte ueberlappt also in jedem Fall, sie trifft die Haelfte dann nur nicht
   auf den Punkt.

   Kein Rueckkopplungsschleifen-Risiko: der Aussenabstand nach oben aendert
   die Hoehe der Karte nicht, nur ihre Lage. Geschrieben wird ausserdem nur,
   wenn sich der Wert um mehr als einen halben Pixel bewegt.
   =========================================================================== */
(function () {
  'use strict';

  var karten = document.querySelectorAll('.robj__info');
  if (!karten.length) return;

  function legen(karte) {
    var hoehe = karte.offsetHeight;
    if (!hoehe) return;                       /* verborgen oder noch ohne Satz */
    var soll = Math.round(hoehe / 2);

    /* OBERGRENZE auf schmalen Fenstern: dort ist das Video nur noch gut
       190 px hoch, die Karte aber wegen des Umbruchs fast ebenso hoch. Die
       halbe Kartenhoehe wuerde bis in den Abspielknopf reichen und ihn
       verdecken — der Knopf sitzt in der Mitte der Bildflaeche. Deshalb
       hoechstens 28 % der Bildhoehe; darunter bleibt der Knopf samt seinem
       goldenen Ring frei anklickbar. Auf breiten Fenstern greift die Grenze
       nicht: dort ist die halbe Karte deutlich kleiner als 28 % des Bildes. */
    var fassung = karte.closest('[data-art-inhalt]');
    var bild = fassung ? fassung.querySelector('.robj__video') : null;
    if (bild && bild.offsetHeight) {
      soll = Math.min(soll, Math.round(bild.offsetHeight * 0.28));
    }

    if (Math.abs((karte._robjUeber || 0) - soll) < 0.5) return;
    karte._robjUeber = soll;
    karte.style.setProperty('--robj-ueber', soll + 'px');
  }

  function alle() {
    Array.prototype.forEach.call(karten, legen);
  }

  alle();

  if ('ResizeObserver' in window) {
    /* Beobachtet werden Karte UND Bild: die Obergrenze oben haengt an der
       Bildhoehe, die sich beim Verkleinern des Fensters mit aendert. */
    var beobachter = new ResizeObserver(function () { alle(); });
    Array.prototype.forEach.call(karten, function (k) {
      beobachter.observe(k);
      var fassung = k.closest('[data-art-inhalt]');
      var bild = fassung ? fassung.querySelector('.robj__video') : null;
      if (bild) beobachter.observe(bild);
    });
  } else {
    window.addEventListener('resize', alle);
  }

  /* Nach dem Laden der Schrift bricht der Satz noch einmal anders um. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(alle);
  }
})();
