/* ---------------------------------------------------------------------------
   ESTERA — Google-Rezensionen

   Drei Aufgaben:
   1. Die Reihe endlos laufen lassen. Dafür wird die Spur einmal geklont; die
      Kopie hängt direkt hinter dem Original. Die Bewegung läuft von
      translateX(-50%) nach 0 — die Karten wandern also nach RECHTS und die
      Kopie schiebt von links nach. Der Weg entspricht exakt einer Spurbreite,
      am Umschlagpunkt sieht das Bild deshalb identisch aus: kein Sprung.
   2. Den Knopf „Mehr" nur dort einblenden, wo der Text tatsächlich
      abgeschnitten ist. Das lässt sich erst nach dem Laden der Schriften
      messen, vorher stimmen die Zeilenhöhen nicht.
   3. Beim Aufklappen die Bewegung anhalten, damit man in Ruhe lesen kann,
      und beim Zuklappen wieder starten.

   Ohne Javascript bleibt die Reihe stehen und ist seitlich scrollbar; kein
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

  /* --- 1. Zweite Spur für den nahtlosen Umlauf --------------------------- */
  /* Die Kopie ist reine Optik: sie trägt dieselben Texte, würde also von
     Screenreadern doppelt vorgelesen und wäre doppelt antippbar. Deshalb
     aria-hidden und alle Bedienelemente aus der Tabulatorfolge nehmen. */
  var klon = spur.cloneNode(true);
  klon.removeAttribute('data-rez-spur');
  klon.setAttribute('aria-hidden', 'true');
  klon.setAttribute('data-rez-klon', '');
  Array.prototype.forEach.call(klon.querySelectorAll('button, a'), function (el) {
    el.setAttribute('tabindex', '-1');
  });
  lauf.appendChild(klon);

  /* Original und Kopie in gleicher Reihenfolge — darüber findet ein Knopf
     seine Zwillingskarte in der jeweils anderen Spur. Ohne das würde eine
     aufgeklappte Karte beim Umlauf plötzlich wieder zugeklappt vorbeiziehen. */
  var karten = {
    orig: spur.querySelectorAll('.rez__karte'),
    klon: klon.querySelectorAll('.rez__karte')
  };
  var zwilling = function (karte) {
    var i = Array.prototype.indexOf.call(karten.orig, karte);
    if (i > -1) return karten.klon[i];
    i = Array.prototype.indexOf.call(karten.klon, karte);
    return i > -1 ? karten.orig[i] : null;
  };

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
  setzeDauer();
  if ('ResizeObserver' in window) new ResizeObserver(setzeDauer).observe(spur);
  else window.addEventListener('resize', setzeDauer);

  var laufSchalten = function () {
    if (ruhig.matches) band.removeAttribute('data-laeuft');
    else band.setAttribute('data-laeuft', 'true');
  };
  laufSchalten();
  if (ruhig.addEventListener) ruhig.addEventListener('change', laufSchalten);

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

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pruefeUeberlauf);
  else window.addEventListener('load', pruefeUeberlauf);
  window.addEventListener('load', pruefeUeberlauf);
  window.addEventListener('resize', pruefeUeberlauf);

  /* --- 3. Aufklappen hält die Reihe an ----------------------------------- */
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
    knopf.textContent = auf ? 'Weniger' : 'Mehr';
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
