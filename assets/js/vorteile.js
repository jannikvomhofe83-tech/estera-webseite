/* ===========================================================================
   SO ENTSTEHT VERMOEGENSAUFBAU — der Aufbau der fuenf Karten
   ---------------------------------------------------------------------------
   ZWEI GETRENNTE BEWEGUNGEN, an ZWEI getrennten Merkmalen:

     `data-auf`   — die KARTE selbst: einblenden und Versatz. Wird beim
                    Hereinscrollen genau einmal gesetzt und NIE wieder
                    abgenommen. Die Karte ploppt also genau einmal auf.
     `data-bild`  — die ZEICHNUNG in der Karte: Balken, Verzweigung,
                    Flaechen, Kurve, Haltepunkte, Beschriftung. Wird beim
                    Hereinscrollen zusammen mit `data-auf` gesetzt und beim
                    Ueberfahren mit der Maus zurueckgenommen und neu
                    gesetzt.

   Diese Trennung ist der Kern: haetten Karte und Zeichnung dasselbe
   Merkmal, wuerde der Neustart der Zeichnung die Karte mitreissen und sie
   waere beim Ueberfahren jedes Mal neu aufgeploppt. Genau das soll nicht
   passieren.

   Diese Datei macht damit drei Dinge:

     1  sie schaltet den Aufbau frei (`data-animiert` am Kartenraster) —
        die Bewegung selbst liegt vollstaendig im CSS;
     2  sie setzt an jeder Karte `data-auf` UND `data-bild`, sobald diese
        Karte beim Hereinscrollen weit genug im Bild steht;
     3  sie startet allein die Zeichnung erneut, wenn der Nutzer mit einem
        echten Zeiger auf die Karte faehrt (Kundenwunsch 17.08.2026).

   Bewusste Festlegungen zum EINLAUF:

     — AUSSCHLIESSLICH `IntersectionObserver`. Es gibt keinen
       Scroll-Handler, weder gedrosselt noch ungedrosselt, und keinen
       Zeitgeber, der dauernd misst.
     — EINMALIG. Nach dem Ausloesen wird die Karte sofort aus der
       Beobachtung genommen. Beim Zurueck- und erneuten Hereinscrollen
       passiert nichts mehr — kein Neustart, keine Dauerschleife.
     — KEIN SCROLL-JACKING. Nichts wird blockiert, nichts umgelenkt, es gibt
       kein `scrollTo` und kein `preventDefault`.
     — Ohne Javascript und bei `prefers-reduced-motion: reduce` wird
       `data-animiert` nie gesetzt. Dann greift der CSS-Grundfall: alle
       fuenf Karten und alle Zeichnungen stehen sofort vollstaendig da.

   Bewusste Festlegungen zum NEUSTART BEIM UEBERFAHREN:

     — NUR DIE ZEICHNUNG. `data-auf` wird dabei nicht angefasst; die Karte
       behaelt Deckkraft 1 und ihren Endversatz. Es gibt auch keinen
       Hover-Hub — die Karte steht vollkommen still.
     — NUR MIT ECHTEM ZEIGER. Geprueft wird
       `(hover: hover) and (pointer: fine)`. Auf Touchgeraeten erzeugt eine
       Beruehrung haeufig ein synthetisches `mouseenter`; dort soll nichts
       passieren. Die Pruefung steht ZWEIMAL: einmal, bevor die Zuhoerer
       ueberhaupt haengen, und einmal im Zuhoerer selbst — so wirkt auch
       ein Geraetewechsel waehrend des Besuchs sofort.
     — NUR BEI `prefers-reduced-motion: no-preference`. Bei „weniger
       Bewegung" laeuft dieses Modul gar nicht erst an.
     — KEIN ZAPPELN. Es gilt die Regel „ZU ENDE LAUFEN LASSEN": solange der
       Aufbau einer Karte laeuft, wird jedes weitere `mouseenter` auf
       dieser Karte SCHLICHT IGNORIERT. Damit kann schnelles, wiederholtes
       Ueberfahren die Bewegung weder abschneiden noch stapeln; es gibt
       auch keine Warteschlange, die spaeter nachfeuert.
     — SAUBERER RUECKSETZPUNKT. Ein blosses Wegnehmen von `data-bild` waere
       ein Uebergang RUECKWAERTS — die Zeichnung baute sich erst langsam
       ab. Deshalb: `data-sofort` setzen (schaltet im CSS alle Uebergaenge
       der Zeichnungsteile ab), `data-bild` abnehmen, ERZWUNGENER REFLOW,
       `data-sofort` abnehmen, zweiter Reflow, `data-bild` wieder setzen.
       Erst dadurch kennt der Browser den Startzustand als eigenen Stand
       und laesst die Bewegung von dort neu anlaufen.
     — NUR DIE BETRETENE KARTE. Die vier anderen bleiben unberuehrt.

   `site.js` bleibt unberuehrt; der Aufklapper „Was bewusst offenbleibt"
   haengt weiter allein dort.
   =========================================================================== */
(function () {
  'use strict';

  var raster = document.querySelector('[data-vt-karten]');
  if (!raster) return;

  var karten = Array.prototype.slice.call(raster.querySelectorAll('[data-vt-karte]'));
  if (!karten.length) return;

  function medium(abfrage) {
    return window.matchMedia ? window.matchMedia(abfrage) : { matches: false };
  }

  var ruhig = medium('(prefers-reduced-motion: reduce)');
  /* Echter Zeiger: `hover: hover` allein reicht nicht — manche Touchgeraete
     melden das ebenfalls. Erst zusammen mit `pointer: fine` ist es eine
     Maus, ein Trackpad oder ein Stift. */
  var zeiger = medium('(hover: hover) and (pointer: fine)');

  /* Ohne IntersectionObserver gaebe es keinen Ausloeser — dann bleibt der
     Grundfall stehen, in dem ohnehin alles sichtbar ist. */
  if (!('IntersectionObserver' in window)) return;
  if (ruhig.matches) return;

  /* Ab hier startet alles unfertig. Das Merkmal wird sofort gesetzt, noch
     bevor der Abschnitt in Sicht kommt — sonst waere die erste Karte schon
     gezeichnet, bevor die Bewegung ueberhaupt beginnen kann. */
  raster.setAttribute('data-animiert', '');

  /* Wird auf `true` gesetzt, sobald der Nutzer waehrend des Besuchs auf
     „weniger Bewegung" wechselt. Ab dann ruehrt dieses Modul nichts mehr an. */
  var abgeschaltet = false;

  /* --- Wie lange ein Aufbau dauert -----------------------------------------
     Nicht geschaetzt, sondern aus dem Dokument abgelesen. Jeder Schritt
     einer Zeichnung traegt seine Verzoegerung als `--zv` im
     `style`-Attribut; die laengste davon bestimmt, wann der letzte Schritt
     ANFAENGT. Dazu kommen die beiden festen Werte aus `prinzip.css`:
     0,22 s Vorlauf und 1,2 s fuer die laengste Einzelbewegung (das
     Wandern der Grenze zwischen Restschuld und Eigentum in Karte 04).
     Ein kleiner Zuschlag faengt Bildwiederholung und
     Zeitgeberungenauigkeit ab. */
  var VORLAUF = 0.22;
  var LAENGSTE = 1.2;
  var ZUSCHLAG = 90;

  function dauerVon(karte) {
    var groesste = 0;
    var teile = karte.querySelectorAll('[style*="--zv"]');
    for (var i = 0; i < teile.length; i++) {
      var wert = parseFloat(teile[i].style.getPropertyValue('--zv'));
      if (wert > groesste) groesste = wert;
    }
    return (groesste + VORLAUF + LAENGSTE) * 1000 + ZUSCHLAG;
  }

  function verzoegerungVon(karte) {
    var wert = parseFloat(karte.style.getPropertyValue('--kv'));
    return wert > 0 ? wert * 1000 : 0;
  }

  /* --- Zeichnung starten ---------------------------------------------------
     `laeuft` ist der einzige Schutz gegen Zappeln und gilt fuer BEIDE
     Ausloeser: den Einlauf beim Scrollen und das Ueberfahren. */
  function bildStarten(karte) {
    karte.laeuft = true;
    karte.setAttribute('data-bild', '');
    window.setTimeout(function () {
      karte.laeuft = false;
      /* Der Einlauf war gestaffelt; ein Neustart soll das nicht sein.
         Nach dem ersten Durchlauf faellt die Kartenverzoegerung deshalb
         dauerhaft auf null — sichtbar wird das erst beim Ueberfahren. */
      karte.style.setProperty('--kv', '0s');
    }, karte.aufbauDauer + verzoegerungVon(karte));
  }

  function neustarten(karte) {
    if (abgeschaltet || ruhig.matches) return;
    /* Noch nicht eingelaufen? Dann macht ein Neustart keinen Sinn — die
       Karte wartet auf den Beobachter. */
    if (!karte.hasAttribute('data-auf')) return;
    /* Laeuft noch: zu Ende laufen lassen, nichts abschneiden. */
    if (karte.laeuft) return;

    karte.setAttribute('data-sofort', '');   /* Uebergaenge der Zeichnung aus */
    karte.removeAttribute('data-bild');      /* Sprung in den Startzustand    */
    void karte.offsetWidth;                  /* Startzustand festschreiben    */
    karte.removeAttribute('data-sofort');    /* Uebergaenge wieder an         */
    void karte.offsetWidth;                  /* und auch das festschreiben    */
    bildStarten(karte);
  }

  for (var v = 0; v < karten.length; v++) {
    karten[v].aufbauDauer = dauerVon(karten[v]);
    karten[v].laeuft = false;
  }

  var beobachter = new IntersectionObserver(function (eintraege, selbst) {
    for (var i = 0; i < eintraege.length; i++) {
      var e = eintraege[i];
      if (!e.isIntersecting) continue;
      /* Die Karte ploppt genau hier ein einziges Mal auf … */
      e.target.setAttribute('data-auf', '');
      /* … und die Zeichnung darin beginnt ihren Aufbau. */
      bildStarten(e.target);
      /* Einmalig: ab jetzt nie wieder anfassen. */
      selbst.unobserve(e.target);
    }
  }, {
    /* Die Karte loest aus, sobald ein knappes Viertel von ihr im Bild
       steht — frueh genug, dass der Aufbau nicht erst nachtraeglich
       auffaellt, spaet genug, dass er nicht ausserhalb des Bildes
       stattfindet. Der untere Rand ist eingezogen, damit nichts allein
       durch das Laden weit unterhalb schon ausgeloest wird. */
    threshold: 0.22,
    rootMargin: '0px 0px -8% 0px'
  });

  for (var k = 0; k < karten.length; k++) beobachter.observe(karten[k]);

  /* --- Ueberfahren ---------------------------------------------------------
     `mouseenter` statt `mouseover`: es steigt nicht auf und feuert deshalb
     genau einmal beim Betreten der Karte, nicht erneut bei jedem Wechsel
     zwischen Titel, Text und Zeichnung darin. */
  if (zeiger.matches) {
    for (var z = 0; z < karten.length; z++) {
      (function (karte) {
        karte.addEventListener('mouseenter', function () {
          if (!zeiger.matches) return;
          neustarten(karte);
        });
      })(karten[z]);
    }
  }

  /* Wechselt der Nutzer waehrend des Besuchs auf „weniger Bewegung", faellt
     der Abschnitt sofort in den fertigen Grundfall zurueck. */
  function aufRuheHoeren(fn) {
    if (ruhig.addEventListener) ruhig.addEventListener('change', fn);
    else if (ruhig.addListener) ruhig.addListener(fn);
  }
  aufRuheHoeren(function (e) {
    if (!e.matches) return;
    abgeschaltet = true;
    beobachter.disconnect();
    raster.removeAttribute('data-animiert');
    for (var i = 0; i < karten.length; i++) {
      karten[i].removeAttribute('data-sofort');
      karten[i].setAttribute('data-auf', '');
      karten[i].setAttribute('data-bild', '');
    }
  });
})();
