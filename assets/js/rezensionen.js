/* ---------------------------------------------------------------------------
   ESTERA — Google-Rezensionen

   Vier Aufgaben:

   1. Sich als vorhanden melden. [data-rez-js] an der Reihe schaltet in
      assets/css/referenzen.css die Beschneidung des Textes ein. Ohne
      Javascript wird deshalb NICHTS beschnitten: jede Rezension steht in
      voller Originallänge da, und der Knopf „Mehr" bleibt hidden — es gibt
      also keinen Knopf, der nichts tut.

   2. Den Knopf „Mehr" nur dort einblenden, wo der Text tatsächlich
      abgeschnitten ist. Das wird GEMESSEN, nicht geschätzt: die tatsächliche
      Höhe des Absatzes (scrollHeight) gegen die sichtbare (clientHeight). Eine
      Zeichenzahl als Faustregel ginge schief, weil dieselbe Rezension in einer
      376 px breiten Karte sechs und in einer 300 px breiten acht Zeilen
      braucht. Gemessen wird nach document.fonts.ready — vorher rechnet der
      Browser noch mit der Ersatzschrift und die Umbrüche stimmen nicht —,
      nach load und bei jeder Grössenänderung der Reihe.

   3. Die Reihe endlos laufen lassen. Dafür wird die Spur einmal geklont; die
      Kopie hängt direkt hinter dem Original. Die Bewegung läuft von
      translateX(-50%) nach 0 — die Karten wandern also nach RECHTS und die
      Kopie schiebt von links nach. Der Weg entspricht exakt einer Spurbreite,
      am Umschlagpunkt sieht das Bild deshalb identisch aus: kein Sprung.
      Bei prefers-reduced-motion: reduce entsteht die Kopie gar nicht erst —
      wer nicht laufen lässt, soll die acht Karten einmal sehen und nicht
      sechzehn.

   4. Beim Aufklappen die Bewegung anhalten, damit der Text nicht unter den
      Fingern wegfährt, und beim Zuklappen wieder starten.

   Ohne Javascript steht die Reihe still und ist seitlich scrollbar; kein
   Inhalt geht verloren.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var band = document.querySelector('[data-rez-band]');
  if (!band) return;

  var lauf = band.querySelector('[data-rez-lauf]');
  var spur = band.querySelector('[data-rez-spur]');
  if (!lauf || !spur) return;

  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- 1. Beschneidung freigeben ---------------------------------------- */
  /* Muss VOR der ersten Messung geschehen, sonst misst Schritt 2 einen
     unbeschnittenen Absatz und käme nie zu einem Knopf. */
  band.setAttribute('data-rez-js', 'true');

  /* --- Knöpfe unterscheidbar machen -------------------------------------- */
  /* Acht Knöpfe, die alle „Mehr" heissen, sind beim Durchhören nicht
     auseinanderzuhalten. Der Name der Rezension steht schon in der Karte;
     er wird von dort geholt und unsichtbar an den Knopf gehängt. Beim
     Eintragen der echten Rezensionen ist dafür nichts zu tun. */
  Array.prototype.forEach.call(spur.querySelectorAll('.rez__karte'), function (karte) {
    var knopf = karte.querySelector('[data-rez-mehr]');
    var name  = karte.querySelector('.rez__name');
    if (!knopf || !name || knopf.querySelector('.rez__sr')) return;
    var zusatz = document.createElement('span');
    zusatz.className = 'rez__sr';
    zusatz.textContent = ' — Rezension von ' + name.textContent.trim();
    knopf.appendChild(zusatz);
  });

  /* --- 3a. Zweite Spur für den nahtlosen Umlauf -------------------------- */
  /* Die Kopie ist reine Optik: sie trägt dieselben Texte, würde also von
     Screenreadern doppelt vorgelesen und wäre doppelt antippbar. Deshalb
     aria-hidden, alle Bedienelemente aus der Tabulatorfolge, und alle IDs
     heraus — eine ID darf im Dokument nur einmal vorkommen. */
  var klon = null;
  var kartenKlon = [];
  var kartenOrig = spur.querySelectorAll('.rez__karte');

  var sorgeFuerKlon = function () {
    if (klon) return;
    klon = spur.cloneNode(true);
    klon.removeAttribute('data-rez-spur');
    klon.setAttribute('aria-hidden', 'true');
    klon.setAttribute('data-rez-klon', '');
    Array.prototype.forEach.call(klon.querySelectorAll('button, a'), function (el) {
      el.setAttribute('tabindex', '-1');
    });
    Array.prototype.forEach.call(klon.querySelectorAll('[id]'), function (el) {
      el.removeAttribute('id');
    });
    Array.prototype.forEach.call(klon.querySelectorAll('[aria-controls]'), function (el) {
      el.removeAttribute('aria-controls');   // zeigt sonst ins Leere
    });
    lauf.appendChild(klon);
    kartenKlon = klon.querySelectorAll('.rez__karte');
    pruefeUeberlauf();
  };

  /* Original und Kopie stehen in gleicher Reihenfolge — darüber findet ein
     Knopf seine Zwillingskarte in der jeweils anderen Spur. Ohne das würde
     eine aufgeklappte Karte beim Umlauf plötzlich wieder zugeklappt
     vorbeiziehen. */
  var zwilling = function (karte) {
    if (!klon) return null;
    var i = Array.prototype.indexOf.call(kartenOrig, karte);
    if (i > -1) return kartenKlon[i] || null;
    i = Array.prototype.indexOf.call(kartenKlon, karte);
    return i > -1 ? (kartenOrig[i] || null) : null;
  };

  /* --- 3b. Tempo ---------------------------------------------------------- */
  /* Die Dauer richtet sich nach der tatsächlichen Breite, damit die Karten
     überall gleich schnell wandern — sonst rast die Reihe auf schmalen
     Fenstern und kriecht auf breiten. Rund 42 Pixel je Sekunde. */
  var setzeDauer = function () {
    var breite = spur.getBoundingClientRect().width;
    if (!breite) return;
    var s = Math.max(20, Math.round(breite / 42));
    if (lauf.style.getPropertyValue('--dauer') === s + 's') return;   // kein Neustart ohne Not
    lauf.style.setProperty('--dauer', s + 's');
  };

  var laufSchalten = function () {
    if (ruhig.matches) {
      band.removeAttribute('data-laeuft');
    } else {
      sorgeFuerKlon();
      band.setAttribute('data-laeuft', 'true');
    }
  };

  /* --- 2. „Mehr" nur bei tatsächlich abgeschnittenem Text ---------------- */
  var pruefeUeberlauf = function () {
    Array.prototype.forEach.call(lauf.querySelectorAll('.rez__karte'), function (karte) {
      var text  = karte.querySelector('[data-rez-text]');
      var knopf = karte.querySelector('[data-rez-mehr]');
      if (!text || !knopf) return;
      if (karte.hasAttribute('data-offen')) return;      // offen ist nie beschnitten
      // 2 px Toleranz: Teilpixel bei gebrochenen Zeilenhöhen
      knopf.hidden = text.scrollHeight <= text.clientHeight + 2;
    });
  };

  /* Bei schnellem Ziehen am Fensterrand fällt sonst je Pixel eine volle
     Layoutmessung an. Ein rAF je Bild reicht. */
  var wartet = false;
  var spaeterPruefen = function () {
    if (wartet) return;
    wartet = true;
    window.requestAnimationFrame(function () {
      wartet = false;
      setzeDauer();
      pruefeUeberlauf();
    });
  };

  /* --- Reihenfolge beim Start -------------------------------------------- */
  setzeDauer();
  laufSchalten();
  pruefeUeberlauf();                       /* erste, noch grobe Messung      */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(pruefeUeberlauf);   /* die verbindliche Messung */
  }
  window.addEventListener('load', pruefeUeberlauf);
  window.addEventListener('resize', spaeterPruefen);
  if ('ResizeObserver' in window) new ResizeObserver(spaeterPruefen).observe(spur);
  if (ruhig.addEventListener) ruhig.addEventListener('change', laufSchalten);

  /* --- 4. Aufklappen hält die Reihe an ----------------------------------- */
  var offene = 0;

  /* Setzt eine einzelne Karte auf offen oder zu. Der Knopf der Kopie ist
     aria-hidden, deshalb bekommt nur das Original die Zustandsattribute
     für Screenreader — sichtbar geändert werden beide. */
  var stelle = function (karte, auf) {
    if (!karte) return;
    var knopf = karte.querySelector('[data-rez-mehr]');
    if (auf) karte.setAttribute('data-offen', 'true');
    else     karte.removeAttribute('data-offen');
    if (!knopf) return;
    var wort = knopf.querySelector('[data-rez-mehr-wort]') || knopf;
    wort.textContent = auf ? 'Weniger' : 'Mehr';
    knopf.setAttribute('aria-expanded', String(auf));
  };

  var umschalten = function (knopf) {
    var karte = knopf.closest('.rez__karte');
    if (!karte) return;
    var auf = !karte.hasAttribute('data-offen');

    stelle(karte, auf);
    stelle(zwilling(karte), auf);

    offene = Math.max(0, offene + (auf ? 1 : -1));
    band.toggleAttribute('data-pause', offene > 0);

    /* Nach dem Zuklappen neu messen: die Karte kann inzwischen breiter
       geworden sein (Fenster gezogen, während sie offen stand), dann ist
       nichts mehr abgeschnitten und der Knopf hat sich erledigt. */
    if (!auf) pruefeUeberlauf();
  };

  lauf.addEventListener('click', function (e) {
    var knopf = e.target.closest('[data-rez-mehr]');
    if (knopf) umschalten(knopf);
  });

  /* Wer sich mit der TASTATUR durch die Karten bewegt, soll den Text nicht
     unter dem Finger wegfahren sehen — Fokus hält deshalb ebenfalls an.
     Nur bei :focus-visible, sonst bliebe die Reihe nach einem Mausklick auf
     „Weniger" stehen, obwohl niemand mehr etwas liest. */
  lauf.addEventListener('focusin', function (e) {
    var sichtbar = true;
    try { sichtbar = e.target.matches(':focus-visible'); } catch (err) { /* alte Browser */ }
    if (sichtbar) band.setAttribute('data-fokus', 'true');
  });
  lauf.addEventListener('focusout', function () { band.removeAttribute('data-fokus'); });
})();
