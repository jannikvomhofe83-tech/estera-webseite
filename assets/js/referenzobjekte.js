/* ===========================================================================
   REFERENZOBJEKTE — „Eindruck einer Musterwohnung"

   STAND 21.08.2026. Der Abschnitt besteht aus zwei Dingen: einer Ueberschrift
   und darunter dem Video. Diese Datei regelt davon nur noch das Video —
   wie gross es steht und wann es laeuft.

   Was in dieser Datei sonst noch steht, ist STILLGELEGT und mit Vermerk
   versehen: der Umschalter zwischen den Objektarten, der Weg vom Vorschaubild
   zum nachgeladenen Video und die Ueberlappung der Infokarte. Alle drei
   gehoeren zu Bausteinen, die der Kunde am 21.08. hat herausnehmen lassen.
   Geloescht ist nichts — es kommt zurueck, sobald Estera echte Objektdaten
   und je Objektart ein eigenes Video liefert.
   =========================================================================== */


/* ===========================================================================
   SCHLAEFT — Umschalter zwischen den beiden Objektarten

   21.08. auf Kundenwunsch entfernt — kommt zurueck, sobald Estera je
   Objektart ein eigenes Video liefert. Woertlich: „Das ‚WG-, Konzept- und
   Bestandswohnungen' kann raus. Das ist unnötig."

   Er hatte seine Berechtigung ohnehin schon verloren: es liegt nur EINE
   Aufnahme vor, beide Schaltflaechen haetten dasselbe Video gezeigt. Ein
   Schalter, der nichts umschaltet, ist eine Zumutung — mit der Tastatur waere
   man zwischen zwei nicht unterscheidbaren Zustaenden hin und her gewandert.

   Der Code setzte nur data-art am Abschnitt; das Ein- und Ausblenden der
   Fassungen und die Bewegung des Schiebers loeste referenzobjekte.css daraus
   ab. Die Regeln dort stehen unter „SCHLAEFT — Umschalter", das Markup im
   HTML auskommentiert. Zurueckholen heisst: an allen drei Stellen die
   Kommentarzeichen weg.

// (function () {
//   'use strict';
//
//   var bloecke = document.querySelectorAll('[data-robj]');
//
//   Array.prototype.forEach.call(bloecke, function (block) {
//     var knoepfe = block.querySelectorAll('[data-art-knopf]');
//     if (!knoepfe.length) return;
//     var schieber = block.querySelector('.robj__schieber');
//
//     // Der Schieber legt sich genau auf die gewaehlte Schaltflaeche. Auf
//     // breiten Fenstern sind beide gleich breit, auf schmalen richtet sich
//     // die Breite nach der laengeren Beschriftung — deshalb wird gemessen
//     // statt mit 50 % gerechnet.
//     function schieberLegen(knopf, sofort) {
//       if (!schieber || !knopf.offsetWidth) return;
//       var alt = schieber.style.transition;
//       if (sofort) schieber.style.transition = 'none';
//       schieber.style.width = knopf.offsetWidth + 'px';
//       schieber.style.transform = 'translateX(' + (knopf.offsetLeft - schieber.offsetLeft) + 'px)';
//       if (sofort) {
//         void schieber.offsetWidth;          // Zwischenstand erzwingen
//         schieber.style.transition = alt;
//       }
//     }
//
//     function aktiver() {
//       for (var i = 0; i < knoepfe.length; i++) {
//         if (knoepfe[i].getAttribute('aria-pressed') === 'true') return knoepfe[i];
//       }
//       return knoepfe[0];
//     }
//
//     function setzen(knopf) {
//       block.setAttribute('data-art', knopf.getAttribute('data-art-knopf'));
//       Array.prototype.forEach.call(knoepfe, function (k) {
//         k.setAttribute('aria-pressed', String(k === knopf));
//       });
//       schieberLegen(knopf, false);
//       // Die verlassene Objektart soll nicht unsichtbar weiterlaufen.
//       Array.prototype.forEach.call(block.querySelectorAll('.robj__film'), function (film) {
//         if (!film.paused) film.pause();
//       });
//     }
//
//     schieberLegen(aktiver(), true);
//     if ('ResizeObserver' in window) {
//       new ResizeObserver(function () { schieberLegen(aktiver(), true); })
//         .observe(schieber.parentElement);
//     } else {
//       window.addEventListener('resize', function () { schieberLegen(aktiver(), true); });
//     }
//     // Nach dem Laden der Schrift verschieben sich die Breiten noch einmal.
//     if (document.fonts && document.fonts.ready) {
//       document.fonts.ready.then(function () { schieberLegen(aktiver(), true); });
//     }
//
//     Array.prototype.forEach.call(knoepfe, function (knopf, i) {
//       knopf.addEventListener('click', function () { setzen(knopf); });
//
//       // Pfeiltasten wandern innerhalb der Pille — wie bei einer Gruppe
//       // zusammengehoeriger Schaltflaechen ueblich.
//       knopf.addEventListener('keydown', function (e) {
//         var richtung = 0;
//         if (e.key === 'ArrowRight' || e.key === 'ArrowDown') richtung = 1;
//         if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') richtung = -1;
//         if (!richtung) return;
//         e.preventDefault();
//         var ziel = knoepfe[(i + richtung + knoepfe.length) % knoepfe.length];
//         ziel.focus();
//         setzen(ziel);
//       });
//     });
//   });
// })();
   =========================================================================== */


/* ===========================================================================
   SCHLAEFT — der Bildplatz: Vorschaubild -> Video

   21.08. auf Kundenwunsch entfernt, kommt zurueck, sobald Estera echte
   Objektdaten liefert.

   Was hier stand: der Klick auf den Abspielknopf las data-film="" am
   <div class="robj__video">, haengte daraus ein <video> in den Rahmen und
   startete es. War der Wert leer, erschien stattdessen die ruhige
   Zwischenansicht .robj__ersatz („Das Video wird gerade fertiggestellt").

   Warum es weg ist: Das Video LIEGT VOR. Es steht fest im HTML statt
   nachtraeglich eingehaengt zu werden, laeuft stumm und braucht keinen Klick
   mehr. Damit ist der ganze Nachlade-Weg gegenstandslos — und er wuerde
   stoeren: er haengte sich an denselben .robj__play, der jetzt eine andere
   Aufgabe hat. Zwei Handler auf einem Knopf, der zweite haengt ein zweites
   Video ein — das gaebe genau den Fehler, den niemand sucht.

   Er wird wieder gebraucht, wenn eine Objektart einmal OHNE eigene Aufnahme
   dasteht; die CSS-Regeln liegen unter „SCHLAEFT — Zwischenansicht" bereit.

// (function () {
//   'use strict';
//
//   var schirme = document.querySelectorAll('.robj__video');
//
//   Array.prototype.forEach.call(schirme, function (schirm) {
//     var knopf = schirm.querySelector('.robj__play');
//     if (!knopf) return;
//
//     var bild    = schirm.querySelector('.robj__bild');
//     var ersatz  = schirm.querySelector('.robj__ersatz');
//     var zurueck = ersatz ? ersatz.querySelector('.robj__zurueck') : null;
//
//     function zurVorschau() {
//       if (ersatz) ersatz.hidden = true;
//       schirm.setAttribute('data-zustand', 'vorschau');
//       knopf.hidden = false;
//       knopf.focus();
//     }
//
//     function starten() {
//       if (schirm.getAttribute('data-zustand') !== 'vorschau') return;
//       var quelle = (schirm.getAttribute('data-film') || '').trim();
//
//       if (quelle) {
//         var film = document.createElement('video');
//         film.className = 'robj__film';
//         film.setAttribute('controls', '');
//         film.setAttribute('playsinline', '');
//         film.setAttribute('preload', 'auto');
//         if (bild) film.setAttribute('poster', bild.getAttribute('src'));
//         film.src = quelle;
//         schirm.insertBefore(film, knopf);
//         schirm.setAttribute('data-zustand', 'film');
//         knopf.hidden = true;
//         var lauf = film.play();
//         if (lauf && typeof lauf.catch === 'function') { lauf.catch(function () {}); }
//         film.focus();
//         return;
//       }
//
//       schirm.setAttribute('data-zustand', 'folgt');
//       knopf.hidden = true;
//       if (ersatz) {
//         ersatz.hidden = false;
//         if (zurueck) zurueck.focus();
//       }
//     }
//
//     knopf.addEventListener('click', starten);
//     if (zurueck) zurueck.addEventListener('click', zurVorschau);
//   });
// })();
   =========================================================================== */


/* ===========================================================================
   DAS VIDEO — wie gross es steht und wann es laeuft

   Zwei Kundenwuensche vom 21.08.:

   „Man scrollt runter und mit dem Scrollen wird der Kasten ein bisschen
    größer."
   „Man braucht bei dem Video zur Musterwohnung immer einen Abspielbutton. Man
    muss zuerst auf den Abspielbutton drücken, erst dann beginnt das Video."


   1  DAS WACHSEN
   Der Kasten steht bei 0,90 und erreicht 1,00, wenn er vollstaendig im Bild
   ist. NUR VERKLEINERN, NIE DARUEBER: der Platz im Layout ist immer die
   Endgroesse, die Bewegung findet ausschliesslich darunter statt. Wuechse er
   ueber seine Layoutgroesse hinaus, ragte er seitlich aus dem Raster und
   erzeugte eine waagerechte Rollflaeche.

   Es ist scrollGEKOPPELT, nicht einmalig: scrollt man zurueck, wird der
   Kasten wieder kleiner. Es bleibt kein „gelaufener" Zustand haengen, weil
   nichts gemerkt wird — der Wert kommt bei jedem Bild frisch aus der Lage
   des Kastens.

   Geschrieben wird ausschliesslich --robj-wachs; referenzobjekte.css macht
   daraus ein transform: scale(). Kein width, kein height, kein margin — die
   wuerden bei jedem Bild das Layout neu rechnen lassen und die ganze Seite
   unter dem Abschnitt mitrucken. Gedrosselt ueber requestAnimationFrame, der
   Scroll-Handler ist passive — es wird nie preventDefault gerufen, nichts
   eingerastet, nichts entfuehrt.

   Der Nenner in anteil() ist bewusst min(Kastenhoehe, Fensterhoehe): ist der
   Kasten hoeher als das Fenster, kann er nie ganz drinstehen, und der Wert
   erreichte nie 1 — der Kasten waere auf flachen Laptops und auf dem Telefon
   im Querformat nie ausgewachsen. Mit der Deckelung ist er es, sobald er das
   Fenster senkrecht ausfuellt.


   2  DER START — GAR NICHT VON ALLEIN
   Es gibt kein autoplay und keine Sichtbarkeitsschwelle, ab der etwas
   losliefe. Beim Laden steht das Poster, darueber der Knopf; erst ein Druck
   startet das Video. Danach verschwindet der Knopf und das Video bekommt die
   Bedienleiste des Browsers, damit man anhalten und spulen kann.

   ZWISCHENZEITLICH GALT ETWAS ANDERES. Bis zu diesem Umbau startete das Video
   von selbst, sobald der Kasten vollstaendig im Fenster stand. Das ist
   zurueckgenommen. Vom damaligen Aufbau ist nur der Beobachter uebrig, und
   der darf jetzt ausschliesslich ANHALTEN: verlaesst der Kasten das Bild,
   wird pausiert — ein Video, das unbemerkt im Hintergrund weiterdekodiert,
   kostet auf einem Notebook spuerbar Akku und auf schwachen Geraeten
   Bildrate, fuer nichts.

   VON SELBST WIEDER ANLAUFEN TUT ES NICHT. Kommt der Kasten zurueck ins Bild,
   bleibt das Video stehen, bis der Besuch es weiterlaufen laesst — ueber die
   Bedienleiste, die ab dem ersten Druck da ist. Zurueckgesetzt wird nie,
   currentTime wird nirgends angefasst: es steht an der Stelle, an der es
   angehalten wurde.


   3  WENIGER BEWEGUNG
   Wer im Betriebssystem „weniger Bewegung" angefordert hat, bekommt kein
   Wachsen. Am Video selbst aendert sich fuer diese Gruppe nichts mehr — es
   startet ohnehin bei niemandem von allein.


   4  OHNE JAVASCRIPT
   Dann laeuft nichts hiervon. Der Kasten steht in voller Groesse
   (--robj-wachs ist im CSS mit 1 vorbelegt), das Poster ist sichtbar, und das
   <video> traegt im Markup ein controls-Attribut — der Besuch bekommt also
   die Bedienleiste des Browsers und kann selbst abspielen. Der Knopf bleibt
   dann verborgen, statt wirkungslos herumzustehen. Sobald dieses Script
   laeuft, dreht es beides um: controls weg, Knopf her. Es gibt keinen leeren
   und keinen halb skalierten Zustand.
   =========================================================================== */
(function () {
  'use strict';

  var schirme = document.querySelectorAll('.robj__video');
  if (!schirme.length) return;

  var ruhig   = window.matchMedia('(prefers-reduced-motion: reduce)');
  var stuecke = [];

  var KLEIN = 0.90;   /* Startgroesse des Kastens                    */
  var GROSS = 1.00;   /* Endgroesse — hier ist Schluss, nie darueber */

  /* Weiche Kurve, rechnerisch: das Gegenstueck zu cubic-bezier(0.22, 1,
     0.36, 1). Sie zieht am Anfang zuegig an und laeuft zum Schluss sanft aus,
     sodass die letzten Prozent nicht als Ruck ankommen. Als Uebergangszeit im
     CSS waere dieselbe Kurve falsch: der Wert wird bei jedem Scrollbild neu
     gesetzt, eine Uebergangszeit liefe der Scrollbewegung hinterher und
     fuehlte sich gummiartig an. Also hier, im Rechenweg. */
  function glatt(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  /* Wie viel vom Kasten steht im Fenster? 0 = nichts, 1 = so viel wie
     ueberhaupt moeglich. Zur Deckelung im Nenner siehe Kopf, Abschnitt 1. */
  function anteil(r, fh) {
    if (!r.height || !fh) return 0;
    var sichtbar = Math.max(0, Math.min(r.bottom, fh) - Math.max(r.top, 0));
    var a = sichtbar / Math.min(r.height, fh);
    return a < 0 ? 0 : (a > 1 ? 1 : a);
  }

  /* Ist er ueberhaupt noch angeschnitten? Das ist die Bedingung zum
     Anhalten — und die einzige Bedingung, die das Script von sich aus an der
     Wiedergabe aendert. */
  function angeschnitten(r, fh) {
    return r.bottom > 0 && r.top < fh;
  }

  /* Einmal je Scrollbild: Lage messen, daraus Groesse und gegebenenfalls das
     Anhalten. */
  function rechnen() {
    var fh = window.innerHeight || document.documentElement.clientHeight || 0;
    var still = ruhig.matches;

    for (var i = 0; i < stuecke.length; i++) {
      var st = stuecke[i];
      var r  = st.schirm.getBoundingClientRect();

      /* --- Groesse ------------------------------------------------------ */
      if (still) {
        /* Kein Wachsen. Eine frueher geschriebene Angabe wieder abraeumen,
           falls jemand die Einstellung waehrend des Besuchs umgestellt hat —
           sonst bliebe der Kasten auf dem zuletzt gesetzten Wert stehen. */
        if (st.mass !== 1) {
          st.mass = 1;
          st.schirm.style.removeProperty('--robj-wachs');
        }
      } else {
        var mass = KLEIN + (GROSS - KLEIN) * glatt(anteil(r, fh));
        if (mass > GROSS) mass = GROSS;        /* niemals darueber hinaus */
        /* Nur schreiben, wenn sich etwas Sichtbares aendert — das spart bei
           jedem Scrollbild eine Stilberechnung. */
        if (Math.abs(mass - st.mass) > 0.0005) {
          st.mass = mass;
          st.schirm.style.setProperty('--robj-wachs', mass.toFixed(4));
        }
      }

      /* --- Anhalten ----------------------------------------------------- */
      /* Gestartet wird hier NICHTS. Nur wer laeuft und aus dem Bild
         verschwindet, wird angehalten. */
      if (!angeschnitten(r, fh) && !st.film.paused) {
        st.film.pause();
      }
    }
  }

  /* Gedrosselt auf ein Bild: der Scroll-Handler merkt sich nur, dass etwas zu
     tun ist, gerechnet wird im naechsten Bild. Ohne diese Drosselung liefe
     rechnen() bei jedem einzelnen Scrollereignis — auf einem Trackpad sind
     das leicht mehrere hundert je Sekunde. */
  var angefordert = false;
  function anstossen() {
    if (angefordert) return;
    angefordert = true;
    window.requestAnimationFrame(function () {
      angefordert = false;
      rechnen();
    });
  }

  Array.prototype.forEach.call(schirme, function (schirm) {
    var film  = schirm.querySelector('.robj__film');
    var knopf = schirm.querySelector('.robj__play');
    if (!film) return;

    /* Die Bedienleiste des Browsers stand nur fuer den Fall im Markup, dass
       dieses Script nicht laeuft. Es laeuft — also weg damit und stattdessen
       den Knopf zeigen. Ab dem ersten Druck kommt sie zurueck. */
    film.removeAttribute('controls');
    if (knopf) knopf.hidden = false;

    var st = { schirm: schirm, film: film, mass: 1 };
    stuecke.push(st);

    if (knopf) {
      knopf.addEventListener('click', function () {
        var lauf = film.play();
        /* Erst verschwinden lassen, wenn die Wiedergabe wirklich anlaeuft.
           Weist der Browser sie ab — im Stromsparbetrieb kommt das vor —,
           bleibt der Knopf stehen, statt den Besuch vor einem Standbild ohne
           Bedienung sitzen zu lassen. */
        function uebergeben() {
          knopf.hidden = true;
          film.setAttribute('controls', '');
        }
        if (lauf && typeof lauf.then === 'function') {
          lauf.then(uebergeben, function () {});
        } else {
          uebergeben();
        }
      });
    }
  });

  if (!stuecke.length) return;

  window.addEventListener('scroll', anstossen, { passive: true });
  window.addEventListener('resize', anstossen, { passive: true });

  /* Der Beobachter ist nicht die Entscheidung, sondern der Wecker: er stoesst
     an den Schwellen an, die Lage misst rechnen() danach selbst. Der Grund
     ist die Deckelung oben — bei einem Kasten, der hoeher ist als das
     Fenster, erreicht intersectionRatio nie 1,0, und wer sich darauf
     verliesse, bekaeme dort einen nie ausgewachsenen Kasten. */
  if ('IntersectionObserver' in window) {
    var beobachter = new IntersectionObserver(anstossen, { threshold: [0, 0.99, 1] });
    Array.prototype.forEach.call(stuecke, function (st) { beobachter.observe(st.schirm); });
  }

  /* Nach dem Laden der Schrift bricht die Ueberschrift darueber unter
     Umstaenden anders um — dann steht der Kasten woanders. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(anstossen);
  }

  /* „Weniger Bewegung" kann sich waehrend des Besuchs aendern. addEventListener
     auf einer MediaQueryList kennen aeltere Safari-Fassungen nicht; dort
     addListener. */
  if (typeof ruhig.addEventListener === 'function') {
    ruhig.addEventListener('change', rechnen);
  } else if (typeof ruhig.addListener === 'function') {
    ruhig.addListener(rechnen);
  }

  rechnen();
})();


/* ===========================================================================
   SCHLAEFT — die Ueberlappung der Infokarte

   21.08. auf Kundenwunsch entfernt, kommt zurueck, sobald Estera echte
   Objektdaten liefert. Die Infokarte selbst steht im HTML auskommentiert, die
   Regeln dazu in referenzobjekte.css unter „SCHLAEFT — alles unter dem
   Video".

   Was der Code tat: Kundenwunsch 18.08. war „Unten links vom Video ragt er
   halb ueber das Video und halb unter dem Video raus." Genau die Haelfte der
   eigenen Kartenhoehe — und die haengt daran, wie der Satz in der Karte
   umbricht. Also wurde sie gemessen und als --robj-ueber an die Karte
   geschrieben; das CSS zog die Karte um diesen Wert nach oben. Ein
   Naeherungswert stand als Rueckfall im CSS.

// (function () {
//   'use strict';
//
//   var karten = document.querySelectorAll('.robj__info');
//   if (!karten.length) return;
//
//   function legen(karte) {
//     var hoehe = karte.offsetHeight;
//     if (!hoehe) return;                       // verborgen oder noch ohne Satz
//     var soll = Math.round(hoehe / 2);
//
//     // OBERGRENZE auf schmalen Fenstern: dort ist das Video nur noch gut
//     // 190 px hoch, die Karte aber wegen des Umbruchs fast ebenso hoch. Die
//     // halbe Kartenhoehe wuerde bis in den Abspielknopf reichen und ihn
//     // verdecken. Deshalb hoechstens 28 % der Bildhoehe.
//     var fassung = karte.closest('[data-art-inhalt]');
//     var bild = fassung ? fassung.querySelector('.robj__video') : null;
//     if (bild && bild.offsetHeight) {
//       soll = Math.min(soll, Math.round(bild.offsetHeight * 0.28));
//     }
//
//     if (Math.abs((karte._robjUeber || 0) - soll) < 0.5) return;
//     karte._robjUeber = soll;
//     karte.style.setProperty('--robj-ueber', soll + 'px');
//   }
//
//   function alle() {
//     Array.prototype.forEach.call(karten, legen);
//   }
//
//   alle();
//
//   if ('ResizeObserver' in window) {
//     // Beobachtet werden Karte UND Bild: die Obergrenze haengt an der
//     // Bildhoehe, die sich beim Verkleinern des Fensters mit aendert.
//     var beobachter = new ResizeObserver(function () { alle(); });
//     Array.prototype.forEach.call(karten, function (k) {
//       beobachter.observe(k);
//       var fassung = k.closest('[data-art-inhalt]');
//       var bild = fassung ? fassung.querySelector('.robj__video') : null;
//       if (bild) beobachter.observe(bild);
//     });
//   } else {
//     window.addEventListener('resize', alle);
//   }
//
//   // Nach dem Laden der Schrift bricht der Satz noch einmal anders um.
//   if (document.fonts && document.fonts.ready) {
//     document.fonts.ready.then(alle);
//   }
// })();
   =========================================================================== */
