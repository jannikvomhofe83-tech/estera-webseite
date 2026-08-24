/* ===========================================================================
   WARUM IMMOBILIEN? — der Antrieb des Abschnitts
   Gehoert zu assets/css/warum.css und zur Section #warum-immobilien.
   Umbau vom 23.08.2026: sechs Vorteile statt vier, Wechsel per KLICK.

   WAS SICH GEGENUEBER DER VORFASSUNG GEAENDERT HAT
   Der Kunde hat den Ausloeser des Wechsels ausgetauscht: „beim Anklicken
   aendert sich nur der Inhalt der grossen Flaeche". Damit ist ERSATZLOS
   entfallen:
     — die Klebemechanik (position: sticky) samt Messung der Klebestrecke
     — die vier leeren Scrollspuren und die Rechnung Fortschritt → Index
     — der Scroll- und der Resize-Horcher
   Die Datei ist dadurch kuerzer und hat einen Zustand weniger: es gibt
   keinen Wert mehr, der zwischen zwei Bildern auseinanderlaufen koennte.

   WAS AUSDRUECKLICH GEBLIEBEN IST — der Kunde hat es gelobt, also wird es
   uebergefuehrt, nicht neu gebaut:
     — die Merkmale data-an / data-ab am Kasten, aus denen warum.css den
       versetzten Wechsel rechnet
     — --wi-dir: die Richtung, aus der sich alles Uebrige spiegelbildlich
       ergibt, ohne einen zweiten Regelsatz
     — das Band aus drei Lagen und der Wischer darin
     — data-plopp: erst die Farbe, dann der Inhalt

   WOHER DIE FARBEN KOMMEN: aus dem CSS, nicht von hier. Jeder .wimm__punkt
   traegt data-ton, warum.css macht daraus --ton, und dieses Skript liest
   den fertigen Wert mit getComputedStyle ab. Es steht also KEIN Farbwert in
   dieser Datei — wer die Farben aendern will, aendert Abschnitt 2 in
   warum.css und sonst nichts. Dasselbe gilt fuer die Dauern: sie werden aus
   --wi-wisch und --wi-plopp gelesen, damit CSS und Zeitgeber nicht
   auseinanderlaufen koennen.

   ZWEI ANORDNUNGEN, EINE BEDIENUNG
     SCHREIBTISCH  ab 1024 px. Sechs Punkte oben, EINE Flaeche darunter.
                   Genau einer ist immer gewaehlt — eine leere Flaeche waere
                   ein Fehlzustand.
     AKKORDEON     darunter. Hoechstens einer ist offen; ein zweiter Klick
                   auf den offenen Punkt schliesst ihn wieder. Das ist die
                   Erwartung an aria-expanded, und „immer nur ein Punkt
                   geoeffnet" bleibt dabei erfuellt.
   Der Wechsel zwischen beiden Anordnungen wird beobachtet: wer von schmal
   auf breit geht, waehrend nichts offen war, bekommt Punkt 01.

   OHNE JAVASCRIPT laeuft diese Datei gar nicht — dann fehlt `data-js="an"`
   an der Section, und warum.css laesst alle sechs Kaesten offen
   untereinander stehen, jeder mit Symbol und Namen seines Vorteils. Die
   Auswahlpunkte sind dann gar nicht erst sichtbar: ein Knopf, der nichts
   bewirkt, ist schlimmer als kein Knopf.

   `prefers-reduced-motion` schaltet hier NICHTS ab ausser der Bewegung. Die
   Bedienung bleibt in jedem Fall dieselbe — geklickt wird auch dort.
   =========================================================================== */
(function () {
  'use strict';

  var abschnitt = document.querySelector('.wimm');
  if (!abschnitt) return;

  var wahl    = abschnitt.querySelector('.wimm__wahl');
  var punkte  = Array.prototype.slice.call(abschnitt.querySelectorAll('.wimm__punkt'));
  var kaesten = Array.prototype.slice.call(abschnitt.querySelectorAll('[data-kasten]'));
  var knoepfe = Array.prototype.slice.call(abschnitt.querySelectorAll('[data-zu]'));
  var anzahl  = kaesten.length;
  if (!wahl || !anzahl || knoepfe.length !== anzahl) return;

  /* Die drei Lagen des Farbstreifens. Fehlen sie — etwa weil jemand das
     Band aus dem Dokument nimmt —, laeuft alles Uebrige unveraendert
     weiter; der Wechsel ist dann bloss weniger auffaellig. */
  var bandGrund = abschnitt.querySelector('.wimm__band-grund');
  var bandWisch = abschnitt.querySelector('.wimm__band-wisch');

  /* --- 1  Anmelden --------------------------------------------------------
     Ab hier gelten die Regeln in warum.css, die Kaesten verbergen.        */
  abschnitt.setAttribute('data-js', 'an');

  var wenigBewegung = window.matchMedia('(prefers-reduced-motion: reduce)');
  var breit         = window.matchMedia('(min-width: 1024px)');

  var jetzt    = -1;      /* gewaehlter Vorteil, -1 = keiner offen         */
  var imBild   = false;   /* Abschnitt ist ins Bild gekommen               */
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

  /* Der Ton eines Vorteils, gelesen aus dem CSS. --ton steht dort ueber
     data-ton am .wimm__punkt und vererbt an den Kasten; getComputedStyle
     liefert den bereits aufgeloesten Wert, auch wenn dahinter wieder eine
     Variable steht (--navy-600). */
  function tonVon(i) {
    var k = kaesten[i];
    if (!k) return '';
    return window.getComputedStyle(k).getPropertyValue('--ton').trim();
  }

  /* --- 2  Der Farbstreifen -------------------------------------------------
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
    /* DIE FLAECHE UEBERNIMMT DEN TON DES GEWAEHLTEN VORTEILS. Ein einziges
       Merkmal genuegt: data-ton an .wimm__wahl greift dieselbe Tabelle in
       warum.css ab, aus der auch Punkt und Kasten leben, und liefert in
       einem Zug --ton-rgb fuer Verlauf und Schatten und --ton-deck fuer die
       Staerke des Verlaufs. Die sechs .wimm__punkt tragen ihren eigenen
       Wert und ueberschreiben die Vererbung fuer sich selbst — sie behalten
       also ihre Farbe. */
    var ton = punkte[i] && punkte[i].getAttribute('data-ton');
    if (ton) wahl.setAttribute('data-ton', ton);

    /* DAS AUFPLOPPEN. Der Kunde: „Wenn der Switch da ist, soll die Farbe
       ganz stark aufploppen, und dann kommt erst der Inhalt des Kastens."
       data-plopp treibt in warum.css beides zugleich: der Verlauf geht auf
       doppelte Deckung, der Streifen wird von 6 auf 11 px dicker. Nach
       --wi-plopp faellt beides von allein zurueck, weil das Merkmal wieder
       verschwindet — der Rueckweg braucht keine eigene Ansteuerung.
       Nicht beim ersten Setzen (da hat sich nichts geaendert) und nicht,
       wenn wenig Bewegung gewuenscht ist. */
    if (ploppUhr) { window.clearTimeout(ploppUhr); ploppUhr = 0; }
    if (sofort || wenigBewegung.matches) {
      wahl.removeAttribute('data-plopp');
    } else {
      wahl.setAttribute('data-plopp', '');
      ploppUhr = window.setTimeout(function () {
        ploppUhr = 0;
        wahl.removeAttribute('data-plopp');
      }, dauer('--wi-plopp', 0.26));
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

  /* --- 3  Bewegung IM Schaubild freigeben, genau einmal je Kasten --------
     `data-bild` loest in warum.css den gestaffelten Einlauf aus: erst das
     ganze Schaubild, dann die einzelnen Flaechen und Beschriftungen in der
     Reihenfolge ihrer --t. Einmalig — beim Hin- und Herklicken laeuft
     nichts erneut los.                                                    */
  function bildFrei(i) {
    if (!imBild || i < 0) return;
    var k = kaesten[i];
    if (k && !k.hasAttribute('data-bild')) k.setAttribute('data-bild', '');
  }

  /* --- 4  Den Vorteil setzen ---------------------------------------------
     ALLES IN EINEM DURCHGANG. Richtung, Kastenzustaende, Knoepfe und
     Streifen werden nacheinander im selben Aufruf geschrieben; der Browser
     rechnet sie in einem Schritt zusammen. Genau deshalb starten der Balken
     oben und der Streifen unten im selben Augenblick — es gibt keinen
     zweiten Zeitgeber, der sie auseinanderziehen koennte.

     data-ab traegt genau EIN Kasten: der, der gerade abtritt. Alle uebrigen
     werden ausdruecklich zurueckgesetzt, damit kein Kasten mit einem alten
     Merkmal in der Austrittslage stehen bleibt.

     i === -1 bedeutet: nichts offen. Das gibt es nur im Akkordeon.       */
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
      knoepfe[n].setAttribute('aria-expanded', n === i ? 'true' : 'false');
    }

    if (i < 0) return;      /* nichts offen: Band und Bild bleiben, wie sie sind */

    bandSetzen(i, richtung, erstmals);
    bildFrei(i);
  }

  /* --- 5  Der Klick --------------------------------------------------------
     Auf dem Schreibtisch ist immer genau einer gewaehlt: ein Klick auf den
     bereits gewaehlten Punkt tut nichts, denn eine leere Flaeche waere ein
     Fehlzustand. Im Akkordeon schliesst derselbe Klick den Punkt wieder —
     das ist die Erwartung an aria-expanded.

     Beim Schliessen und beim Oeffnen wird NICHT gescrollt. Ein Sprung
     waehrend eines Klicks ist fuer den Benutzer ein Kontrollverlust; die
     Zeile, auf die er gerade gedrueckt hat, bleibt stehen.               */
  knoepfe.forEach(function (knopf, n) {
    knopf.addEventListener('click', function () {
      if (n === jetzt) {
        if (!breit.matches) setzen(-1);
        return;
      }
      setzen(n);
    });
  });

  /* --- 6  Anordnung wechseln ----------------------------------------------
     Wer von schmal auf breit geht, waehrend nichts offen war, bekommt
     Punkt 01 — die Flaeche darf nicht leer bleiben.                      */
  function einrichten() {
    if (breit.matches && jetzt < 0) setzen(0);
  }

  /* --- 7  Einlauf der Bloecke, einmalig ------------------------------------
     Erst wenn die Flaeche im Bild ist, darf das Schaubild seinen
     gestaffelten Einlauf laufen — sonst waere er vorbei, bevor jemand
     hinsieht.                                                             */
  var bloecke = abschnitt.querySelectorAll('[data-block]');

  function blockZeigen(el) {
    el.setAttribute('data-auf', '');
    if (el.classList.contains('wimm__wahl')) {
      imBild = true;
      bildFrei(jetzt);
    }
  }

  if ('IntersectionObserver' in window && bloecke.length) {
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        blockZeigen(e.target);
        beob.unobserve(e.target);   /* einmalig, danach abgemeldet */
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(bloecke, function (el) { beob.observe(el); });
  } else {
    /* Ohne Beobachter sofort zeigen — nichts darf unsichtbar bleiben. */
    Array.prototype.forEach.call(bloecke, blockZeigen);
    imBild = true;
  }

  /* --- 8  Anfangszustand ---------------------------------------------------
     Punkt 01 steht in beiden Anordnungen offen. Das ist auch der Zustand,
     den das Dokument selbst mitbringt (aria-expanded="true" am ersten
     Knopf) — Anzeige und Merkmal koennen dadurch nie auseinanderfallen,
     auch nicht in dem Augenblick, bevor dieses Skript laeuft.            */
  setzen(0);

  var horchen = function (mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  };
  horchen(breit, einrichten);
  /* Aendert jemand die Bewegungseinstellung mitten im Betrieb, sollen
     Wischer und Ploppen sofort aufhoeren statt bis zum naechsten Klick
     nachzulaufen. */
  horchen(wenigBewegung, function () {
    if (wischUhr) { window.clearTimeout(wischUhr); wischUhr = 0; }
    if (ploppUhr) { window.clearTimeout(ploppUhr); ploppUhr = 0; }
    wahl.removeAttribute('data-plopp');
    if (bandWisch) bandWisch.removeAttribute('data-los');
    if (bandGrund && jetzt >= 0) bandGrund.style.background = tonVon(jetzt);
  });
})();
