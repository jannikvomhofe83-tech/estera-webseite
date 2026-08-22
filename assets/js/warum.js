/* ===========================================================================
   VORTEILE VON IMMOBILIEN — der Antrieb des Abschnitts
   Gehoert zu assets/css/warum.css und zur Section #warum-immobilien.
   Neufassung vom 21.08.2026 (Build B-201).

   WAS DIESE DATEI TUT

     1  Sie meldet sich an: `data-js="an"` an der Section. ERST damit greifen
        in warum.css die Klebemechanik und die Anfangszustaende des Einlaufs.
        Laedt das Skript nicht oder bricht es ab, steht der Abschnitt
        vollstaendig und lesbar da: vier Kaesten untereinander, jeder mit
        Symbol und Namen seines Vorteils. Es kann kein Zustand entstehen, in
        dem ein Inhalt unsichtbar haengen bleibt.

     2  Sie misst die echte Laenge jeder zu zeichnenden Linie
        (`getTotalLength()`) und legt sie als `--len` ab. Muster dafuer steht
        in assets/js/site.js bei `[data-lines]`.

     3  Sie fuehrt die Scroll-Animation: waehrend die rechte Buehne klebt,
        laufen unter ihr vier gleich hohe Spuren durch. Aus der Lage von
        .wimm__lauf entsteht ein Fortschritt 0…1, daraus der Index 0…3.
        Der Wechsel geschieht dadurch VON ALLEIN — es muss nirgends geklickt
        werden. Weil der Index bei jedem Bild neu aus der Lage gerechnet
        wird, laeuft es rueckwaerts genauso sauber wie vorwaerts; es gibt
        keinen Zustand, der haengen bleiben koennte.

     4  Sie schaltet die Bewegung IM Schaubild frei, sobald der zugehoerige
        Kasten das erste Mal an der Reihe ist (`data-bild`). Einmalig.

   WAS SIE AUSDRUECKLICH NICHT TUT
     Kein Eingriff ins Scrollen, kein preventDefault, kein Einrasten, kein
     Zeitgeber, der dauernd misst, keine Bibliothek. Gemessen wird nur in
     einem requestAnimationFrame je Scrollbild, und geschrieben wird nur,
     wenn sich der Index tatsaechlich aendert.

   ZWEI BETRIEBSARTEN
     KLEBEND   ab 1024 px UND wenn Bewegung erlaubt ist. Buehne klebt,
               Spuren steuern den Wechsel, die Liste links ist sichtbar.
     GESTAPELT sonst — Telefon, schmale Fenster, `prefers-reduced-motion`.
               Die vier Kaesten stehen untereinander; jeder bekommt seine
               Diagrammbewegung ueber einen eigenen IntersectionObserver.
     Der Wechsel zwischen beiden Arten wird beobachtet und sauber
     umgeschaltet.
   =========================================================================== */
(function () {
  'use strict';

  var abschnitt = document.querySelector('.wimm');
  if (!abschnitt) return;

  var lauf    = abschnitt.querySelector('.wimm__lauf');
  var klebe   = abschnitt.querySelector('.wimm__klebe');
  var kaesten = Array.prototype.slice.call(abschnitt.querySelectorAll('[data-kasten]'));
  var knoepfe = Array.prototype.slice.call(abschnitt.querySelectorAll('[data-zu]'));
  var anzahl  = kaesten.length;
  if (!lauf || !klebe || !anzahl) return;

  /* --- 1  Anmelden --------------------------------------------------------
     Ab hier gelten die Regeln in warum.css.                                */
  abschnitt.setAttribute('data-js', 'an');

  /* --- 2  Echte Linienlaengen setzen -------------------------------------- */
  Array.prototype.forEach.call(
    abschnitt.querySelectorAll('[data-zeichnen]'),
    function (linie) {
      try {
        linie.style.setProperty('--len', Math.ceil(linie.getTotalLength()));
      } catch (e) {
        /* Sollte ein Browser die Laenge nicht liefern, bleibt der Vorgabewert
           aus warum.css stehen. Die Linie zeichnet sich dann etwas anders,
           steht am Ende aber ebenfalls vollstaendig da. */
      }
    }
  );

  var wenigBewegung = window.matchMedia('(prefers-reduced-motion: reduce)');
  var breit         = window.matchMedia('(min-width: 1024px)');
  var weich         = function () { return wenigBewegung.matches ? 'auto' : 'smooth'; };
  var klebeArt      = function () { return breit.matches && !wenigBewegung.matches; };

  var jetzt    = -1;      /* aktueller Vorteil, -1 = noch keiner gesetzt   */
  var imBild   = false;   /* Abschnitt ist ins Bild gekommen               */
  var klebtAn  = false;   /* laeuft die klebende Betriebsart gerade?       */

  /* --- 3  Bewegung im Schaubild freigeben, genau einmal je Kasten -------- */
  function bildFrei(i) {
    if (!imBild || i < 0) return;
    var k = kaesten[i];
    if (k && !k.hasAttribute('data-bild')) k.setAttribute('data-bild', '');
  }

  /* --- 4  Den Vorteil setzen: rechts der Kasten, links die Hervorhebung -- */
  function setzen(i) {
    if (i === jetzt) return;
    jetzt = i;
    for (var n = 0; n < anzahl; n++) {
      if (n === i) kaesten[n].setAttribute('data-an', '');
      else         kaesten[n].removeAttribute('data-an');
    }
    for (var m = 0; m < knoepfe.length; m++) {
      if (m === i) knoepfe[m].setAttribute('aria-current', 'true');
      else         knoepfe[m].removeAttribute('aria-current');
    }
    bildFrei(i);
  }

  /* --- 5  Messwerte der Klebestrecke -------------------------------------
     `weite` ist der Weg, den .wimm__klebe klebend zuruecklegt. Weil klebe
     das erste Kind von .wimm__lauf ist und keine Aussenabstaende hat,
     entspricht das genau der Summe der vier Spuren.                       */
  var weite = 0;
  var oben  = 0;

  function messen() {
    oben = parseFloat(window.getComputedStyle(klebe).top);
    if (isNaN(oben)) oben = 0;
    weite = lauf.offsetHeight - klebe.offsetHeight;
  }

  /* --- 6  Ein Bild je Scrollereignis, sonst nichts ----------------------- */
  var wartet = false;

  function beiScroll() {
    if (wartet || !klebtAn) return;
    wartet = true;
    window.requestAnimationFrame(function () {
      wartet = false;
      pruefen();
    });
  }

  function pruefen() {
    if (!klebtAn || weite <= 0) return;
    /* Ein einziges Lesen der Lage — kein Layout-Zwang je Bild. */
    var fortschritt = (oben - lauf.getBoundingClientRect().top) / weite;
    var i = Math.floor(fortschritt * anzahl);
    if (i < 0) i = 0;
    if (i > anzahl - 1) i = anzahl - 1;
    setzen(i);
  }

  /* --- 7  Gestapelte Betriebsart: Diagramme einzeln freischalten --------- */
  var bildBeob = null;

  function bildBeobStarten() {
    if (bildBeob || !('IntersectionObserver' in window)) {
      if (!('IntersectionObserver' in window)) {
        for (var n = 0; n < anzahl; n++) kaesten[n].setAttribute('data-bild', '');
      }
      return;
    }
    bildBeob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-bild', '');
        bildBeob.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    for (var m = 0; m < anzahl; m++) bildBeob.observe(kaesten[m]);
  }

  function bildBeobStoppen() {
    if (!bildBeob) return;
    bildBeob.disconnect();
    bildBeob = null;
  }

  /* --- 8  Betriebsart einrichten und sauber umschalten ------------------- */
  function einrichten() {
    if (klebeArt()) {
      bildBeobStoppen();
      klebtAn = true;
      messen();
      jetzt = -1;
      setzen(0);      /* beim Eintritt steht links Bankkapital, rechts sein Kasten */
      pruefen();
    } else {
      klebtAn = false;
      jetzt = -1;
      /* Zustaende zuruecknehmen — gestapelt stehen alle Kaesten gleichwertig da. */
      for (var n = 0; n < anzahl; n++) kaesten[n].removeAttribute('data-an');
      for (var m = 0; m < knoepfe.length; m++) knoepfe[m].removeAttribute('aria-current');
      bildBeobStarten();
    }
  }

  /* --- 9  Komfort: die Eintraege duerfen zusaetzlich angeklickt werden ----
     Der Kunde hat ausdruecklich gesagt, dass man NICHT klicken muss. Wer es
     doch tut, wird an die Mitte des zugehoerigen Abschnitts gefahren — dort
     steht der Fortschritt sicher innerhalb dieses Vorteils.               */
  knoepfe.forEach(function (knopf, n) {
    knopf.addEventListener('click', function () {
      if (!klebtAn) {
        kaesten[n].scrollIntoView({ block: 'start', behavior: weich() });
        return;
      }
      messen();
      var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var ziel = scrollY + lauf.getBoundingClientRect().top - oben
               + weite * ((n + 0.5) / anzahl);
      window.scrollTo({ top: Math.round(ziel), behavior: weich() });
    });
  });

  /* --- 10  Einlauf der Bloecke, einmalig --------------------------------- */
  var bloecke = abschnitt.querySelectorAll('[data-block]');

  function blockZeigen(el) {
    el.setAttribute('data-auf', '');
    if (el.classList.contains('wimm__raster') || el.querySelector('.wimm__raster')) {
      imBild = true;
      bildFrei(jetzt);
    }
  }

  if ('IntersectionObserver' in window && bloecke.length) {
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        blockZeigen(e.target);
        beob.unobserve(e.target);   // einmalig, danach abgemeldet
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(bloecke, function (el) { beob.observe(el); });
  } else {
    /* Ohne Beobachter sofort zeigen — nichts darf unsichtbar bleiben. */
    Array.prototype.forEach.call(bloecke, blockZeigen);
    imBild = true;
  }

  /* --- 11  Anmelden am Scrollen ------------------------------------------ */
  einrichten();

  window.addEventListener('scroll', beiScroll, { passive: true });
  window.addEventListener('resize', function () { messen(); beiScroll(); }, { passive: true });

  /* Schriften koennen die Hoehen noch veraendern — danach einmal nachmessen. */
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () { messen(); pruefen(); });
  }

  /* Betriebsart wechselt, wenn das Fenster die Schwelle kreuzt oder der
     Besucher seine Bewegungseinstellung aendert. */
  var horchen = function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', einrichten);
    else if (mq.addListener) mq.addListener(einrichten);
  };
  horchen(breit);
  horchen(wenigBewegung);
})();
