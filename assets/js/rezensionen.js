/* ===========================================================================
   KUNDENSTIMMEN — Karussell und Aufklapper

   Neu geschrieben am 24.08.2026. Die Reihe lief bis dahin von allein durch;
   auf Kundenwunsch wird jetzt ausschliesslich von Hand geblaettert — ueber
   die beiden Pfeile, die Punkte darunter, die Pfeiltasten oder eine
   Wischbewegung.

   ZWEI DINGE, DIE DIESE DATEI TUT:

   1  BLAETTERN. Wie viele Karten nebeneinander stehen, haengt an der
      Fensterbreite. Daraus ergibt sich die Zahl der Seiten und damit die
      Zahl der Punkte — beides ist erst zur Laufzeit bekannt und wird
      deshalb hier gerechnet, nicht im Stylesheet.

   2  AUFKLAPPEN. Ob eine Rezension laenger ist, als die Karte zeigt, wird
      GEMESSEN (`scrollHeight` gegen `clientHeight`), nicht an der Zeichenzahl
      geraten: bei gleicher Laenge braucht ein Text mit vielen langen Woertern
      mehr Zeilen als einer mit kurzen. Gemessen wird nach
      `document.fonts.ready` erneut — vorher rechnet der Browser mit der
      Ersatzschrift, und Cormorant ist deutlich schmaler als die.

   OHNE DIESE DATEI bleibt die Section vollstaendig benutzbar: alle Texte
   stehen ungekuerzt da, das Fenster ist seitlich schiebbar, und es gibt
   keinen Knopf, der ins Leere greift. Das Stylesheet haengt jede
   Einschraenkung an `[data-rez-bereit]`, und dieses Merkmal setzt erst
   dieses Skript.
   =========================================================================== */
(function () {
  'use strict';

  var karussell = document.querySelector('[data-rez]');
  if (!karussell) return;

  var fenster = karussell.querySelector('[data-rez-fenster]');
  var spur    = karussell.querySelector('[data-rez-spur]');
  var zurueck = karussell.querySelector('[data-rez-zurueck]');
  var vor     = karussell.querySelector('[data-rez-vor]');
  var punkte  = document.querySelector('[data-rez-punkte]');
  var karten  = [].slice.call(spur.querySelectorAll('.rez'));
  if (!fenster || !spur || !karten.length) return;

  var seite = 0;
  var proSeite = 3;
  var seiten = 1;

  /* --- Wie viele Karten passen nebeneinander ------------------------------
     Dieselben Grenzen wie im Stylesheet. Sie stehen bewusst doppelt: eine
     Rechnung ueber `matchMedia` waere hier zwar moeglich, aber dann laege die
     Zahl an zwei Stellen in zwei verschiedenen Sprachen, und beim Verstellen
     wuerde man die zweite vergessen. So steht sie einmal als Zahl da. */
  function anzahlProSeite() {
    var b = window.innerWidth;
    if (b < 700) return 1;
    if (b < 1100) return 2;
    return 3;
  }

  /* --- Blaettern ---------------------------------------------------------- */
  function setzen(neu, weich) {
    seite = Math.max(0, Math.min(neu, seiten - 1));

    /* Die letzte Seite wird ANGESCHLAGEN, nicht angeschnitten: bei zehn
       Karten und drei Plaetzen blieben sonst auf Seite vier zwei leere
       Felder. Stattdessen endet die Spur buendig mit der letzten Karte und
       zeigt die letzten drei. */
    var erste = Math.min(seite * proSeite, Math.max(0, karten.length - proSeite));

    var schritt = 0;
    if (karten[1]) schritt = karten[1].offsetLeft - karten[0].offsetLeft;
    else schritt = karten[0].offsetWidth;

    if (!weich) spur.style.transition = 'none';
    spur.style.transform = 'translate3d(' + (-erste * schritt) + 'px, 0, 0)';
    if (!weich) {
      /* Ein erzwungener Durchgang, damit das Zuruecksetzen der Ueberblendung
         nicht mit der Verschiebung zusammenfaellt. */
      void spur.offsetWidth;
      spur.style.transition = '';
    }

    if (zurueck) zurueck.disabled = seite === 0;
    if (vor) vor.disabled = seite >= seiten - 1;

    [].forEach.call(punkte ? punkte.children : [], function (p, i) {
      p.setAttribute('aria-selected', i === seite ? 'true' : 'false');
      p.setAttribute('tabindex', i === seite ? '0' : '-1');
    });
  }

  function punkteBauen() {
    if (!punkte) return;
    punkte.textContent = '';
    for (var i = 0; i < seiten; i++) {
      (function (nr) {
        var p = document.createElement('button');
        p.type = 'button';
        p.className = 'rez__punkt';
        p.setAttribute('role', 'tab');
        p.setAttribute('aria-label', 'Seite ' + (nr + 1) + ' von ' + seiten);
        p.addEventListener('click', function () { setzen(nr, true); });
        punkte.appendChild(p);
      })(i);
    }
    /* Bei nur einer Seite waere die Leiste eine einzelne Marke ohne Funktion. */
    punkte.hidden = seiten < 2;
  }

  function neuRechnen() {
    var vorher = proSeite;
    proSeite = anzahlProSeite();
    karussell.style.setProperty('--rez-proseite', proSeite);
    spur.style.setProperty('--rez-proseite', proSeite);
    document.querySelector('.ref').style.setProperty('--rez-proseite', proSeite);

    seiten = Math.max(1, Math.ceil(karten.length / proSeite));
    if (proSeite !== vorher) seite = 0;
    punkteBauen();
    setzen(seite, false);
  }

  /* --- Aufklapper --------------------------------------------------------- */
  function knoepfePruefen() {
    karten.forEach(function (li) {
      var karte = li.querySelector('.rez__karte');
      var text  = li.querySelector('[data-rez-text]');
      var knopf = li.querySelector('[data-rez-mehr]');
      if (!karte || !text || !knopf) return;
      if (karte.hasAttribute('data-offen')) return;   /* offen: immer sichtbar */
      /* 2 px Spiel fuer Teilpixel — ohne das taucht der Knopf bei manchen
         Bildschirmskalierungen an Texten auf, die genau hineinpassen. */
      knopf.hidden = text.scrollHeight <= text.clientHeight + 2;
    });
  }

  karten.forEach(function (li) {
    var karte = li.querySelector('.rez__karte');
    var knopf = li.querySelector('[data-rez-mehr]');
    var wort  = knopf && knopf.querySelector('[data-rez-mehr-wort]');
    if (!karte || !knopf) return;
    knopf.addEventListener('click', function () {
      var offen = karte.hasAttribute('data-offen');
      if (offen) karte.removeAttribute('data-offen');
      else karte.setAttribute('data-offen', '');
      knopf.setAttribute('aria-expanded', offen ? 'false' : 'true');
      /* WORDING 31.08.2026 — Wording-Dokument, Abschnitt 02, „LINK JE KARTE".
         Vorher: "Vollständige Bewertung". Der zugeklappte Zustand steht im
         HTML und muss dort denselben Wortlaut tragen. */
      if (wort) wort.textContent = offen ? 'Bewertung vollständig lesen' : 'Weniger anzeigen';
      if (offen) knopfePruefenGleich();
    });
  });
  function knopfePruefenGleich() {
    /* Nach dem Zuklappen muss neu gemessen werden — die Karte ist wieder
       beschnitten, und erst dann stimmt scrollHeight gegen clientHeight. */
    requestAnimationFrame(knoepfePruefen);
  }

  /* --- Bedienung ---------------------------------------------------------- */
  if (zurueck) zurueck.addEventListener('click', function () { setzen(seite - 1, true); });
  if (vor)     vor.addEventListener('click',     function () { setzen(seite + 1, true); });

  karussell.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { setzen(seite - 1, true); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setzen(seite + 1, true); e.preventDefault(); }
  });

  /* Wischen. Nur waagerechte Bewegungen zaehlen — sonst bliebe die Seite beim
     senkrechten Scrollen auf dem Telefon haengen. */
  var startX = null, startY = null, waagerecht = false;
  fenster.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; waagerecht = false;
  }, { passive: true });
  fenster.addEventListener('touchmove', function (e) {
    if (startX === null) return;
    var dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
    if (!waagerecht && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) waagerecht = true;
  }, { passive: true });
  fenster.addEventListener('touchend', function (e) {
    if (startX === null || !waagerecht) { startX = null; return; }
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 45) setzen(seite + (dx < 0 ? 1 : -1), true);
    startX = null;
  }, { passive: true });

  /* --- Start -------------------------------------------------------------- */
  fenster.setAttribute('data-rez-bereit', '');
  document.querySelector('.ref').setAttribute('data-rez-bereit', '');
  neuRechnen();
  knoepfePruefen();

  /* Die verbindliche Messung: vorher rechnet der Browser mit der Ersatzschrift. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { neuRechnen(); knoepfePruefen(); });
  }
  window.addEventListener('load', function () { neuRechnen(); knoepfePruefen(); });

  var wartet = false;
  window.addEventListener('resize', function () {
    if (wartet) return;
    wartet = true;
    requestAnimationFrame(function () { wartet = false; neuRechnen(); knoepfePruefen(); });
  });
})();
