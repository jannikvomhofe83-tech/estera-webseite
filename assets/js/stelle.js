/* ===========================================================================
   ESTERA — STELLENSEITEN
   Gilt fuer karriere-immobilienberater.html und karriere-backoffice.html.
   Neu gebaut am 30.08.2026 zusammen mit dem Abschnitt „Bewegung" von
   stelle.css.

   Diese Datei macht fuenf Dinge. Die eigentliche Bewegung steckt
   vollstaendig in stelle.css — hier wird nur vorbereitet und geschaltet. Es
   laeuft keine einzige Bildfolge ueber Javascript, es haengt nichts am
   Bildlauf, und es gibt kein requestAnimationFrame.

   1  DAS KOPFVIDEO BEI RUHIGER DARSTELLUNG ANHALTEN
      Sichtbar ist es dort schon durch stelle.css nicht mehr (display: none,
      darunter steht das Standbild). Ohne Javascript bleibt es genau dabei.
      Hier wird die Wiedergabe zusaetzlich wirklich gestoppt, damit im
      Ruhemodus nichts im Hintergrund weiterlaeuft. Als einziger Punkt
      laeuft dieser AUCH bei „reduce" — er ist ja gerade dafuer da.

   2  DIE UEBERSCHRIFTEN IN ZEILEN TEILEN
      Die Leitgeste beider Seiten schiebt jede Ueberschrift zeilenweise
      hinter einer Kante hervor (Werte der Vorlage fluid.glass, siehe
      stelle.css). Dafuer braucht jede Zeile eine eigene Verzoegerung — und
      Zeilen gibt es im DOM nicht, es gibt nur Text. Also bekommt jedes WORT
      eine Huelle, und die Huellen werden anschliessend nach ihrer
      gemessenen Hoehenlage zu Zeilen gruppiert. Deshalb stimmt der Versatz
      auch dann, wenn „Pruefe, ob Estera zu deinem Weg passt" bei 390 px auf
      vier Zeilen umbricht und bei 1920 px auf zwei.

   3  DIE ECHTEN PFADLAENGEN DER STRICHZEICHNUNGEN SETZEN
      Die Haeuser in „Was wir bieten" zeichnen sich ueber
      stroke-dashoffset. Dafuer muss die Laenge jedes Pfades bekannt sein,
      und die wird hier mit getTotalLength() VOM PFAD SELBST abgelesen und
      als --len geschrieben — nicht geschaetzt. Dasselbe Verfahren benutzt
      site.js fuer die Grafiken der Startseite.
      SEIT DEM 31.08.2026 NUR NOCH DIE HAEUSER: die Symbolfelder der
      Schrittkarten (.stl-karte__zeichen) sind mit den Karten entfallen.

   4  DIE ZIFFERN DER SCHRITTLISTE IN EINE HUELLE SETZEN
      Damit sie hinter derselben Kante hervorfahren koennen wie die
      Ueberschriften. Auf der Back-Office-Seite gibt es diese Ziffern nicht
      (deren vier Punkte sind keine Reihenfolge, siehe stelle.css); die
      Schleife laeuft dort ins Leere.

   5  DIE KLASSE `ist-da` BEIM EINTRITT SETZEN
      Ein IntersectionObserver, einmalig; danach wird das Element nicht mehr
      beobachtet. Beobachtet werden teils GRUPPEN (die Hakenliste, das
      versetzte Raster, der Kartenstapel, die Laufbaender) und teils einzelne
      Bausteine — bei den Gruppen deshalb, weil ihr Versatz gegen den
      Eintritt der GRUPPE laufen muss und nicht gegen den jedes einzelnen
      Teils.

   WAS DIESE DATEI NICHT MACHT — AUSDRUECKLICH
   An „Das erwartet dich" haengt seit dem 31.08.2026 gar nichts mehr am
   Rollweg. Dort stand bis dahin ein Kartenstapel aus `position: sticky`;
   er ist raus, und mit ihm die Karten selbst. Geblieben ist eine
   Schrittliste, die beim Eintritt einmal aufsteigt — mehr nicht.
   Kein Rollhorcher, kein requestAnimationFrame, keine Messung, keine
   Neurechnung bei Groessenaenderung.
   Das einzige verbliebene `sticky` der Seite ist das Bildfeld rechts
   (.stl-bilder); auch dort ist [data-stl-js] nur der Schalter, der dafuer
   sorgt, dass ohne Javascript nichts klebt.

   OHNE JAVASCRIPT
   stehen beide Seiten vollstaendig da. Saemtliche Bewegungsregeln in
   stelle.css haengen an [data-stl-js], und dieses Merkmal setzt erst diese
   Datei — faellt sie aus, ist nie etwas unsichtbar. Auch geteilt wird dann
   nicht, es werden keine Merkmale gesetzt, die Schrittliste steht
   vollstaendig da, und die zwei Laufbaender laufen wie bisher vom ersten
   Bildpunkt an. Das Kopfvideo traegt autoplay, muted,
   loop und playsinline im HTML und spielt von selbst ab.

   BEI prefers-reduced-motion: reduce
   wird das Video angehalten und danach in der naechsten Zeile ausgestiegen:
   [data-stl-js] wird gar nicht erst gesetzt, es wird nichts geteilt, nichts
   beobachtet. Alles steht sofort im Endzustand. Zusaetzlich nimmt der
   Abschnitt „Ruhige Darstellung" in stelle.css jeden Anfangszustand
   ausdruecklich zurueck — fuer den Fall, dass jemand die Einstellung erst
   NACH dem Laden umstellt.
   =========================================================================== */
(function () {
  'use strict';

  var abfrage = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------------
     1  Das Kopfvideo
     --------------------------------------------------------------------- */
  var video = document.querySelector('.stl-hero__video');
  if (video && abfrage) {
    var anwenden = function () {
      if (abfrage.matches) {
        try { video.pause(); } catch (e) {}
        video.removeAttribute('autoplay');
      } else if (video.paused) {
        /* Kehrt der Besucher die Einstellung um, laeuft es wieder an.
           play() gibt in manchen Browsern ein Promise zurueck, das
           abgelehnt werden kann — das ist hier ohne Folgen. */
        var p = video.play();
        if (p && typeof p.catch === 'function') { p.catch(function () {}); }
      }
    };
    anwenden();
    if (typeof abfrage.addEventListener === 'function') {
      abfrage.addEventListener('change', anwenden);
    } else if (typeof abfrage.addListener === 'function') {
      abfrage.addListener(anwenden);
    }
  }

  /* Bei ruhiger Darstellung hier aussteigen. Ebenso, wenn der Browser
     keinen IntersectionObserver kennt — dann bleibt alles sichtbar stehen,
     statt auf ein Ereignis zu warten, das nie kommt. */
  if ((abfrage && abfrage.matches) || !('IntersectionObserver' in window)) return;

  var wurzel = document.querySelector('.stl') || document.body;
  if (!wurzel) return;

  /* Erst JETZT wird das Merkmal gesetzt, das die Anfangszustaende in
     stelle.css scharf schaltet. Das Skript steht am Ende des <body>, der
     Baum ist also vollstaendig; gesetzt wird vor dem ersten Anstrich, damit
     nichts erst sichtbar wird und dann verschwindet. */
  wurzel.setAttribute('data-stl-js', 'an');

  function alle(sel, in_) {
    return Array.prototype.slice.call((in_ || wurzel).querySelectorAll(sel));
  }

  /* ---------------------------------------------------------------------
     2  Die Ueberschriften in Zeilen teilen

     ZWEI SCHRITTE, und die Trennung ist Absicht:
       teilen()  zerlegt einmalig in Woerter — veraendert den Baum
       zeilen()  misst die Hoehenlage und vergibt --z — veraendert nur Werte
     Nur der zweite Schritt wird wiederholt, wenn sich der Umbruch aendert
     (Schriftnachladung, Fensterbreite).
     --------------------------------------------------------------------- */

  /* Zerlegt alle Textknoten unterhalb von el in Woerter und legt um jedes
     Wort zwei Spannen: aussen die Kante (.stl-zg), innen das Wort selbst
     (.stl-zg__i), das dahinter hervorfaehrt.

     DIE VORHANDENE AUSZEICHNUNG BLEIBT ERHALTEN. Zerlegt werden die
     TEXTKNOTEN, nicht das Element — jede Auszeichnung darin ueberlebt also.
     Deshalb sitzt die Kante am WORT und nicht an der Zeile: eine
     Zeilenhuelle muesste Woerter aus ihrer Auszeichnung herausnehmen. Am
     Bild aendert das nichts — alle Woerter einer Zeile stehen im selben
     Zeilenkasten, ihre Kanten liegen also auf einer Geraden und der Versatz
     ist fuer alle derselbe.

     GETRENNT WIRD NUR AN ECHTEN LEERZEICHEN, Tabulatoren und Umbruechen —
     AUSDRUECKLICH NICHT am geschuetzten Leerzeichen. Ein \s in der Regel
     wuerde auch dort trennen, und aus dem geschuetzten Leerzeichen wuerde
     eine Trennstelle: „Immobilienberater (m/w/d)" duerfte dann umbrechen,
     obwohl im Markup ausdruecklich &nbsp; steht. */
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
          frag.appendChild(document.createTextNode(' '));
          continue;
        }
        var aussen = document.createElement('span');
        aussen.className = 'stl-zg';
        var innen = document.createElement('span');
        innen.className = 'stl-zg__i';
        innen.appendChild(document.createTextNode(s));
        aussen.appendChild(innen);
        frag.appendChild(aussen);
        huellen.push(aussen);
      }
      t.parentNode.replaceChild(frag, t);
    }
    if (!huellen.length) return null;
    el.classList.add('stl-geteilt');
    return huellen;
  }

  /* Gruppiert die Huellen nach ihrer Hoehenlage zu Zeilen und schreibt die
     Zeilennummer als --z. Die Toleranz von 4 px faengt Rundung ab; echte
     Zeilen liegen bei diesen Schriftgroessen immer weit darueber. */
  function zeilen(huellen) {
    var vorige = null, z = -1;
    for (var i = 0; i < huellen.length; i++) {
      var o = huellen[i].offsetTop;
      if (vorige === null || o - vorige > 4) { z++; vorige = o; }
      huellen[i].style.setProperty('--z', z);
    }
  }

  var geteilt = [];
  /* .stl-h2--unterstrichen ist ausgenommen: deren Unterstrich ueberlebt die
     Teilung nicht sauber. Die Begruendung steht ausfuehrlich in stelle.css
     bei den Anfangszustaenden. Sie kommt stattdessen als Ganzes auf und ist
     ueber .stl-h2 ohnehin schon in der Liste der einzelnen Bausteine. */
  var titel = alle('.stl-hero__h1, .stl-h2:not(.stl-h2--unterstrichen), .stl-h2-gross');
  for (var i = 0; i < titel.length; i++) {
    var h = teilen(titel[i]);
    if (h) geteilt.push({ el: titel[i], huellen: h });
  }
  for (i = 0; i < geteilt.length; i++) zeilen(geteilt[i].huellen);

  /* Der Umbruch kann sich noch zweimal aendern, nachdem oben gemessen wurde:
     wenn die Webschrift nachlaedt (bis dahin steht die Ersatzschrift, die
     anders bricht) und wenn jemand das Fenster zieht. Neu gemessen wird nur
     bei Ueberschriften, die noch nicht gelaufen sind — bei den uebrigen
     waere es folgenlos, denn ihr Endzustand haengt nicht am Versatz. */
  function neuMessen() {
    for (var k = 0; k < geteilt.length; k++) {
      if (!geteilt[k].el.classList.contains('ist-da')) zeilen(geteilt[k].huellen);
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
     3  Die echten Pfadlaengen der Strichzeichnungen

     --len ist die abgelesene Laenge, --dz die Nummer des Striches innerhalb
     seines Symbols. Ueber --dz laufen die drei Striche eines Hauses
     nacheinander: erst das Dach, dann die Waende, dann die Tuer.
     Aufgerundet, damit am Ende garantiert kein Rest stehen bleibt.
     --------------------------------------------------------------------- */
  var zeichen = alle('.stl-haken__zeichen svg');
  for (i = 0; i < zeichen.length; i++) {
    var pfade = zeichen[i].querySelectorAll('path, line, polyline, circle, rect');
    var gesetzt = 0;
    for (var j = 0; j < pfade.length; j++) {
      var len = 0;
      try { len = pfade[j].getTotalLength(); } catch (e) { len = 0; }
      if (!len || !isFinite(len)) continue;   /* nicht messbar: unberuehrt lassen */
      pfade[j].style.setProperty('--len', Math.ceil(len));
      pfade[j].style.setProperty('--dz', gesetzt);
      gesetzt++;
    }
    /* Nur Symbole, bei denen JEDER Strich messbar war, bekommen die Klasse.
       Ein halb gezeichnetes Symbol waere schlimmer als ein stehendes. */
    if (gesetzt && gesetzt === pfade.length) zeichen[i].classList.add('stl-zeichnet');
  }

  /* ---------------------------------------------------------------------
     4  Die Ziffern der Schrittfolge in eine Huelle setzen
     --------------------------------------------------------------------- */
  var ziffern = alle('.stl-stufe__nr');
  for (i = 0; i < ziffern.length; i++) {
    var huelle = document.createElement('span');
    huelle.className = 'stl-zi';
    while (ziffern[i].firstChild) huelle.appendChild(ziffern[i].firstChild);
    ziffern[i].appendChild(huelle);
  }

  /* ---------------------------------------------------------------------
     Der Versatz innerhalb der drei Gruppen
     --------------------------------------------------------------------- */
  function versatz(gruppe, kindsel) {
    var g = wurzel.querySelector(gruppe);
    if (!g) return;
    var kinder = g.querySelectorAll(kindsel);
    for (var k = 0; k < kinder.length; k++) kinder[k].style.setProperty('--i', k);
  }
  versatz('.stl-haken',  ':scope > li');
  versatz('.stl-aus',    ':scope > .stl-aus__kasten');
  /* Bei der Schrittliste sitzt --i auf dem <li>: Ziffer, Titel und Satz
     liegen darin und erben ihn von dort. */
  versatz('.stl-folge',  ':scope > .stl-stufe');

  /* ---------------------------------------------------------------------
     5  Der Auslöser
     --------------------------------------------------------------------- */
  var einzeln = [
    '.stl-hero__vor', '.stl-hero__unter', '.stl-hero__btn',
    '.stl-kleinzeile', '.stl-macht__lead',
    '.stl-schluss__text', '.stl-schluss__aktionen', '.stl-schluss__hinweis',
    '.stl-hero__h1', '.stl-h2', '.stl-h2-gross',
    '.stl-trenn', '.stl-bilder', '.stl-schluss__medium'
  ].join(', ');

  var ziele = alle(einzeln);
  for (i = 0; i < ziele.length; i++) ziele[i].setAttribute('data-stl-auf', '');

  /* Die Gruppen: ihr Versatz muss gegen den Eintritt der GRUPPE laufen.
     .stl-zwei--bieten ist dabei kein Versatz, sondern ein Ersatz-Ausloeser:
     es traegt das leere Bildfenster, das sich wegen seines eigenen
     clip-path nicht selbst beobachten lassen kann (Begruendung bei
     .stl-platz in stelle.css). */
  Array.prototype.push.apply(ziele, alle('.stl-haken, .stl-aus, .stl-folge, .stl-band, .stl-zwei--bieten'));

  /* Ein Zehntel des Elements reicht als Ausloeser. Ein rootMargin von
     −40 px am Fuss verhindert, dass etwas losläuft, das gerade erst mit
     einem Bildpunkt in den Ausschnitt ragt. Die zwei Laufbaender sind mit
     355 bzw. 277 px flach und liegen quer ueber die volle Breite; ein
     Zehntel ihrer Flaeche ist erreicht, sobald ein schmaler Streifen im
     Bild steht. */
  var beobachter = new IntersectionObserver(function (eintraege, selbst) {
    for (var k = 0; k < eintraege.length; k++) {
      if (!eintraege[k].isIntersecting) continue;
      eintraege[k].target.classList.add('ist-da');
      selbst.unobserve(eintraege[k].target);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  for (i = 0; i < ziele.length; i++) beobachter.observe(ziele[i]);
})();
