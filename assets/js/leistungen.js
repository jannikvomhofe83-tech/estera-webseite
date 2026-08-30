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
  var TEMPO    = 620;   /* sichtbare Pixel je Sekunde   */
  var KUERZEST = 0.34;  /* Sekunden                     */
  var LAENGST  = 0.95;  /* Sekunden                     */

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
  var ABSTAND = 260;
  var STUFE2  = 650;

  var bis = 0;            /* wie weit gescrollt wurde (0..3)               */
  var naechste = 0;       /* Index der naechsten zu startenden Stufe       */
  var startZeit = [0, 0, 0];
  var uhr = null;
  /* Steht auf true, sobald die LETZTE Stufe angelaufen ist. Ab da setzt
     nichts mehr zurueck — die Folge laeuft genau ein Mal, siehe der
     ausfuehrliche Vermerk am Rahmenbeobachter weiter unten. */
  var fertig = false;

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
      if (naechste >= STUFEN) fertig = true;
      pumpe();
    }, warte);
  };

  /* Eine Marke meldet sich. Sie kann NUR nach vorn schieben: wer Stufe 3
     sieht, hat Stufe 1 und 2 zwangslaeufig auch schon passiert, und die
     laufen dann der Reihe nach nach. */
  var melde = function (i) {
    if (i + 1 > bis) { bis = i + 1; pumpe(); }
  };

  var zuruecksetzen = function () {
    window.clearTimeout(uhr);
    uhr = null;
    bis = 0;
    naechste = 0;
    startZeit = [0, 0, 0];
    for (var i = 1; i <= STUFEN; i++) netz.removeAttribute('data-s' + i);
  };

  /* Die drei Marken. Der untere Rand ist um 22 Prozent eingezogen: eine
     Stufe soll ausloesen, wenn ihre Gruppe wirklich im Blick ist, und nicht
     schon, wenn sie unten am Fensterrand auftaucht. */
  var markenBeob = new IntersectionObserver(function (eintraege) {
    for (var i = 0; i < eintraege.length; i++) {
      if (!eintraege[i].isIntersecting) continue;
      melde((parseInt(eintraege[i].target.getAttribute('data-stufe'), 10) || 1) - 1);
    }
  }, { rootMargin: '0px 0px -22% 0px', threshold: 0 });

  var marken = netz.querySelectorAll('.wnetz__marke');
  for (var m = 0; m < marken.length; m++) markenBeob.observe(marken[m]);

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     DIE FOLGE LAEUFT NUR NOCH EIN EINZIGES MAL — 31.08.2026

     Bis heute galt: verlaesst die Grafik das Fenster VOLLSTAENDIG, faengt
     die Folge beim naechsten Hereinscrollen von vorn an. Wer zweimal daran
     vorbeirollte, sah die Drehung des Zielkastens zweimal — und wer beim
     Lesen ein Stueck zurueckging und wieder vor, oefter.

     Kundenwortlaut vom 31.08.2026: „Ihre Immobilie als Kapitalanlage"
     dreht sich beim Hereinkommen mehrfach; es soll sich genau einmal,
     langsam drehen und dann STEHEN. „Dann stehen" heisst: auch beim
     zweiten Vorbeikommen steht es.

     `fertig` merkt sich, dass die letzte Stufe angelaufen ist. Danach
     setzt nichts mehr zurueck, und die Grafik bleibt in ihrem Endzustand.
     Der Ruecksetzer selbst bleibt erhalten: er greift weiterhin, solange
     die Folge noch nicht durch ist — wer waehrend des Einlaufs wieder
     wegrollt, bekommt sie beim naechsten Mal von vorn und nicht in der
     Mitte angefangen.
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  var rahmenBeob = new IntersectionObserver(function (eintraege) {
    for (var i = 0; i < eintraege.length; i++) {
      if (!eintraege[i].isIntersecting && bis > 0 && !fertig) zuruecksetzen();
    }
  }, { threshold: 0 });
  rahmenBeob.observe(netz);

  /* Notbremse. Sollte kein Beobachter je ausloesen, obwohl die Grafik im
     Bild steht, laeuft die Folge nach sechs Sekunden von allein an. Die
     Bedingung ist wichtig: ohne sie liefe die Animation auch dann ab, wenn
     der Abschnitt nie gesehen wurde — und der Puls waere verschenkt. */
  window.setTimeout(function () {
    if (bis > 0) return;
    var r = netz.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < h && r.bottom > 0) melde(STUFEN - 1);
  }, 6000);
})();
