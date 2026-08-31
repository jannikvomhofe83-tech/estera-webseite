/* ===========================================================================
   ESTERA — Kontaktseite

   WAS DIESES SKRIPT TUT — UND WAS AUSDRUECKLICH NICHT
   Das Umschalten zwischen den drei Anliegen macht dieses Skript NICHT.
   Das erledigen echte <input type="radio"> und der Geschwisterselektor
   :checked in kontakt.css. Deshalb funktioniert die Auswahl auch dann,
   wenn diese Datei gar nicht geladen wird — und deshalb wechseln die
   Pfeiltasten die Auswahl auch ohne eine Zeile hier: das koennen native
   Radios einer Namensgruppe von sich aus.

   Dieses Skript macht genau zwei Dinge:
     1  Es ersetzt die Sprechblasen des Browsers bei leeren Pflichtfeldern
        durch Meldungen, die neben dem Feld stehen bleiben und von der
        Vorlesesoftware vorgelesen werden.
     2  Es raeumt eine Meldung wieder weg, sobald das Feld gefuellt wird.

   Es faengt das Absenden NICHT ab, wenn alles ausgefuellt ist. Ein
   Formular, das nur so tut als sende es, waere schlimmer als eines, das
   sichtbar kein Ziel hat.
   =========================================================================== */
(function () {
  'use strict';

  var wurzel = document.querySelector('[data-kontakt]');
  if (!wurzel) return;

  /* --- Meldungen -----------------------------------------------------------
     Kurz, in der Du-Anrede und in der Sache konkret. „Bitte ausfuellen"
     sagt nicht, WAS erwartet wird; „Wie heisst du?" sagt es. */
  var TEXTE = {
    name:      'Bitte trag deinen Namen ein.',
    email:     'Bitte trag deine E-Mail-Adresse ein.',
    emailForm: 'Diese E-Mail-Adresse sieht nicht vollständig aus. Fehlt das @?',
    nachricht: 'Bitte schreib uns kurz, worum es geht.',
    /* Die drei Zusatzfelder, je eines pro Anliegen (31.08.2026). */
    start:     'Bitte wähl aus, wie schnell du starten möchtest.',
    herkunft:  'Ein Stichwort genügt — zum Beispiel deine Ausbildung oder dein jetziger Beruf.',
    beginn:    'Ein ungefährer Zeitpunkt genügt — zum Beispiel „ab sofort" oder „ab März".'
  };

  function meldungFuer(feld) {
    var art = feld.getAttribute('data-pruef') || '';
    var wert = (feld.value || '').trim();
    if (!wert) return TEXTE[art] || 'Dieses Feld wird gebraucht.';
    /* typeMismatch meldet der Browser selbst — wir fragen ihn, statt eine
       eigene Adresspruefung zu erfinden. Jede handgeschriebene Regel fuer
       E-Mail-Adressen sperrt frueher oder spaeter eine gueltige aus. */
    if (art === 'email' && feld.validity && feld.validity.typeMismatch) {
      return TEXTE.emailForm;
    }
    return '';
  }

  function behaelterVon(feld) {
    var id = feld.getAttribute('aria-describedby');
    return id ? document.getElementById(id) : null;
  }

  function fehlerZeigen(feld, text) {
    var b = behaelterVon(feld);
    if (b) b.textContent = text;
    feld.setAttribute('aria-invalid', 'true');
  }

  function fehlerWeg(feld) {
    var b = behaelterVon(feld);
    if (b) b.textContent = '';
    feld.removeAttribute('aria-invalid');
  }

  var formulare = wurzel.querySelectorAll('form[data-kf-form]');

  Array.prototype.forEach.call(formulare, function (form) {
    var felder = form.querySelectorAll('[data-pruef]');

    /* novalidate wird HIER gesetzt und steht bewusst NICHT im Markup.

       Der Unterschied entscheidet darueber, ob die Seite ohne Javascript
       noch etwas prueft:
         steht novalidate im HTML, prueft ohne Skript NIEMAND — leere
           Pflichtfelder gingen kommentarlos durch;
         steht es nicht im HTML, uebernimmt ohne Skript der Browser mit
           seinen eigenen Sprechblasen.
       Mit Skript schalten wir die Sprechblasen ab, weil sie nach ein paar
       Sekunden von selbst verschwinden, immer nur eine zeigen und von
       Vorlesesoftware unzuverlaessig erfasst werden. Die Meldungen
       darunter bleiben stehen, bis der Fehler weg ist. */
    form.noValidate = true;

    /* Sobald jemand nachbessert, verschwindet die Meldung sofort. Eine
       Fehlermeldung, die stehen bleibt, obwohl der Fehler behoben ist,
       liest sich wie ein Vorwurf. */
    Array.prototype.forEach.call(felder, function (feld) {
      /* input UND change: bei <select> ist change das verlaessliche
         Ereignis — input feuert dort nicht in jedem Browser. */
      var aufraeumen = function () {
        if (feld.getAttribute('aria-invalid') === 'true' && !meldungFuer(feld)) {
          fehlerWeg(feld);
        }
      };
      feld.addEventListener('input', aufraeumen);
      feld.addEventListener('change', aufraeumen);
      feld.addEventListener('blur', function () {
        /* Erst pruefen, wenn ueberhaupt etwas eingegeben wurde — sonst
           schimpft die Seite, weil man ein Feld nur durchlaufen hat. */
        if ((feld.value || '').trim() === '') return;
        var m = meldungFuer(feld);
        if (m) fehlerZeigen(feld, m); else fehlerWeg(feld);
      });
    });

    form.addEventListener('submit', function (ev) {
      var erstesFalsches = null;

      Array.prototype.forEach.call(felder, function (feld) {
        var m = meldungFuer(feld);
        if (m) {
          fehlerZeigen(feld, m);
          if (!erstesFalsches) erstesFalsches = feld;
        } else {
          fehlerWeg(feld);
        }
      });

      if (erstesFalsches) {
        ev.preventDefault();
        erstesFalsches.focus();
      }
      /* Sonst laeuft das Absenden durch. Wohin, entscheidet das action des
         Formulars — und das ist derzeit leer, weil kein Empfaenger
         abgestimmt ist. Der Vermerk im Markup und der sichtbare Hinweis
         unter dem Knopf sagen das beide. */
    });
  });
})();
