/* ===========================================================================
   ESTERA — FAQ: Kategorieregister und Akkordeon

   Ohne dieses Skript steht der Abschnitt vollstaendig lesbar da: alle sechs
   Kategorielisten untereinander, alle Antworten sichtbar. Das Skript nimmt
   nur weg — es blendet die nicht gewaehlten Listen aus und klappt die
   Antworten zu. Deshalb steht im HTML kein einziges hidden-Attribut; das
   setzt erst der Anfangszustand hier unten.

   Die Klappzustaende laufen ausschliesslich ueber data-offen am Listenpunkt
   und aria-expanded am Knopf. Hoehen werden nirgends gerechnet — das macht
   das Raster in faq.css (0fr auf 1fr).
   =========================================================================== */
(function () {
  'use strict';

  var wurzel = document.querySelector('[data-faq]');
  if (!wurzel) return;

  var liste = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || wurzel).querySelectorAll(sel));
  };

  var reiter  = liste('[data-faq-reiter]');
  var tafeln  = liste('[data-faq-tafel]');
  if (!reiter.length || reiter.length !== tafeln.length) return;

  /* --- Akkordeon --------------------------------------------------------- */

  function setzeFrage(knopf, offen) {
    var punkt = knopf.closest('[data-faq-item]');
    knopf.setAttribute('aria-expanded', String(offen));
    if (!punkt) return;
    if (offen) punkt.setAttribute('data-offen', '');
    else punkt.removeAttribute('data-offen');
  }

  /* Immer nur eine Frage offen: vor dem Oeffnen werden alle Geschwister in
     derselben Tafel geschlossen. Bewusst nur innerhalb der Tafel — die
     ausgeblendeten Kategorien behalten ihren Zustand und sollen ihn
     behalten, damit beim Zurueckwechseln nichts springt. */
  function oeffne(knopf) {
    var tafel = knopf.closest('[data-faq-tafel]');
    if (tafel) {
      liste('[data-faq-frage]', tafel).forEach(function (k) {
        if (k !== knopf) setzeFrage(k, false);
      });
    }
    setzeFrage(knopf, true);
  }

  liste('[data-faq-frage]').forEach(function (knopf) {
    knopf.addEventListener('click', function () {
      // Der Knopf ist ein <button>: Enter und Leertaste loesen click von
      // selbst aus. Eine eigene Tastaturbehandlung waere hier doppelt.
      if (knopf.getAttribute('aria-expanded') === 'true') setzeFrage(knopf, false);
      else oeffne(knopf);
    });
  });

  /* --- Kategorieregister -------------------------------------------------- */

  function waehle(index, mitFokus) {
    if (index < 0) index = reiter.length - 1;
    if (index >= reiter.length) index = 0;

    reiter.forEach(function (r, i) {
      var aktiv = i === index;
      r.setAttribute('aria-selected', String(aktiv));
      // Rollendes tabindex: das Register ist EINE Tabstation, innerhalb
      // wird mit den Pfeiltasten gewechselt.
      r.tabIndex = aktiv ? 0 : -1;
    });

    tafeln.forEach(function (t, i) {
      var aktiv = i === index;
      t.hidden = !aktiv;
      if (!aktiv) return;
      // Jede Kategorie beginnt mit der ersten Frage offen — so wie beim
      // ersten Blick auf den Abschnitt. Sonst koennte man auf eine Karte
      // stossen, in der nur zugeklappte Zeilen stehen.
      liste('[data-faq-frage]', t).forEach(function (k, n) {
        setzeFrage(k, n === 0);
      });
    });

    if (mitFokus) reiter[index].focus();
  }

  function aktiverIndex() {
    for (var i = 0; i < reiter.length; i++) {
      if (reiter[i].getAttribute('aria-selected') === 'true') return i;
    }
    return 0;
  }

  reiter.forEach(function (r, i) {
    r.addEventListener('click', function () { waehle(i, false); });

    r.addEventListener('keydown', function (e) {
      var jetzt = aktiverIndex();
      // Waagerecht und senkrecht: die Leiste liegt auf breiten Fenstern
      // untereinander, auf schmalen nebeneinander — beide Achsen muessen
      // deshalb dasselbe tun.
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight': e.preventDefault(); waehle(jetzt + 1, true); break;
        case 'ArrowUp':
        case 'ArrowLeft':  e.preventDefault(); waehle(jetzt - 1, true); break;
        case 'Home':       e.preventDefault(); waehle(0, true); break;
        case 'End':        e.preventDefault(); waehle(reiter.length - 1, true); break;
      }
    });
  });

  /* --- Anfangszustand ----------------------------------------------------- */
  // Erst hier wird zugeklappt. Bis zu diesem Punkt war der Abschnitt offen —
  // wer ohne JavaScript liest, bleibt bei diesem Stand.
  waehle(0, false);
})();
