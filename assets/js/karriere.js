/* ---------------------------------------------------------------------------
   ESTERA — KARRIERE (Übersichtsseite)
   Neubau vom 29.08.2026.

   Diese Datei macht genau zwei Dinge. Mehr braucht die Seite nicht — und
   mehr hat auch die Vorlage nicht (wiese/bericht.md, Abschnitt 5): dort
   bewegt KEINE Bibliothek irgendetwas, kein GSAP, kein Lenis, kein AOS,
   kein Framer. Alles läuft über CSS-Keyframes plus einen
   IntersectionObserver, der Klassen umschaltet. Genau das steht hier.

   1  EINBLENDUNG BEIM EINTRITT
      Ein IntersectionObserver setzt die Klasse `ist-da`, sobald ein
      Element ins Bild kommt. Die eigentliche Bewegung steckt vollständig
      in karriere.css; hier wird nur geschaltet. Einmalig — danach wird das
      Element nicht mehr beobachtet, wie in der Vorlage, die ihre Klassen
      nach dem Lauf ebenfalls wieder abräumt.

   2  DAS KOPFVIDEO BEI RUHIGER DARSTELLUNG ANHALTEN
      Das Ausblenden erledigt karriere.css und wirkt auch ohne Javascript.
      Hier wird das Video zusätzlich angehalten, damit es nicht unsichtbar
      weiterläuft und Rechenzeit und Bandbreite kostet.

   OHNE JAVASCRIPT
   steht die Seite vollständig da. Sämtliche Einblendregeln in karriere.css
   hängen an [data-js='an'], und dieses Merkmal setzt erst diese Datei —
   fällt sie aus, ist nie etwas unsichtbar. Das Video trägt autoplay, muted,
   loop und playsinline im HTML und spielt deshalb auch ohne Skript von
   selbst ab.

   BEI prefers-reduced-motion: reduce
   steigt die Einblendung in der ersten Zeile aus (wie die Vorlage es tut):
   [data-js='an'] wird dann gar nicht erst gesetzt, alles steht sofort.

   BEKANNTE GRENZE, damit sie nicht als Fehler gelesen wird: fällt das
   Skript aus UND ist gleichzeitig „reduce" gesetzt, wird das Video von
   karriere.css zwar ausgeblendet, läuft aber im Hintergrund weiter. Die
   Vorlage hat dieselbe Grenze — auch dort hängt die Rücksicht auf ruhige
   Darstellung am Skript. Sichtbar bewegt sich in diesem Fall nichts.
--------------------------------------------------------------------------- */
(function () {
  'use strict';

  var ruhig = window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     2  Das Kopfvideo — zuerst, weil es unabhängig von allem Übrigen ist
        und auch dann greifen soll, wenn die Einblendung aussteigt.
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
     1  Einblendung beim Eintritt
     --------------------------------------------------------------------- */

  /* Wie die Vorlage: bei ruhiger Darstellung in der ersten Zeile aussteigen.
     Ebenso, wenn der Browser keinen IntersectionObserver kennt — dann bleibt
     alles sichtbar stehen, statt auf ein Ereignis zu warten, das nie kommt. */
  if (ruhig || !('IntersectionObserver' in window)) return;

  var wurzel = document.querySelector('.kar');
  if (!wurzel) return;

  /* Erst JETZT wird das Merkmal gesetzt, das die Anfangszustände in
     karriere.css scharf schaltet. Das Skript steht am Ende des <body>, der
     Baum ist also vollständig; gesetzt wird vor dem ersten Anstrich, damit
     nichts erst sichtbar wird und dann verschwindet. */
  wurzel.setAttribute('data-js', 'an');

  /* Die Kacheln der Stellenliste blenden als GRUPPE ein — der Versatz von
     0,2 s zwischen den Geschwistern steckt als --i im Markup und wird in
     karriere.css zur animation-delay. Beobachtet wird deshalb die Liste,
     nicht die einzelne Karte: sonst liefe der Versatz gegen den Zeitpunkt
     des Eintritts jeder einzelnen Karte statt gegen den der Reihe. */
  var ziele = [];
  var liste = wurzel.querySelector('[data-stellen]');
  if (liste) ziele.push(liste);
  Array.prototype.push.apply(ziele, wurzel.querySelectorAll('[data-auf]'));

  /* Ein Zehntel des Elements reicht als Auslöser. Ein rootMargin von
     −40px am Fuß verhindert, dass etwas losläuft, das gerade erst mit
     einem Pixel in den Bildausschnitt ragt. */
  var beobachter = new IntersectionObserver(function (eintraege, selbst) {
    for (var i = 0; i < eintraege.length; i++) {
      if (!eintraege[i].isIntersecting) continue;
      eintraege[i].target.classList.add('ist-da');
      selbst.unobserve(eintraege[i].target);
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  for (var i = 0; i < ziele.length; i++) beobachter.observe(ziele[i]);
})();
