/* ---------------------------------------------------------------------------
   ESTERA — KARRIERE (Übersichtsseite)
   Neu gebaut am 30.08.2026 zusammen mit Abschnitt 9 von karriere.css.

   Diese Datei macht fünf Dinge. Die eigentliche Bewegung steckt vollständig
   in karriere.css — hier wird nur vorbereitet und geschaltet. Es läuft
   keine einzige Bildfolge über Javascript, es hängt nichts am Bildlauf, und
   es gibt kein requestAnimationFrame.

   1  DAS KOPFVIDEO BEI RUHIGER DARSTELLUNG ANHALTEN
      Das Ausblenden erledigt karriere.css und wirkt auch ohne Javascript.
      Hier wird das Video zusätzlich angehalten, damit es nicht unsichtbar
      weiterläuft und Rechenzeit und Bandbreite kostet.

   2  DIE ÜBERSCHRIFTEN IN ZEILEN TEILEN
      Die Leitgeste der Seite schiebt jede Überschrift zeilenweise hinter
      einer Kante hervor (Werte der Vorlage fluid.glass, siehe karriere.css).
      Dafür braucht jede Zeile eine eigene Verzögerung — und Zeilen gibt es
      im DOM nicht, es gibt nur Text. Also bekommt jedes WORT eine Hülle,
      und die Hüllen werden anschließend nach ihrer gemessenen Höhenlage zu
      Zeilen gruppiert. Das ist der Grund, warum der Versatz auch dann
      stimmt, wenn die Überschrift bei 1024 px anders umbricht als bei 1920.

   3  DEN VERSATZ DER BANDKARTEN SETZEN
      --i umlaufend 0 … 7 auf allen 24 Karten des Laufbands. In CSS gibt es
      keinen Zähler, der sich in eine Verzögerung rechnen ließe. Warum
      umlaufend und nicht nur auf dem ersten Satz, steht unten an Ort und
      Stelle — es hängt daran, welcher Satz beim Eintritt tatsächlich im
      Bild steht.

   4  DIE KLASSE `ist-da` BEIM EINTRITT SETZEN
      Ein IntersectionObserver, einmalig; danach wird das Element nicht mehr
      beobachtet.
      SEIT 01.09.2026 MIT SICHERHEITSNETZ (Optimierungsbriefing, Abschnitt
      02, P0): threshold 0, nach unten 200 px vorgezogen, und beim Rollen
      wird zusaetzlich alles aufgedeckt, was ueber der Fensterunterkante
      steht. Ausfuehrlich unten bei Punkt 4.

   5  DIE GANZE STELLENKARTE KLICKBAR (01.09.2026, Briefing Abschnitt 19)
      Ein Klick auf die Kartenflaeche loest den Verweis „Mehr erfahren"
      aus. Die Knoepfe selbst bleiben gewoehnliche Verweise; ohne Skript
      fehlt nur die Flaeche, nicht der Weg. Laeuft auch bei „reduce".

   OHNE JAVASCRIPT
   steht die Seite vollständig da. Sämtliche Bewegungsregeln in karriere.css
   hängen an [data-js='an'], und dieses Merkmal setzt erst diese Datei —
   fällt sie aus, ist nie etwas unsichtbar. Auch geteilt wird dann nicht:
   die Überschriften bleiben schlichter Text. Das Video trägt autoplay,
   muted, loop und playsinline im HTML und spielt deshalb auch ohne Skript
   von selbst ab.

   BEI prefers-reduced-motion: reduce
   steigt alles ab Punkt 2 in der ersten Zeile aus: [data-js='an'] wird gar
   nicht erst gesetzt, es wird nichts geteilt, es wird nichts beobachtet.
   Alles steht sofort im Endzustand. Zusätzlich nimmt Abschnitt 10 von
   karriere.css jeden Anfangszustand ausdrücklich zurück — für den Fall,
   dass jemand die Einstellung erst NACH dem Laden umstellt.

   BEKANNTE GRENZE, damit sie nicht als Fehler gelesen wird: fällt das
   Skript aus UND ist gleichzeitig „reduce" gesetzt, wird das Video von
   karriere.css zwar ausgeblendet, läuft aber im Hintergrund weiter.
   Sichtbar bewegt sich in diesem Fall nichts.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var ruhig = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1  Das Kopfvideo — zuerst, weil es unabhängig von allem Übrigen ist
        und auch dann greifen soll, wenn die Bewegung aussteigt.
     --------------------------------------------------------------------- */
  var video = document.querySelector('[data-hero-video]');
  if (video && ruhig) {
    video.removeAttribute('autoplay');
    video.autoplay = false;
    video.loop = false;
    try { video.pause(); } catch (e) { /* manche Browser werfen, bevor
                                          Metadaten da sind — dann greift
                                          das pause() unten */ }
    video.addEventListener('loadeddata', function () {
      try { video.pause(); } catch (e) {}
    });
  }

  /* ---------------------------------------------------------------------
     5  Die ganze Stellenkarte klickbar — 01.09.2026, Briefing Abschnitt 19
        („ganze Karten klickbar, Hover/Fokus sichtbar, tastaturbedienbar").

     Steht VOR dem Ausstieg fuer „reduce", weil es mit Bewegung nichts zu
     tun hat. Der Klick wird an den Verweis [data-karte-ziel] der Karte
     weitergereicht („Mehr erfahren", die Stellenseite) — ueber dessen
     eigenes click(), damit href, Verlauf und Tastenkombinationen so
     funktionieren, wie der Browser sie fuer einen Verweis kennt.

     NICHT weitergereicht wird, wenn der Klick ohnehin auf einem Verweis
     landet (der zweite Knopf „Jetzt bewerben" fuehrt woandershin) oder
     wenn jemand gerade Text in der Karte markiert hat — ein Klick zum
     Markieren ist kein Klick zum Navigieren.

     Tastatur: die Karte bekommt KEIN tabindex. Ihre zwei Knoepfe sind
     bereits Tab-Stopps, und :focus-within in karriere.css zeigt den Fokus
     auf der ganzen Karte an. Ein dritter Halt waere ein Umweg.
     --------------------------------------------------------------------- */
  var klickkarten = document.querySelectorAll('.kar-karte--klick');
  for (var k = 0; k < klickkarten.length; k++) {
    klickkarten[k].addEventListener('click', function (ev) {
      if (ev.defaultPrevented) return;
      if (ev.target.closest && ev.target.closest('a, button')) return;
      var auswahl = window.getSelection && window.getSelection();
      if (auswahl && String(auswahl).length) return;
      var ziel = this.querySelector('[data-karte-ziel]');
      if (ziel) ziel.click();
    });
  }

  /* Bei ruhiger Darstellung in der ersten Zeile aussteigen. Ebenso, wenn
     der Browser keinen IntersectionObserver kennt — dann bleibt alles
     sichtbar stehen, statt auf ein Ereignis zu warten, das nie kommt. */
  if (ruhig || !('IntersectionObserver' in window)) return;

  var wurzel = document.querySelector('.kar');
  if (!wurzel) return;

  /* Erst JETZT wird das Merkmal gesetzt, das die Anfangszustände in
     karriere.css scharf schaltet. Das Skript steht am Ende des <body>, der
     Baum ist also vollständig; gesetzt wird vor dem ersten Anstrich, damit
     nichts erst sichtbar wird und dann verschwindet. */
  wurzel.setAttribute('data-js', 'an');

  /* ---------------------------------------------------------------------
     2  Die Überschriften in Zeilen teilen

     ZWEI SCHRITTE, und die Trennung ist Absicht:
       teilen()  zerlegt einmalig in Wörter — verändert den Baum
       zeilen()  misst die Höhenlage und vergibt --z — verändert nur Werte
     Nur der zweite Schritt wird wiederholt, wenn sich der Umbruch ändert
     (Schriftnachladung, Fensterbreite). Ein zweites Zerlegen gäbe es nicht,
     und es wäre auch nicht nötig.
     --------------------------------------------------------------------- */

  /* Zerlegt alle Textknoten unterhalb von el in Wörter und legt um jedes
     Wort zwei Spannen: außen die Kante (.kar-zg), innen das Wort selbst
     (.kar-zg__i), das dahinter hervorfährt.

     DIE VORHANDENE AUSZEICHNUNG BLEIBT ERHALTEN. Zerlegt werden die
     TEXTKNOTEN, nicht das Element — <span class="kar-akzent"> überlebt also
     mit allem, was daran hängt (kursiv, Akzentfarbe). Deshalb sitzt die
     Kante am Wort und nicht an der Zeile: eine Zeilenhülle müsste Wörter
     aus dem Akzentspan herausnehmen, und die Auszeichnung wäre weg. Am
     Bild ändert das nichts — alle Wörter einer Zeile stehen im selben
     Zeilenkasten, ihre Kanten liegen also auf einer Geraden und der
     Versatz ist für alle derselbe.

     GETRENNT WIRD NUR AN ECHTEN LEERZEICHEN, Tabulatoren und Umbrüchen —
     AUSDRÜCKLICH NICHT am geschützten Leerzeichen ( ). Ein \s in der
     Regel würde auch dort trennen, und aus dem geschützten Leerzeichen
     würde eine Trennstelle: „Immobilienberater (m/w/d)" dürfte dann
     umbrechen, obwohl im Markup ausdrücklich &nbsp; steht. */
  function teilen(el) {
    var texte = [];
    (function sammeln(n) {
      for (var k = n.firstChild; k; k = k.nextSibling) {
        if (k.nodeType === 3) { if (/\S/.test(k.data)) texte.push(k); }
        else if (k.nodeType === 1) sammeln(k);
      }
    })(el);

    var huellen = [];
    for (var i = 0; i < texte.length; i++) {
      var t = texte[i];
      var stuecke = t.data.split(/([ \t\n\r]+)/);
      var frag = document.createDocumentFragment();
      for (var j = 0; j < stuecke.length; j++) {
        var s = stuecke[j];
        if (!s) continue;
        if (/^[ \t\n\r]+$/.test(s)) {
          /* Der Browser faltet Folgen von Leerraum ohnehin zu einem
             Leerzeichen zusammen — hier wird dasselbe getan, damit
             zwischen zwei Hüllen genau ein Leerzeichen steht. */
          frag.appendChild(document.createTextNode(' '));
          continue;
        }
        var aussen = document.createElement('span');
        aussen.className = 'kar-zg';
        var innen = document.createElement('span');
        innen.className = 'kar-zg__i';
        innen.appendChild(document.createTextNode(s));
        aussen.appendChild(innen);
        frag.appendChild(aussen);
        huellen.push(aussen);
      }
      t.parentNode.replaceChild(frag, t);
    }
    if (!huellen.length) return null;
    el.classList.add('kar-geteilt');
    return huellen;
  }

  /* Gruppiert die Hüllen nach ihrer Höhenlage zu Zeilen und schreibt die
     Zeilennummer als --z. Die Toleranz von 4 px fängt Rundung ab; echte
     Zeilen liegen bei dieser Schriftgröße immer über 30 px auseinander. */
  function zeilen(huellen) {
    var vorige = null, z = -1;
    for (var i = 0; i < huellen.length; i++) {
      var o = huellen[i].offsetTop;
      if (vorige === null || o - vorige > 4) { z++; vorige = o; }
      huellen[i].style.setProperty('--z', z);
    }
  }

  var geteilt = [];
  var titel = wurzel.querySelectorAll('.kar-titel');
  for (var i = 0; i < titel.length; i++) {
    var h = teilen(titel[i]);
    if (h) geteilt.push({ el: titel[i], huellen: h });
  }
  for (i = 0; i < geteilt.length; i++) zeilen(geteilt[i].huellen);

  /* Der Umbruch kann sich noch zweimal ändern, nachdem oben gemessen wurde:
     wenn die Webschrift nachlädt (bis dahin steht die Ersatzschrift, die
     anders bricht) und wenn jemand das Fenster zieht. Neu gemessen wird nur
     bei Überschriften, die noch nicht gelaufen sind — bei den übrigen wäre
     es folgenlos, denn ihr Endzustand ist unabhängig vom Versatz. */
  function neuMessen() {
    for (var i = 0; i < geteilt.length; i++) {
      if (!geteilt[i].el.classList.contains('ist-da')) zeilen(geteilt[i].huellen);
    }
  }
  if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
    document.fonts.ready.then(neuMessen);
  }
  var zaehler = null;
  window.addEventListener('resize', function () {
    clearTimeout(zaehler);
    zaehler = setTimeout(neuMessen, 150);
  });

  /* ---------------------------------------------------------------------
     3  Der Versatz der Bandkarten

     UMLAUFEND MODULO 8, NICHT NUR AUF DEM ERSTEN SATZ — und das ist eine
     Korrektur, die ohne Nachrechnen falsch geblieben wäre:

     Die Spur startet bei translateX(−33,3333 %), also um genau eine
     Satzbreite (2752 px) nach links versetzt. Am linken Fensterrand steht
     damit im Augenblick des Eintritts nicht die erste Karte von SATZ 1,
     sondern die von SATZ 2. Bekämen nur die ersten acht Karten einen
     eigenen Wert, liefe die Staffel auf Karten, die niemand sieht, während
     die sichtbaren acht alle gleichzeitig aufträten.

     Mit i % 8 trägt JEDER Satz dieselbe Staffel 0 … 7. Welcher Satz gerade
     im Bild steht, ist damit gleichgültig — die Kette ist immer die
     richtige. Die drei Sätze sind ohnehin wortgleiche Kopien.
     --------------------------------------------------------------------- */
  var bandkarten = wurzel.querySelectorAll('.kar-band__karte');
  for (i = 0; i < bandkarten.length; i++) {
    bandkarten[i].style.setProperty('--i', i % 8);
  }

  /* ---------------------------------------------------------------------
     4  Der Auslöser

     Beobachtet werden drei Arten von Zielen:
       [data-stellen]  die Stellenliste — als GRUPPE, nicht die einzelne
                       Kachel: sonst liefe der Versatz von 0,14 s gegen den
                       Eintritt jeder einzelnen Kachel statt gegen den der
                       Reihe.
       .kar-band       der Behälter des Laufbands. Er löst den Auftritt der
                       acht Karten UND den Anlauf der Spur zugleich aus —
                       beides muss im selben Augenblick beginnen, sonst
                       stimmt die Rechnung des Anlaufs nicht mehr.
       [data-auf]      alles Übrige, jedes für sich.

     UMGEBAUT AM 01.09.2026 — Optimierungsbriefing, Abschnitt 02 (P0) und
     11, CODE Karriere-Scrollverhalten: „Sections frueher einblenden und
     keine Hoehe fuer noch unsichtbare Inhalte reservieren. Gerade ‚Mehr
     als ein Arbeitsplatz', Teamstimmen und Rollenuebersicht duerfen beim
     schnellen Scrollen nicht leer bleiben."

     Bis dahin: threshold 0,1 und rootMargin −40 px unten. Beides hat beim
     schnellen Rollen versagt, und zwar messbar: in 900-px-Schritten
     gerollt standen 600 ms spaeter noch 117 Elemente unsichtbar im
     Fenster. Zwei Ursachen. Erstens wurde etwas, das mit weniger als
     einem Zehntel in den Ausschnitt ragte, nie gemeldet — bei einer
     Kartenreihe von 1090 px reichte ein Schritt nicht, um das Zehntel zu
     erreichen. Zweitens liefert der Beobachter seine Meldung erst nach
     dem Rollen; wer weiterrollt, bevor sie kommt, hat das Element schon
     wieder aus dem Fenster geschoben.

     JETZT DREI SICHERUNGEN:
       threshold 0        der erste Bildpunkt genuegt.
       rootMargin +200 px die Beobachtung reicht 200 px UNTER die
                          Fensterkante; ein Element wird aufgedeckt,
                          bevor es ins Bild kommt, und ist beim Eintritt
                          schon in Bewegung statt erst dann zu starten.
       aufdecken()        beim Rollen und beim Groessenwechsel wird ohne
                          Umweg ueber den Beobachter alles aufgedeckt,
                          dessen Oberkante ueber der Fensterunterkante
                          (+200 px) liegt. Das ist die Regel des
                          Briefings woertlich: nichts, was im oder
                          oberhalb des Fensters steht, darf unsichtbar
                          bleiben — und sie greift auch, wenn der
                          Beobachter eine Meldung schuldig bleibt.
     aufdecken() laeuft ueber requestAnimationFrame gebuendelt, also
     hoechstens einmal je Bild, und rechnet nur mit den Zielen, die noch
     nicht aufgedeckt sind. Sind alle da, haengen die Ereignisse an einer
     leeren Liste; abgemeldet werden sie zusaetzlich.
     --------------------------------------------------------------------- */
  var ziele = [];
  var liste = wurzel.querySelector('[data-stellen]');
  if (liste) ziele.push(liste);
  var band = wurzel.querySelector('.kar-band');
  if (band) ziele.push(band);
  Array.prototype.push.apply(ziele, wurzel.querySelectorAll('[data-auf]'));

  var VORLAUF = 200;   /* px unter der Fensterunterkante, gilt fuer beide Wege */
  var offen = ziele.slice();
  var beobachter;      /* wird unten angelegt; aufdecke() laeuft erst danach */

  function aufdecke(el) {
    el.classList.add('ist-da');
    beobachter.unobserve(el);
    var p = offen.indexOf(el);
    if (p > -1) offen.splice(p, 1);
    if (!offen.length) {
      window.removeEventListener('scroll', anfordern);
      window.removeEventListener('resize', anfordern);
    }
  }

  beobachter = new IntersectionObserver(function (eintraege) {
    for (var i = 0; i < eintraege.length; i++) {
      if (!eintraege[i].isIntersecting) continue;
      aufdecke(eintraege[i].target);
    }
  }, { threshold: 0, rootMargin: '0px 0px ' + VORLAUF + 'px 0px' });

  for (i = 0; i < ziele.length; i++) beobachter.observe(ziele[i]);

  var angefordert = false, bild = 0, uhr = 0;
  function aufdecken() {
    angefordert = false;
    cancelAnimationFrame(bild);
    clearTimeout(uhr);
    var grenze = window.innerHeight + VORLAUF;
    /* rueckwaerts, weil aufdecke() aus `offen` entfernt */
    for (var i = offen.length - 1; i >= 0; i--) {
      /* Oberkante ueber der Grenze — im Fenster, knapp darunter oder
         laengst darueber hinweg gerollt: in allen drei Faellen aufdecken. */
      if (offen[i].getBoundingClientRect().top < grenze) aufdecke(offen[i]);
    }
  }
  /* Gebuendelt ueber requestAnimationFrame UND einen Zeitgeber von 120 ms —
     wer zuerst kommt, rechnet, der andere wird abgesagt. Der Zeitgeber
     ist der Rueckfall fuer den Fall, dass der Browser gerade keine Bilder
     zeichnet (Tab im Hintergrund, gedrosselte Darstellung): dann bliebe
     ein reines rAF liegen, und mit ihm das Aufdecken. Gemessen in der
     Headless-Shell, in der ohne Eingabe kein Bild entsteht — dort fiel
     auch der IntersectionObserver aus, der Zeitgeber nicht. */
  function anfordern() {
    if (angefordert) return;
    angefordert = true;
    bild = requestAnimationFrame(aufdecken);
    uhr = setTimeout(aufdecken, 120);
  }
  window.addEventListener('scroll', anfordern, { passive: true });
  window.addEventListener('resize', anfordern);
  /* Einmal sofort: was beim Laden schon im Fenster steht, wartet nicht
     auf die erste Meldung des Beobachters. Und einmal nach dem Laden, weil
     die Bilder mit loading="lazy" die Hoehen noch verschieben koennen. */
  anfordern();
  window.addEventListener('load', anfordern);
})();
