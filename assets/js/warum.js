/* ===========================================================================
   WARUM IMMOBILIEN?  (#warum-immobilien)

   Neu geschrieben am 25.08.2026. Gehoert zu
   <section class="wimm" id="warum-immobilien"> und assets/css/warum.css.

   ZWEI AUFGABEN, SONST NICHTS
     1  Die Bloecke beim Hereinscrollen aufdecken.
     2  Die Bedienung der Navyflaeche: ein Klick auf einen Punkt oder auf
        einen Reiter vergroessert den Punkt, schiebt ihn auf seine Haelfte
        und faehrt von der Gegenseite das Textfenster herein. Ein zweiter
        Klick, „Schliessen" oder Esc fuehren zurueck in die Uebersicht.

   WARUM ES OHNE JAVASCRIPT KEINEN TOTEN KNOPF GIBT
   Die Punkte und die Reiter sind im Dokument LINKS auf die vier Texte,
   die unterhalb der Flaeche offen dastehen. Wer kein Javascript hat,
   springt dorthin und liest — der Inhalt ist vollstaendig da. Erst dieses
   Skript holt die Liste in das Fenster hinein und macht aus den Links
   Schalter. Faellt es aus, bleibt alles wie im Dokument geschrieben.

   DER SCHALTER data-js="an"
   Er wird NUR gesetzt, wenn es einen IntersectionObserver gibt und
   `prefers-reduced-motion` nicht auf `reduce` steht. Daran haengen alle
   Startzustaende des Aufdeckens in warum.css. Zusammen mit dem Attribut
   wird auch die Bedienung eingeschaltet — wer Bewegung abbestellt hat,
   bekommt die Textstrecke offen und ohne jede Umschaltung.

   Wer die Bewegung mitten im Besuch abschaltet, bekommt das ueber den
   Listener am MediaQueryList mit: die Liste wandert zurueck an ihren
   Platz im Dokument, data-js faellt weg, alles steht sofort.
   =========================================================================== */
(function () {
  'use strict';

  var abschnitt = document.querySelector('.wimm');
  if (!abschnitt) return;

  var bloecke = abschnitt.querySelectorAll('[data-wi-block]');
  var feld    = abschnitt.querySelector('[data-wi-feld]');
  var fenster = abschnitt.querySelector('[data-wi-fenster]');
  var liste   = abschnitt.querySelector('[data-wi-texte]');
  var zu      = abschnitt.querySelector('[data-wi-zu]');

  var punkte  = abschnitt.querySelectorAll('[data-wi-punkt]');
  var reiter  = abschnitt.querySelectorAll('[data-wi-reiter]');
  var karten  = liste ? liste.querySelectorAll('[data-wi-text]') : [];

  // Wohin die Textliste zurueckgehoert, wenn die Bedienung ausgeht.
  var listeElter = liste ? liste.parentNode : null;
  var listeNach  = liste ? liste.nextElementSibling : null;

  var beobachter = null;
  var bedienung  = false;
  var aktiv      = null;

  var mq = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function jede(sammlung, tu) {
    Array.prototype.forEach.call(sammlung, tu);
  }

  /* ---------------------------------------------------------------------
     AUFDECKEN
  --------------------------------------------------------------------- */
  function alleZeigen() {
    jede(bloecke, function (el) { el.setAttribute('data-sicht', 'an'); });
  }

  function aufdeckenAn() {
    beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-sicht', 'an');
        beobachter.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    jede(bloecke, function (el) { beobachter.observe(el); });
  }

  /* ---------------------------------------------------------------------
     FLIP — der Punkt soll sichtbar hinueberwandern, nicht springen.
     Erst die alte Lage merken, dann den Zustand umschalten, dann den
     Unterschied als Transform zuruecksetzen und in einem Bild loesen.
  --------------------------------------------------------------------- */
  function flip(el, vorher) {
    if (!el || !vorher) return;
    var nachher = el.getBoundingClientRect();
    var dx = vorher.left - nachher.left;
    var dy = vorher.top - nachher.top;
    var s = nachher.width > 1 ? vorher.width / nachher.width : 1;

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(s - 1) < 0.02) return;

    el.style.transition = 'none';
    el.style.transformOrigin = 'left top';
    el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + s + ')';
    el.getBoundingClientRect();

    requestAnimationFrame(function () {
      el.style.transition = '';
      el.style.transform = '';
    });
  }

  function fensterEinfahren() {
    if (!fenster) return;
    fenster.setAttribute('data-wi-ein', '');
    fenster.getBoundingClientRect();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fenster.removeAttribute('data-wi-ein');
      });
    });
  }

  /* ---------------------------------------------------------------------
     OEFFNEN UND SCHLIESSEN
  --------------------------------------------------------------------- */
  function punktZu(nr) {
    return feld.querySelector('[data-wi-punkt="' + nr + '"]');
  }

  function markieren(nr) {
    jede(punkte, function (p) {
      var an = p.getAttribute('data-wi-punkt') === nr;
      if (an) { p.setAttribute('data-wi-an', ''); }
      else { p.removeAttribute('data-wi-an'); }
      p.setAttribute('aria-expanded', an ? 'true' : 'false');
    });
    jede(reiter, function (r) {
      r.setAttribute('aria-expanded',
        r.getAttribute('data-wi-reiter') === nr ? 'true' : 'false');
    });
    jede(karten, function (k) {
      k.hidden = k.getAttribute('data-wi-text') !== nr;
    });
  }

  function oeffnen(nr) {
    var punkt = punktZu(nr);
    if (!punkt) return;

    var vorher = punkt.getBoundingClientRect();

    markieren(nr);
    feld.setAttribute('data-wi-aktiv', nr);
    feld.setAttribute('data-wi-seite', punkt.getAttribute('data-wi-seite') || 'links');

    flip(punkt, vorher);
    fensterEinfahren();
    aktiv = nr;
  }

  function schliessen(fokusZurueck) {
    if (!aktiv) return;
    var punkt = punktZu(aktiv);
    var vorher = punkt ? punkt.getBoundingClientRect() : null;

    markieren(null);
    feld.removeAttribute('data-wi-aktiv');
    feld.removeAttribute('data-wi-seite');

    flip(punkt, vorher);
    if (fokusZurueck && punkt) punkt.focus();
    aktiv = null;
  }

  function umschalten(e, nr) {
    e.preventDefault();
    if (aktiv === nr) { schliessen(true); }
    else { oeffnen(nr); }
  }

  function beiTaste(e) {
    if (!bedienung || !aktiv) return;
    if (e.key === 'Escape' || e.key === 'Esc') schliessen(true);
  }

  function beiPunktKlick(e) {
    umschalten(e, this.getAttribute('data-wi-punkt'));
  }
  function beiReiterKlick(e) {
    umschalten(e, this.getAttribute('data-wi-reiter'));
  }
  function beiZuKlick() {
    schliessen(true);
  }

  /* ---------------------------------------------------------------------
     BEDIENUNG EIN UND AUS
  --------------------------------------------------------------------- */
  function bedienungAn() {
    if (bedienung || !feld || !fenster || !liste) return;

    fenster.appendChild(liste);
    jede(karten, function (k) { k.hidden = true; });
    if (zu) { zu.hidden = false; zu.addEventListener('click', beiZuKlick); }

    jede(punkte, function (p) { p.addEventListener('click', beiPunktKlick); });
    jede(reiter, function (r) { r.addEventListener('click', beiReiterKlick); });
    document.addEventListener('keydown', beiTaste);

    bedienung = true;
  }

  function bedienungAus() {
    if (!bedienung) return;
    schliessen(false);

    jede(punkte, function (p) {
      p.removeEventListener('click', beiPunktKlick);
      p.setAttribute('aria-expanded', 'false');
    });
    jede(reiter, function (r) {
      r.removeEventListener('click', beiReiterKlick);
      r.setAttribute('aria-expanded', 'false');
    });
    document.removeEventListener('keydown', beiTaste);
    if (zu) { zu.hidden = true; zu.removeEventListener('click', beiZuKlick); }

    jede(karten, function (k) { k.hidden = false; });
    if (listeElter) { listeElter.insertBefore(liste, listeNach); }

    bedienung = false;
  }

  /* ---------------------------------------------------------------------
     AN- UND ABSCHALTEN INSGESAMT
  --------------------------------------------------------------------- */
  function anschalten() {
    abschnitt.setAttribute('data-js', 'an');
    if ('IntersectionObserver' in window) { aufdeckenAn(); }
    else { alleZeigen(); }
    bedienungAn();
  }

  function abschalten() {
    if (beobachter) { beobachter.disconnect(); beobachter = null; }
    abschnitt.removeAttribute('data-js');
    bedienungAus();
    alleZeigen();
  }

  if (mq && mq.matches) {
    alleZeigen();
  } else {
    anschalten();
  }

  if (mq) {
    var wechsel = function () {
      if (mq.matches) { abschalten(); }
      else if (!bedienung) { anschalten(); }
    };
    if (mq.addEventListener) { mq.addEventListener('change', wechsel); }
    else if (mq.addListener) { mq.addListener(wechsel); }
  }
})();
