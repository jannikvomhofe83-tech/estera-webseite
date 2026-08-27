# fluid.glass — Bauaufnahme

Gemessen am 26.08.2026 mit Playwright und `getComputedStyle`, nicht abgelesen.
Rohdaten und mehrere hundert Screenshots liegen in
`<kladde>/fluid/shots/` und `<kladde>/fluid/` (`geo-*.json`, `motion.json`,
`enter2.json`, `hover.json`, `style.css`, `responsive-detail.json`), wobei
`<kladde>` =
`/private/tmp/claude-501/-Users-jannikvomhofe-Desktop-Webdesign-Estera-Webseite-2/91d2f3e3-ffbc-4955-b331-2788cfaa6e12/scratchpad`

**Der fünfte Abschnitt heißt dort nicht „Future Projection", sondern
`FEATURED PROJECTS`.** Reihenfolge stimmt sonst.

## Technik der Vorlage

Nuxt 3, GSAP 3.15 mit ScrollTrigger, Lenis für weiches Scrollen. **Kein
Canvas, kein WebGL.** Alle Bewegung ist `transform`/`opacity` auf normalem
DOM. `document.getAnimations()` liefert 0 — keine einzige CSS-Keyframe-
Animation. Lenis ist für den Nachbau **nicht nötig**.

### Fließende Typografie — der wichtigste Kniff

```css
:root { --size: 1600 }
@media (width <= 600px) { :root { --size: 375 } }
html { font-size: calc((100vw / var(--size)) * 10) }
```
1 rem = 0,625 vw ab 601 px, darunter 2,667 vw. Gemessen 1920→12 px,
1440→9 px, 1024→6,4 px, 390→10,4 px. **Alles außer `100svh` skaliert damit
linear mit der Fensterbreite. Es gibt genau einen Breakpoint: 600/601 px.**

### Raster

Container `margin: 0 4rem`, darin `grid-template-columns: repeat(24, 1fr)`,
`column-gap: 2rem`. Unter 601 px: 6 Spalten, `gap 1.5rem`, `margin 0 2rem`.

### Farben der Vorlage — bei uns ersetzt

`--color-cream #f3f0ec` (Grund) · `--color-grey #212325` (Text und dunkle
Fläche) · `--color-black #0b1012` (Buttons) · `--color-white #fff`.

**Bei uns:** Creme → `--paper` / unser Creme, Grau → `--navy-800`, Schwarz →
`--navy-900`. Haarlinien statt `color-mix(#212325 20%)` in unserem Navy mit
gleicher Deckkraft.

### Easing

`--ease-out-cubic cubic-bezier(.215,.61,.355,1)` · `--ease-out-quart
cubic-bezier(.165,.84,.44,1)` · `--ease-in-out-quart cubic-bezier(.77,0,.175,1)`

## Gemeinsame Bausteine

**`.base-title`** (Kleinzeile mit Raute) — Mono, `1.4rem`, `line-height 1.3`,
`letter-spacing .1em`, `600`, uppercase, flex. `::before`: Quadrat
`0.6rem`, `background: currentColor`, `rotate(45deg) translateY(-.2rem)`,
`margin-right: 1.2rem`.

**`.base-heading`** — `line-height: 1`. Groß `6.4rem` mit `-.03em`, mittel
`4rem` mit `-.02em`, mobil `3.2rem`/`4rem`. Zerlegt in
`.line-mask > .line`:
```css
.line-mask { margin: -2rem 0; padding: 1rem 0; position: relative; display: block; overflow: clip }
.line      { position: relative; display: block }
```
Das Padding gibt Luft für Unterlängen, ohne das Layout zu verschieben.
`aria-label` mit dem vollen Satz auf dem `<p>`, Zeilen `aria-hidden`.

**`.base-button`** — Mono `1.2rem`, `line-height: 1rem`, `.08em`, `500`,
uppercase, inline-flex, **Radius 0**. Pfeil-SVG `1.4rem × 1.1rem`,
`margin-right: 1.2rem`. `.label { height: 1rem; overflow: hidden }` mit
**zwei identischen** Zeilen à `1.5rem`. Varianten: `.is-alpha` ohne Fläche,
`.is-black` gefüllt mit `padding: 1.5rem 2.4rem`, `.is-white` mit
`backdrop-filter: blur(2rem)`.
**Hover:** beide Zeilen `translateY: 0 → −100%`, Endzustand sieht gleich aus.

## Die fünf Abschnitte

### 1 Hero — `100svh + 2rem + Inhalt + 32.8rem`, bei 1920 = 1637,9 px

Zeile 1: `height: 100svh`, `padding: 16rem 0`, `align-items: flex-end`.
Überschrift `grid-column: 6 / 20`, **zentriert**, sitzt unten im
Inhaltsbereich. Zeile 2: `padding: 2rem 0 32.8rem`, `border-top: 1px`.
Kleinzeile absolut oben mittig (`left: 50%; translateX(-50%)`), Fließtext
`grid-column: 20 / 25`, also rechts, `1.8rem/1.3`.
Hintergrund: `inset: 0`, dunkle Fläche, darin `.asset { opacity: .8 }` mit
Video/Bild `object-fit: cover`, darüber `::before` mit
`linear-gradient(transparent, #000)` bei `opacity: .5`.

### 2 Text-CTA — Höhe 450 px, `margin: 15rem 0`

`flex-direction: column; align-items: center; text-align: center`.
Kleinzeile, dann Überschrift `width: 100.6rem` mit `margin: 4rem 0`, dann
`.is-black`-Button. Mobil linksbündig, `3.2rem`, `margin: 3rem 0`.

### 3 Product Collection — Höhe 1817,8 px, `margin: 15rem 0`

Container mit `border-top` und `padding-top: 2rem`.
`.content` **absolut**: `inset: 22rem 23.2rem auto auto`, `width: 30.1rem` —
Fließtext plus Button, rechts oben.
`.blocks`: 24 Spalten, `padding-top: 8rem`. Vier Kacheln,
`aspect-ratio: 500/617`, `overflow: hidden`:

| # | `grid-column` | `margin-top` |
|---|---|---|
| 1 | `8 / 15` | 0 |
| 2 | `18 / 24` | `45rem` |
| 3 | `1 / 7` | `4.5rem` |
| 4 | `12 / 17` | `−17rem` |

**Die Marginwerte allein bauen die versetzte Anordnung** — kein Flex-Wrap,
keine Karten. Titel absolut zentriert in der Kachel, `4rem`, weiß.
Bild `aspect-ratio: 430/530`, `object-fit: cover`.
Mobil: 2 Spalten, Versätze `8.4rem` / `−8.4rem` / 0.

### 4 Showroom — `height: 200svh`, dunkle Fläche

`.container { position: sticky; top: 0; height: 100svh; display: flex;
align-items: center; justify-content: center }` — klebt über **genau
100svh**, also `Abschnittshöhe − 100svh`.
`.border`: absolut, `width: 152rem`, 1 px, `margin-top: −20rem`,
Start `scaleX(0)`.
`.content`: `justify-content: space-between; margin: 0 4rem`. Links
Überschrift `width: 45rem`, `4rem`. Rechts `text-align: right` mit Adresse
und `.is-white`-Button.
`.background`: absolut `inset: 0`, Video `object-fit: cover`.
Mobil: **kein Sticky**, Höhe `100svh`, Video fest, Linie aus.

### 5 Featured Projects — Höhe 874,5 px, `margin: 4rem 0 15rem`

Container mit `border-top`, 24 Spalten. Kleinzeile `grid-column: 1 / 11`,
`.content` `11 / 25` mit Überschrift `6.4rem` und Button.
`.projects`: `grid-column: 1 / 25`, `margin-top: 12rem`, `border-top`.
Je Zeile: `display: flex; align-items: center; padding: 2.4rem 0`,
`border-bottom`. Titel `2.4rem`, `width: 38.5rem`, **`opacity: .4`**.
Chips: `height: 2.6rem`, **`border-radius: 2rem`** (der einzige Radius der
ganzen Seite), 1-px-Rand, Mono `1.2rem`, `opacity: .4`.
Vorschaubild absolut `left: 29.7rem`, `23.6rem × 29.6rem`, **`opacity: 0`**,
`transition: opacity .3s ease-out`. Pfeil `opacity: .2`.
**Hover:** `.project:hover * { opacity: 1 }`, Rahmen von 10 % auf 60 %.
Mobil: Chips und Bild `display: none`.

## Die Bewegung

### Scrollgekoppelt — vier Stück, alle streng linear, kein Easing

**A1 Hero-Parallaxe** — `.asset` `translateY: 0% → 50%` über scrollY 0 bis
Abschnittsende. 0,5 px je Scroll-Pixel.

**A2 Kacheldrift** — nur Kachel 2 und 3. Trigger `.blocks`,
`top bottom` bis `bottom top`. Kachel 2 `translateY: +50% → 0%`, Kachel 3
`−50% → 0%`. Kachel 1 und 4 bewegen sich nicht.

**A3 Showroom-Aufzug** — der auffälligste Effekt. Fortschritt = der
Klebeweg. Vier Werte laufen gleichzeitig und linear:

| Element | von | nach |
|---|---|---|
| Video | `scale(0.55)` | `scale(1)` |
| Video | `opacity: .7` | `opacity: .3` |
| Linie | `scaleX(0)` | `scaleX(1)` |
| linke Spalte | `translateX(+6.5rem)` | `0` |
| rechte Spalte | `translateX(−6.5rem)` | `0` |

**A4** — mobiler Scroll-Hinweis `opacity: 1 → 0` über 330 px.

**Sonst klebt nichts, es gibt keinen Farbwechsel beim Scrollen, keine
Filter-, Clip-Path- oder Backdrop-Animation.**

### Einmalig — genau eine Geste

**Zeilenweiser Überschriftaufzug**, für **jede** `.base-heading` in allen
fünf Abschnitten. Auslöser `top bottom`, **einmalig**, kein Rücklauf.
`.line` `translateY: 200% → 0` der eigenen Zeilenhöhe.
**Dauer 1,2 s, `cubic-bezier(.215,.61,.355,1)`, Stagger 0,1 s.**
Die Maske schneidet ab — es sieht aus, als schöbe sich der Text hinter
einer Kante hervor.

**Nichts sonst blendet ein.** Kleinzeilen, Buttons, Kacheln, Bilder,
Projektzeilen stehen einfach da. Deutlich sparsamer, als es aussieht.

### Hover

Button-Zeilen `translateY: −100%` · Kachelbild `scale(1) → scale(1.1)` ·
Projektzeile: Rahmen 10 % → 60 %, alle Kinder `opacity → 1`, Vorschaubild
`0 → 1` in `.3s ease-out`.

## Was den Charakter ausmacht — in Zahlen

1. **Cremegrund, kein Weiß.** Genau ein harter Kontrastwechsel: der dunkle
   Showroom zwischen hellen Abschnitten.
2. **Zwei Schriftgrade, sonst nichts.** Faktor 5,3 zwischen Überschrift
   (`6.4rem`, `-.03em`) und Label (`1.2rem`, `+.08em`, uppercase, Mono).
   Enge gegen weite Laufweite — das ist die halbe Wirkung.
3. **Sehr viel Luft.** `15rem` zwischen Abschnitten, `8rem` vor dem
   Kachelraster, `12rem` über den Projektzeilen. Der Hero ist 1,52
   Fensterhöhen hoch für einen einzigen Satz.
4. **Alles hängt an 1-px-Haarlinien.** **`box-shadow` kommt in diesen fünf
   Abschnitten kein einziges Mal vor.**
5. **Fast keine Radien.** Buttons 0. Einziger Radius: die Projekt-Chips.
6. **Glas an genau drei Stellen**, immer `backdrop-filter: blur(2rem)` plus
   `linear-gradient(#ffffff26, #fff3)`.
7. **Bewegung langsam und linear.** Der Showroom braucht eine volle
   Fensterhöhe Scroll für eine Skalierung. Nichts springt, nichts federt,
   kein Overshoot.
8. **Raum über Versatz, nicht über Boxen.** Die `margin-top`-Werte der vier
   Kacheln bauen die schwebende Anordnung.
9. **Niedrige Deckkraft als Mittel:** Video `.8`, Scrim `.5`, Projekttitel
   und Chips `.4`, Pfeile `.2`. Hover hebt auf 1.

## Nachbau ohne Javascript

| Effekt | ohne JS |
|---|---|
| Raster, Typografie, Farben, Haarlinien, Glas | **ja**, 1:1 |
| Showroom-Sticky und Aufzug | **ja**, `position: sticky` + `animation-timeline: scroll()` — streng linear, direkt abbildbar |
| Hero-Parallaxe, Kacheldrift | **ja**, `animation-timeline: scroll()` |
| Zeilenweiser Überschriftaufzug | **nein** — die Zeilenaufteilung hängt vom Umbruch ab und muss zur Laufzeit passieren. Die Animation danach ist reines CSS. |
| Hover | **ja** |
