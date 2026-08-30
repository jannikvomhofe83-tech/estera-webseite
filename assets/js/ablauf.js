/* ===========================================================================
   UNSER ABLAUF — Section #ablauf
   Angelegt 25.08.2026. NEU GESCHRIEBEN am 30.08.2026.

   WAS HIER FRUEHER STAND
   Bis zum 30.08.2026 waren die fuenf Schritte eine Liste mit einem
   Einzelheitenblock daneben, und dieses Skript hat den Block beim Rollen
   durchgeschaltet: ein `scroll`-Horcher, gedrosselt ueber
   requestAnimationFrame, dazu eine selbst gerechnete Laufstrecke, ein
   gerechneter Klebepunkt und eine Tastatursteuerung ueber die Liste. Rund
   230 Zeilen.

   WAS JETZT GILT
   Die Schritte sind sechs Karten, die sich beim Rollen stapeln — und das
   macht die CSS allein, ueber gestaffelte `position: sticky`-Klebehoehen.
   Kein Rollhorcher, kein requestAnimationFrame, keine Messung, keine
   Neurechnung bei Groessenaenderung. Der Browser macht das von sich aus
   fluessiger, als ein Skript es koennte, und es kann nicht mehr aus dem
   Tritt geraten.

   DIESE DATEI HAT DAMIT GENAU EINE AUFGABE:
   sie setzt [data-abl-bereit='true'] an die Section. Erst daran haengen in
   ablauf.css die Klebe-Regeln.

   WARUM UEBERHAUPT NOCH EIN SCHALTER, wenn die CSS alles kann:
   OHNE JAVASCRIPT muessen alle sechs Karten lesbar UNTEREINANDER stehen,
   nicht gestapelt — das ist ausdruecklich Bedingung. Waeren die Klebe-Regeln
   fest in der CSS, wuerden sie auch ohne Skript greifen. Das Attribut ist
   also der Schalter, der genau diese Bedingung sicherstellt.

   Der zweite Fall — `prefers-reduced-motion: reduce` — steht NICHT hier,
   sondern in der CSS. Dort gehoert er hin: er muss auch dann noch wirken,
   wenn jemand die Einstellung im laufenden Betrieb umstellt, und das
   erledigt eine Media Query von selbst.
   =========================================================================== */
(function () {
  'use strict';

  var abschnitt = document.querySelector('[data-abl]');
  if (!abschnitt) return;
  if (!abschnitt.querySelector('.abl__stapel')) return;

  abschnitt.setAttribute('data-abl-bereit', 'true');
})();
