# Über Estera — Neubau nach fluid.glass

Auftrag vom 26.08.2026. Vorlage ist die Landingpage **https://fluid.glass/**.
Betroffen ist ausschließlich die Unterseite **`ueber-estera.html`**, nicht die
Startseite.

## Der Umfang

Fünf Abschnitte der Vorlage, in dieser Reihenfolge:

1. **Hero**
2. der **zweite Abschnitt**
3. **Product Collection**
4. **Showroom**
5. **Future Projection**

Alles danach ist nicht Teil des Auftrags.

## Was 1:1 übernommen wird

Der Kunde wörtlich: „Jede Text-Position, jede Schriften-Position, jede
Bildfenster-Position, jede CTA-Button-Position, jede noch so kleine Animation
eins zu eins genauso nachgebaut."

Also: **Anordnung, Größenverhältnisse, Abstände, Reihenfolge, Bewegung.** Wo
ein Element sitzt, wie groß es im Verhältnis zum Abschnitt ist, wann und wie
es sich bewegt.

## Was NICHT übernommen wird

- **Schrift** — Cormorant Garamond wie im ganzen Projekt.
- **Farben** — Navy, Creme, Gold, Sand. Die Token stehen im Farbblock von
  `assets/css/base.css`.
- **Kein Wort Text** der Vorlage.
- **Der Glaslook nur gemäßigt.** Vom Kunden bestätigt: Aufbau und Animation
  1:1, aber Milchglas, Unschärfe und Verläufe in Navy und Creme statt bunt.
  Sonst bricht die Seite aus dem Rest der Website aus.
- **Kopfleiste und Fußbereich bleiben**, wie sie auf allen anderen Seiten
  sind. Bestätigt.

## Der Inhalt — bestätigt: der vorhandene bleibt, Wort für Wort

Die Seite trägt seit dem 26.08. drei Abschnitte aus **Abschnitt 9 des
Wording-Masters**: Haltung, Werte, Versprechen. **Jeder Satz bleibt
wörtlich.** Geändert wird nur die Form.

Zuordnung auf die fünf Abschnitte der Vorlage:

| Vorlage | trägt bei uns |
|---|---|
| Hero | Kleinzeile ÜBER ESTERA, Überschrift **Wir bauen keine schnellen Abschlüsse. Wir bauen langfristige Freiheit auf.**, Unterzeile **Immobilien sind das Werkzeug. Entscheidend ist, was sie für dein Leben möglich machen.**, dazu ein Bild eines Wohngebäudes |
| zweiter Abschnitt | die drei Absätze der Haltung („Vielleicht möchtest du weniger Steuern zahlen…", „Deshalb beginnt unsere Zusammenarbeit nicht mit einer Immobilie, sondern mit dir…", „Unser Ziel ist nicht der schnelle Verkauf…") |
| Product Collection | die drei Werte: **Persönlich statt standardisiert**, **Ehrlich statt passend gemacht**, **Langfristig statt laut**, je mit ihrem Text |
| Showroom | „Warum Estera" — die vorhandene Gegenüberstellung |
| Future Projection | das Statement **Du gibst uns dein Ziel. Gemeinsam bauen wir die Immobilienstrategie, die dich dorthin bringt.** und der Knopf **Estera persönlich kennenlernen** |

Reicht der vorhandene Text für einen Abschnitt der Vorlage nicht aus, wird der
Abschnitt **kürzer gebaut** — nicht mit erfundenem Text gefüllt.

## Bilder

Erzeugt und bereit unter `assets/img/ueber/`:

- `ue-hero-quer.webp` — 1402 × 1122, Wohngebäude frontal
- `ue-hero-hoch.webp` — 1023 × 1537, Wohngebäude hochformatig
- `ue-hero-detail.webp` — 1254 × 1254, Fassadendetail quadratisch

Drei Formate, damit der Beschnitt der Vorlage getroffen werden kann. **Keine
Gesichter, keine Menschen.** Braucht die Vorlage weitere Bilder, werden sie
erzeugt — nicht ersatzweise Farbflächen eingesetzt.

Die Portraits der Geschäftsführer gehören **nicht** mehr auf diese Seite; sie
stehen im Kopf der Karriereseite.

## Harte Grenzen

- **Keine erfundene Zahl** — kein Jahr, keine Mitarbeiterzahl, keine Quote.
- Verbotene Wörter: garantiert, risikofrei, krisensicher, sichere Rendite,
  maximale Rendite.
- Anrede **Du**.
- Kein Schwarz — Navy statt dessen.
- Ohne Javascript und bei `prefers-reduced-motion: reduce` muss alles lesbar
  und bedienbar sein.
- Der Sandknopf `.btn--sand` trägt weiße Schrift auf Sand und misst 1,94:1 —
  er ist auf dieser Seite **nicht** einsetzbar, solange das so ist.
