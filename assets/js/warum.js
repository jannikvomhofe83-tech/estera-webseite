/* ===========================================================================
   VORTEILE VON IMMOBILIEN — der Antrieb des Abschnitts
   Gehoert zu assets/css/warum.css und zur Section #warum-immobilien.
   Neufassung vom 21.08.2026 (Build B-201), Schaubilder ersetzt am
   22.08.2026, Farbwechsel ergaenzt am 23.08.2026.

   NACHTRAG 23.08.2026 — der Wechsel ist sichtbar gemacht
   Der Kunde: „Der Switch (…) muss richtig krass dargestellt werden, sodass
   man gleich sieht: okay, es hat sich etwas verändert." Dazu kommen zu den
   bisherigen Aufgaben zwei hinzu, beide in setzen():

     A  DIE RICHTUNG. Aus altem und neuem Index folgt, ob es vorwaerts oder
        rueckwaerts geht. Das Ergebnis steht als --wi-dir an der Section,
        und warum.css rechnet damit von allein spiegelbildlich — es gibt
        deshalb keinen zweiten Regelsatz fuer „rueckwaerts".

     B  DER STREIFEN. Ein einziger Streifen liegt ueber der Buehne
        (.wimm__band). Beim Wechsel faehrt die neue Farbe als zweite Lage
        in Wischrichtung durch ihn hindurch; danach wird sie festgeschrieben
        und die Wischlage unsichtbar zurueckgesetzt.

   WOHER DIE FARBEN KOMMEN: aus dem CSS, nicht von hier. Jeder Kasten
   traegt data-ton, warum.css macht daraus --ton, und dieses Skript liest
   den fertigen Wert mit getComputedStyle ab. Es steht also KEIN Farbwert
   in dieser Datei — wer die Farben aendern will, aendert Abschnitt 3a in
   warum.css und sonst nichts. Dasselbe gilt fuer die Wischdauer: sie wird
   aus --wi-wisch gelesen, damit CSS und Zeitgeber nicht auseinanderlaufen
   koennen.

   WAS DIESE DATEI TUT

     1  Sie meldet sich an: `data-js="an"` an der Section. ERST damit greifen
        in warum.css die Klebemechanik und die Anfangszustaende des Einlaufs.
        Laedt das Skript nicht oder bricht es ab, steht der Abschnitt
        vollstaendig und lesbar da: vier Kaesten untereinander, jeder mit
        Symbol und Namen seines Vorteils. Es kann kein Zustand entstehen, in
        dem ein Inhalt unsichtbar haengen bleibt.

     2  ENTFALLEN am 22.08.2026: das Ausmessen der Linienlaengen
        (`getTotalLength()` nach `--len`). Es gehoerte zu den gezeichneten
        Diagrammen. Die vier Schaubilder sind jetzt Bilder mit einer
        Beschriftungslage darueber; bewegt werden nur noch Deckkraft und
        eine sehr leichte Skalierung, beides rein in CSS.

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

  /* Die beiden Lagen des Farbstreifens. Fehlen sie — etwa weil jemand das
     Band aus dem Dokument nimmt —, laeuft alles Uebrige unveraendert
     weiter; der Wechsel ist dann bloss weniger auffaellig. */
  var bandGrund = abschnitt.querySelector('.wimm__band-grund');
  var bandWisch = abschnitt.querySelector('.wimm__band-wisch');
  var buehne    = abschnitt.querySelector('.wimm__buehne');

  /* --- 1  Anmelden --------------------------------------------------------
     Ab hier gelten die Regeln in warum.css.                                */
  abschnitt.setAttribute('data-js', 'an');

  var wenigBewegung = window.matchMedia('(prefers-reduced-motion: reduce)');
  var breit         = window.matchMedia('(min-width: 1024px)');
  var weich         = function () { return wenigBewegung.matches ? 'auto' : 'smooth'; };
  var klebeArt      = function () { return breit.matches && !wenigBewegung.matches; };

  var jetzt    = -1;      /* aktueller Vorteil, -1 = noch keiner gesetzt   */
  var imBild   = false;   /* Abschnitt ist ins Bild gekommen               */
  var klebtAn  = false;   /* laeuft die klebende Betriebsart gerade?       */
  var wischUhr = 0;       /* laufender Zeitgeber des Streifens, 0 = keiner */
  var ploppUhr = 0;       /* laufender Zeitgeber des Farbausschlags        */

  /* Die Dauern stehen in warum.css. Sie hier noch einmal als Zahlen
     hinzuschreiben, hiesse zwei Wahrheiten zu haben — beim naechsten
     Feinjustieren wuerde eine davon vergessen. Der Zuschlag von 30 ms ist
     Sicherheitsabstand: der Zeitgeber soll erst greifen, wenn der Uebergang
     sicher durch ist. */
  function dauer(name, ersatz) {
    var s = parseFloat(window.getComputedStyle(abschnitt).getPropertyValue(name));
    return (isNaN(s) ? ersatz : s) * 1000 + 30;
  }

  /* Der Ton eines Vorteils, gelesen aus dem CSS. --ton ist dort ueber
     data-ton gesetzt; getComputedStyle liefert den bereits aufgeloesten
     Wert, auch wenn dahinter wieder eine Variable steht (--navy-600). */
  function tonVon(i) {
    var k = kaesten[i];
    if (!k) return '';
    return window.getComputedStyle(k).getPropertyValue('--ton').trim();
  }

  /* --- Der Farbstreifen ---------------------------------------------------
     `richtung`  1 = die neue Farbe faehrt von links ein, -1 von rechts.
     `sofort`    beim ersten Setzen und ohne Bewegungswunsch: Farbe hart
                 wechseln, nicht wischen.

     ABLAUF EINES WISCHERS
       1  Ein noch laufender Wischer wird festgeschrieben: seine Farbe wird
          zur Grundfarbe. Sonst waere die halb durchgelaufene Farbe verloren
          und der Streifen spraenge auf den vorletzten Ton zurueck.
       2  Die Wischlage wird auf scaleX(0) zurueckgesetzt und bekommt die
          neue Farbe. Der Ruhezustand hat in warum.css bewusst keinen
          Uebergang — dieses Zuruecksetzen ist deshalb unsichtbar.
       3  Ein erzwungenes Nachrechnen des Layouts (offsetWidth) trennt
          Zuruecksetzen und Start voneinander. Ohne diese Zeile fasst der
          Browser beides zu einem Schritt zusammen, findet keinen Weg
          zwischen Anfang und Ende und zeigt gar keine Bewegung.
       4  data-los startet den Uebergang; nach Ablauf wird die Farbe
          festgeschrieben und die Wischlage wieder zusammengezogen.       */
  function bandSetzen(i, richtung, sofort) {
    /* DIE BUEHNE UEBERNIMMT DEN TON DES AKTIVEN VORTEILS. Ein einziges
       Merkmal genuegt: data-ton greift dieselbe Tabelle in warum.css ab,
       aus der auch Kasten und Listeneintrag leben, und liefert damit in
       einem Zug --ton-rgb fuer Verlauf und Schatten und --ton-deck fuer die
       Staerke des Verlaufs. Frueher hat diese Stelle --ton-rgb einzeln
       gesetzt; das waere jetzt die zweite Stelle, an der Farbwissen
       stuende. */
    if (buehne && kaesten[i] && kaesten[i].getAttribute('data-ton')) {
      buehne.setAttribute('data-ton', kaesten[i].getAttribute('data-ton'));
    }

    /* DAS AUFPLOPPEN. Der Kunde: „Wenn der Switch da ist, soll die Farbe
       ganz stark aufploppen, und dann kommt erst der Inhalt des Kastens."
       data-plopp treibt in warum.css beides zugleich: der Verlauf geht auf
       doppelte Deckung, der Balken wird von 6 auf 11 px dicker. Nach
       --wi-plopp faellt beides von allein zurueck, weil das Merkmal wieder
       verschwindet — der Rueckweg braucht keine eigene Ansteuerung.
       Nicht beim ersten Setzen (da hat sich nichts geaendert) und nicht,
       wenn wenig Bewegung gewuenscht ist. */
    if (buehne) {
      if (ploppUhr) { window.clearTimeout(ploppUhr); ploppUhr = 0; }
      if (sofort || wenigBewegung.matches) {
        buehne.removeAttribute('data-plopp');
      } else {
        buehne.setAttribute('data-plopp', '');
        ploppUhr = window.setTimeout(function () {
          ploppUhr = 0;
          buehne.removeAttribute('data-plopp');
        }, dauer('--wi-plopp', 0.26));
      }
    }

    if (!bandGrund || !bandWisch) return;
    var farbe = tonVon(i);
    if (!farbe) return;

    if (wischUhr) {
      window.clearTimeout(wischUhr);
      wischUhr = 0;
      if (bandWisch.style.background) bandGrund.style.background = bandWisch.style.background;
    }

    bandWisch.removeAttribute('data-los');
    bandWisch.style.background = farbe;

    if (sofort || wenigBewegung.matches) {
      bandGrund.style.background = farbe;
      return;
    }

    bandWisch.style.transformOrigin = richtung < 0 ? 'right center' : 'left center';
    void bandWisch.offsetWidth;
    bandWisch.setAttribute('data-los', '');

    wischUhr = window.setTimeout(function () {
      wischUhr = 0;
      bandGrund.style.background = farbe;
      bandWisch.removeAttribute('data-los');
    }, dauer('--wi-wisch', 0.26));
  }

  /* --- 3  Bewegung im Schaubild freigeben, genau einmal je Kasten -------- */
  function bildFrei(i) {
    if (!imBild || i < 0) return;
    var k = kaesten[i];
    if (k && !k.hasAttribute('data-bild')) k.setAttribute('data-bild', '');
  }

  /* --- 4  Den Vorteil setzen: rechts der Kasten, links die Hervorhebung --
     ALLES IN EINEM DURCHGANG. Richtung, Kastenzustaende, Liste und Streifen
     werden nacheinander im selben Aufruf geschrieben; der Browser rechnet
     sie in einem Schritt zusammen. Genau deshalb starten der Balken links
     und der Streifen rechts im selben Augenblick — es gibt keinen zweiten
     Zeitgeber, der sie auseinanderziehen koennte.

     data-ab traegt genau EIN Kasten: der, der gerade abtritt. Alle uebrigen
     werden ausdruecklich zurueckgesetzt, damit kein Kasten mit einem alten
     Merkmal in der Austrittslage stehen bleibt.                          */
  function setzen(i) {
    if (i === jetzt) return;
    var vorher   = jetzt;
    var erstmals = vorher < 0;
    /* Beim allerersten Setzen gibt es keine Richtung — 1 als Vorgabe. */
    var richtung = (erstmals || i > vorher) ? 1 : -1;
    jetzt = i;

    abschnitt.style.setProperty('--wi-dir', richtung);

    for (var n = 0; n < anzahl; n++) {
      if (n === i) {
        kaesten[n].removeAttribute('data-ab');
        kaesten[n].setAttribute('data-an', '');
      } else if (n === vorher) {
        kaesten[n].removeAttribute('data-an');
        kaesten[n].setAttribute('data-ab', '');
      } else {
        kaesten[n].removeAttribute('data-an');
        kaesten[n].removeAttribute('data-ab');
      }
    }
    for (var m = 0; m < knoepfe.length; m++) {
      if (m === i) knoepfe[m].setAttribute('aria-current', 'true');
      else         knoepfe[m].removeAttribute('aria-current');
    }

    bandSetzen(i, richtung, erstmals);
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
      /* Zustaende zuruecknehmen — gestapelt stehen alle Kaesten gleichwertig
         da, jeder mit seinem eigenen Farbstreifen. Auch der Zeitgeber des
         Wischers wird abgeraeumt: sonst schriebe er gleich noch eine Farbe
         in ein Band, das gar nicht mehr zu sehen ist. */
      if (wischUhr) { window.clearTimeout(wischUhr); wischUhr = 0; }
      if (ploppUhr) { window.clearTimeout(ploppUhr); ploppUhr = 0; }
      abschnitt.style.setProperty('--wi-dir', 1);
      if (buehne) {
        buehne.removeAttribute('data-plopp');
        buehne.removeAttribute('data-ton');
      }
      for (var n = 0; n < anzahl; n++) {
        kaesten[n].removeAttribute('data-an');
        kaesten[n].removeAttribute('data-ab');
      }
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
