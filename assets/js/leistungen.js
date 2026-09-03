/* ESTERA — Abschnitt „Unsere Leistungen": die Netzgrafik in drei Stufen
   einlaufen lassen.
   ---------------------------------------------------------------------------
   UMBAU 21.08.2026. Bis dahin stand hier ein Rechenwerk, das die
   Verbindungslinien aus den gemessenen Kartenmitten in ein Overlay-SVG
   schrieb — noetig, solange die Kaesten HTML-Karten in einem Raster waren,
   dessen Fugenbreite erst der Umbruch entschied. Die Grafik nach der
   Kundenvorlage ist EIN Inline-SVG: Kaesten und Linien stehen in derselben
   Koordinatenwelt auf festen Rasterpunkten. Damit gibt es nichts mehr zu
   messen und nichts mehr, was verrutschen koennte.

   ===== DIE DREI STUFEN ====================================================
   Kundenwunsch: „Wenn man runter scrollt, zuerst kommt Off-Market. Dann wenn
   man Off-Market sieht, scrollt man weiter. Dann kommen die vier Punkte …
   und Estera in der Mitte. Erst wenn alle diese vier sichtbar sind und man
   dann noch mal weiter scrollt, ploppt es so richtig in gruen."

     Stufe 1   der Kasten Off-Market und sein Pfeil nach unten
     Stufe 2   die Wortmarke, dann die obere Reihe als PAAR (Erstgespraech
               und Finanzierung gleichzeitig), 340 ms spaeter die untere
               Reihe als Paar (Standort und Begleitung gleichzeitig). Die
               S-Boegen laufen mit ihrem Kasten mit.
     Stufe 3   der lange Pfeil und der Zielkasten mit dem gruenen Puls

   Welches Element zu welcher Stufe gehoert, steht als `data-st` am Element
   selbst; `--auf` staffelt innerhalb der Stufe. Ausgewertet wird beides in
   assets/css/auswahl.css. Dieses Skript setzt nur die Schalter data-s1,
   data-s2 und data-s3 am Rahmen.

   ===== KEIN SCROLL-HIJACKING ==============================================
   Es wird nichts abgefangen, nichts eingerastet, kein preventDefault. Das
   Rad des Besuchers bleibt seins. Die Grafik ist hoch genug, dass
   Off-Market, die Mitte und der Zielkasten beim normalen Scrollen
   nacheinander ins Bild kommen — genau das beschreibt der Kunde. Je Stufe
   beobachtet ein IntersectionObserver eine unsichtbare Marke auf der Hoehe
   der jeweiligen Gruppe.

   ===== WARUM TROTZDEM EINE WARTESCHLANGE ==================================
   Auf einem hohen Fenster (1920 x 1080, 1512 x 982) wird die halbe Grafik
   auf einen Schlag sichtbar, und alle drei Marken melden im selben
   Augenblick. Ohne Reihenfolge liefen die Stufen dann gleichzeitig ab und
   die Dramaturgie waere genau auf den grossen Bildschirmen kaputt, fuer die
   sie gedacht ist. Die Warteschlange erzwingt deshalb:

     — eine spaetere Stufe startet NIE vor einer frueheren;
     — zwischen zwei Starts liegen mindestens ABSTAND Millisekunden;
     — Stufe 3 startet erst, wenn Stufe 2 vollstaendig durchgelaufen ist
       („erst wenn alle diese vier sichtbar sind").

   Verlaesst die Grafik das Fenster ganz, wird zurueckgesetzt; beim naechsten
   Hereinscrollen laeuft die Folge neu, samt gruenem Puls.

   ===== SCHALTER ===========================================================
   data-bereit          schaltet die Startzustaende ueberhaupt erst frei.
                        Genau deshalb steht das hier und nicht im
                        Stylesheet: faellt Javascript aus, wird der Schalter
                        nie gesetzt und die Grafik steht vollstaendig
                        sichtbar da, gruene Kontur inklusive.
   data-s1 / s2 / s3    je eine Stufe im Endzustand.

   Der Rahmen traegt bewusst KEIN data-zeichnen mehr. site.js wuerde sonst
   parallel einen eigenen Schalter setzen; ein Besitzer ist hier besser als
   zwei.                                                                     */
(function () {
  'use strict';

  var netz = document.querySelector('#leistungen .wnetz');
  if (!netz) return;

  var STUFEN = 3;

  /* =======================================================================
     DIE DAUER DER LINIENZUEGE
     Die Linien decken sich ueber stroke-dashoffset auf. Ihre GEOMETRIE
     braucht dafuer keine Messung: jeder Zug traegt im Markup pathLength="1",
     seine Laenge ist also auf 1 normiert und `stroke-dasharray: 1` deckt ihn
     unabhaengig von viewBox und Darstellungsgroesse exakt ab.

     Was ohne Messung NICHT stimmt, ist die Dauer. Bei gleicher Dauer laeuft
     ein 90 Einheiten kurzer Verbinder genauso lange wie ein 400 Einheiten
     langer S-Bogen — der eine kriecht, der andere schiesst. Deshalb wird die
     tatsaechliche Laenge mit getTotalLength() geholt, mit dem Massstab der
     Zeichnung in Bildschirmpixel umgerechnet und daraus eine Dauer bei
     gleichbleibender Ziehgeschwindigkeit gesetzt.

     Die Grenzen sind kein Zierrat: ohne die untere blitzten die kurzen
     Pfeile nur auf, ohne die obere zoege der laengste Zug ueber eine
     Sekunde und die Stufe waere lange nach dem Blick des Lesers noch
     beschaeftigt.
     ======================================================================= */
  /* 620 / 0,34 / 0,95 -> 900 / 0,3 / 0,6 am 01.09.2026 — Optimierungs-
     briefing P0: keine Bewegung ueber 600 ms. Die S-Zuege sind seit dem
     Umbau der Grafik am selben Tag ausserdem kuerzer. */
  var TEMPO    = 900;   /* sichtbare Pixel je Sekunde   */
  var KUERZEST = 0.3;   /* Sekunden                     */
  var LAENGST  = 0.6;   /* Sekunden                     */

  var messen = function () {
    var bilder = netz.querySelectorAll('.wnetz__bild');
    for (var i = 0; i < bilder.length; i++) {
      var bild = bilder[i];
      var rahmen = bild.getBoundingClientRect();
      /* Die gerade nicht eingeblendete Zeichnung steht auf display:none und
         hat keine Breite. Sie bleibt bei ihrem Ersatzwert aus dem
         Stylesheet; sobald sie eingeblendet wird, laeuft diese Funktion
         ueber den resize-Horcher noch einmal. */
      if (!rahmen.width) continue;

      var feld = bild.viewBox && bild.viewBox.baseVal;
      var massstab = (feld && feld.width) ? rahmen.width / feld.width : 1;

      var zuege = bild.querySelectorAll('.wnetz__zug');
      for (var j = 0; j < zuege.length; j++) {
        var laenge = 0;
        try { laenge = zuege[j].getTotalLength(); } catch (e) {}
        /* Manche Browser geben bei gesetztem pathLength genau diesen Wert
           zurueck statt der gerechneten Laenge. Dann ist hier nichts zu
           holen, und der Ersatzwert aus dem Stylesheet gilt weiter. */
        if (!(laenge > 2)) continue;
        var s = laenge * massstab / TEMPO;
        if (s < KUERZEST) s = KUERZEST;
        if (s > LAENGST) s = LAENGST;
        zuege[j].style.setProperty('--dauer', s.toFixed(2) + 's');
      }
    }
  };

  messen();
  var bremse;
  window.addEventListener('resize', function () {
    window.clearTimeout(bremse);
    bremse = window.setTimeout(messen, 120);
  });

  var alleStufen = function () {
    for (var i = 1; i <= STUFEN; i++) netz.setAttribute('data-s' + i, 'true');
  };

  /* Wer keine Bewegung will oder keinen Beobachter hat, bekommt den fertigen
     Zustand sofort — ohne Startzustand gibt es auch nichts zu verbergen.
     data-bereit wird dabei NICHT gesetzt; damit greifen die Startzustaende
     gar nicht erst, und es kann nichts haengen bleiben. */
  var ruhig = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ruhig || !('IntersectionObserver' in window)) { alleStufen(); return; }

  netz.setAttribute('data-bereit', 'true');

  /* ===== Die Warteschlange ==============================================
     ABSTAND  Mindestabstand zwischen dem Start zweier Stufen. 260 ms sind
              lang genug, dass man den Wechsel als Folge liest, und kurz
              genug, dass niemand auf die Grafik wartet.
     STUFE2   Wie lange gewartet wird, bevor Stufe 3 darf.

              GEKUERZT AM 21.08. VON 1300 AUF 650 ms. Kundenwunsch: „Ihre
              Immobilie als Kapitalanlage braucht noch einen Ticken zu
              lange, bis es reinkommt." Die Rechnung dahinter: das zweite
              Kastenpaar startet 2 x 0.17 s = 340 ms nach Stufe 2 und ist
              nach weiteren 0.44 s eingelaufen, also bei 780 ms. Stufe 3
              beginnt bei 650 ms mit dem langen Pfeil — der zieht 340 ms und
              steht damit bei 990 ms. Der Zielkasten selbst haengt drei
              Takte hinter dem Pfeil (3 x 0.17 s) und erscheint bei
              650 + 510 = 1160 ms, also rund 650 ms nach dem zweiten Paar.
              Genau das war die Vorgabe.

              WARUM NICHT NOCH FRUEHER: waere STUFE2 kleiner, liefe der
              Zielkasten in das noch einlaufende zweite Paar hinein. Der
              Schlusspunkt soll ein eigener Schritt bleiben, kein Teil der
              Welle davor.                                                 */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     260 / 650 -> 80 / 160 ms am 01.09.2026 — Optimierungsbriefing P0:
     „kaum Verzoegerung zwischen Elementen". Die Reihenfolge der drei Stufen
     bleibt erzwungen (sie ist die Dramaturgie, die der Kunde bestellt hat),
     aber niemand wartet mehr auf sie: die ganze Grafik steht nach rund
     einer Sekunde statt nach zwei. Die Rechnung von oben gilt sinngemaess
     mit den neuen Zahlen aus auswahl.css (--wn-takt 0,06 s).
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  var ABSTAND = 80;
  var STUFE2  = 160;

  var bis = 0;            /* wie weit gescrollt wurde (0..3)               */
  var naechste = 0;       /* Index der naechsten zu startenden Stufe       */
  var startZeit = [0, 0, 0];
  var uhr = null;

  var pumpe = function () {
    if (uhr || naechste >= bis) return;
    var i = naechste;
    var fruehestens = 0;
    if (i > 0) fruehestens = startZeit[i - 1] + (i === 2 ? STUFE2 : ABSTAND);
    var warte = Math.max(0, fruehestens - Date.now());
    uhr = window.setTimeout(function () {
      uhr = null;
      startZeit[i] = Date.now();
      naechste = i + 1;
      netz.setAttribute('data-s' + (i + 1), 'true');
      pumpe();
    }, warte);
  };

  /* Eine Marke meldet sich. Sie kann NUR nach vorn schieben: wer Stufe 3
     sieht, hat Stufe 1 und 2 zwangslaeufig auch schon passiert, und die
     laufen dann der Reihe nach nach. */
  var melde = function (i) {
    if (i + 1 > bis) { bis = i + 1; pumpe(); }
  };

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     DER RUECKSETZER IST AM 01.09.2026 ERSATZLOS ENTFALLEN.

     Bis dahin galt: verlaesst die Grafik das Fenster, bevor die dritte
     Stufe angelaufen ist, wird alles zurueckgenommen und laeuft beim
     naechsten Hereinscrollen von vorn (`zuruecksetzen`, `rahmenBeob`,
     `fertig`). Der Gedanke war, eine halb gelaufene Folge nicht in der
     Mitte stehen zu lassen.

     Das Optimierungsbriefing (P0, „Scroll-Animationen und weisse Flaechen")
     hat genau das als Fehler benannt: „Inhalte duerfen nie dauerhaft mit
     opacity: 0 verbleiben. Alle Inhalte muessen auch bei schnellem
     Scrollen sofort zuverlaessig sichtbar sein." Nachgemessen bei 1440 x
     900 nach schnellem Durchrollen: 31 Elemente dieser Grafik standen nach
     600 ms Ruhe auf Deckkraft 0 — die Marken hatten beim Durchrollen
     gemeldet, der Rahmenbeobachter hatte beim Verlassen alles wieder
     zurueckgenommen, und wer dann zurueckrollte, fand einen leeren
     Abschnitt, bis eine Marke erneut ins Bild kam.

     Jetzt gilt: was einmal gezeigt ist, bleibt. Die Folge laeuft genau
     einmal, so wie es der Kunde am 31.08. verlangt hat („und dann STEHEN")
     — und sie laeuft auch dann zu Ende, wenn man sie nicht ansieht.
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  /* Die drei Marken. FRUEH — Optimierungsbriefing P0: der Beobachter meldet
     beim ersten Bildpunkt und schon 10 Prozent UNTER der Fensterkante.
     Vorher war der untere Rand um 22 Prozent EINGEZOGEN, damit eine Stufe
     erst im Blick auslöst; das hiess aber auch, dass ein Fuenftel des
     Fensters leer blieb, waehrend man auf sie zusah. */
  var markenBeob = new IntersectionObserver(function (eintraege) {
    for (var i = 0; i < eintraege.length; i++) {
      if (!eintraege[i].isIntersecting) continue;
      melde((parseInt(eintraege[i].target.getAttribute('data-stufe'), 10) || 1) - 1);
    }
  }, { rootMargin: '0px 0px 10% 0px', threshold: 0 });

  var marken = netz.querySelectorAll('.wnetz__marke');
  for (var m = 0; m < marken.length; m++) markenBeob.observe(marken[m]);

  /* SICHERHEITSNETZ BEIM ROLLEN — 01.09.2026. Ein IntersectionObserver
     rechnet nur an Bildwechseln; bei 900 px je Radschritt kann eine Marke
     zwischen zwei Bildern durch das ganze Fenster springen, ohne je
     „drin" gewesen zu sein. Deshalb prueft jeder Rollvorgang (gedrosselt
     auf einen Bildwechsel) selbst, welche Marken bereits oberhalb der
     Kante von 110 Prozent Fensterhoehe liegen, und meldet die hoechste.
     Sind alle drei Stufen gemeldet, haengt sich der Lauscher aus. */
  var ticket = 0;
  var nachsehen = function () {
    ticket = 0;
    if (bis >= STUFEN) { window.removeEventListener('scroll', anfordern); return; }
    var grenze = (window.innerHeight || document.documentElement.clientHeight) * 1.1;
    var hoechste = -1;
    for (var k = 0; k < marken.length; k++) {
      if (marken[k].getBoundingClientRect().top < grenze) {
        var st = (parseInt(marken[k].getAttribute('data-stufe'), 10) || 1) - 1;
        if (st > hoechste) hoechste = st;
      }
    }
    if (hoechste >= 0) melde(hoechste);
  };
  var anfordern = function () { if (!ticket) ticket = requestAnimationFrame(nachsehen); };
  window.addEventListener('scroll', anfordern, { passive: true });
  window.addEventListener('pageshow', anfordern);

  /* Notbremse. Sollte kein Beobachter je ausloesen, obwohl die Grafik im
     Bild steht, laeuft die Folge nach zwei Sekunden von allein an (vorher
     sechs — 01.09.2026). Die Bedingung ist wichtig: ohne sie liefe die
     Animation auch dann ab, wenn der Abschnitt nie gesehen wurde. */
  window.setTimeout(function () {
    if (bis > 0) return;
    var r = netz.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < h * 1.1 && r.bottom > 0) melde(STUFEN - 1);
  }, 2000);
})();
