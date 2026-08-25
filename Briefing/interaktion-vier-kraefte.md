# Interaktivität „Vier Kräfte. Ein Ergebnis: dein Vermögen."

Vorgabe des Kunden vom 25.08.2026, **nach** dem Bau der Section umzusetzen.
Wörtlich abgelegt, damit beim Umsetzen nichts aus dem Gedächtnis rekonstruiert
werden muss.

**Wichtigste Vorgabe:** keine gestalterische oder strukturelle Neuentwicklung.
Die Section ist visuell freigegeben und bleibt, wie sie aussieht und sitzt.
Geändert werden ausschließlich: Interaktivität der vier Karten, die
Micro-Animationen, das feste Erklärfeld, die vorgegebenen Texte, der Begriff
„BANK" → „BANKKAPITAL" in der unteren Navigation, die mobile Interaktion.

---

## Vor dem Editieren

1. Projektanweisungen lesen (`CLAUDE.md`, `AGENTS.md`, README, Konfiguration).
2. Die Komponente ermitteln, die „Vier Kräfte. Ein Ergebnis" rendert.
3. Vorhandene Komponenten, Assets, Styles, CSS-Variablen, Breakpoints und
   Animationstechniken prüfen.
4. Prüfen, ob Framer Motion, GSAP oder Vergleichbares installiert ist.
5. Nur vorhandene Abhängigkeiten verwenden. **Keine neue Library installieren.**
6. Nicht betroffene Komponenten nicht refaktorieren.
7. Bestehende Architektur und Coding-Stil beibehalten.
8. Möglichst kleiner, klar begrenzter Diff.

## Nicht verändern

Der gesamte obere Vergleich „Klassisch investieren" / „Mit Immobilie" samt
Texten, Hervorhebungen, Abständen, Größen und Positionen · Headline der Section ·
Hintergrund · Marmorstruktur · Farbwelt · Typografie · vorhandene 3D-Assets ·
die zentrale 3D-Immobilie samt Position und Größe · die vier Kartenpositionen ·
die Kartengrößen · die Verbindungslinien · die goldenen Verbindungspunkte · der
Balken „DEIN EIGENTUM WÄCHST" · der bestehende CTA · Abstände außerhalb des
neuen Erklärfelds · andere Sections · globale Styles · Header und Fuß · Inhalte
außerhalb dieser Section.

Keine vorhandenen Assets neu generieren oder austauschen. Liegt ein Icon nur als
Bilddatei vor, wird ein **Wrapper** über CSS-Transforms animiert, nie die Datei.

## Kartenpositionen (unverändert)

| | |
|---|---|
| links oben | BANKKAPITAL |
| links unten | STEUERVORTEILE |
| Mitte | bestehende 3D-Immobilie |
| rechts oben | MIETE |
| rechts unten | WERTENTWICKLUNG |

## Klickhinweis

In jeder Karte am unteren Rand dezent: **„Mehr erfahren →"** — vorhandene
Sans-Serif, bestehendes Navy. Keine zusätzlichen Knöpfe, Marken oder Symbole.
Die **ganze Karte** ist anklickbar.

## Desktop-Interaktion

**Bankkapital ist beim Laden aktiv.** Dessen Karte trägt den bestehenden aktiven
Navy-Rahmen und Schatten, die Verbindung zur Immobilie ist hervorgehoben, das
Erklärfeld zeigt Bankkapital, in der unteren Navigation ist „01 BANKKAPITAL"
aktiv. Die drei anderen Karten bleiben unverändert und inaktiv.

**Überfahren einer inaktiven Karte:** `cursor: pointer`; Karte höchstens 3 px
nach oben; Schatten etwas stärker; feiner Navy-Rahmen blendet ein; zugehörige
Verbindungslinie leicht hervorgehoben; **keine** vollständige Icon-Animation.
Nach `mouseleave` zurück in den vorherigen Zustand.

**Klick auf eine Karte:** bisher aktive deaktivieren, angeklickte aktivieren,
aktive Verbindungslinie wechselt mit, Inhalt des Erklärfelds tauschen,
zugehörige Micro-Animation **einmal**, aktiver Navigationseintrag wechselt.
Kein Layoutsprung, keine Änderung der Scrollposition, immer nur **eine** Karte
aktiv. Keine automatisch wechselnden Karten, keine Dauerläufe.

## Festes Erklärfeld

Direkt **unter** der Vier-Kräfte-Grafik und **über** der unteren Navigation.
Auf dem Desktop immer sichtbar, immer dieselbe Höhe, wird nie geöffnet oder
geschlossen, tauscht nur den Inhalt. Kein Tooltip, kein Modal, überlagert
nichts, verschiebt beim Wechsel nichts. Bestehende Estera-Gestaltung.

Aufbau: **links** das vorhandene Icon des aktiven Faktors · **Mitte** Nummer und
Faktor, Headline, Erklärungstext · **rechts** die Kernaussage im bereits
vorgesehenen, dezent abgesetzten Bereich.

**Maximale Höhe 180 px.**

Inhaltswechsel: alten Inhalt in ~180 ms aus, neuen in ~220 ms ein;
ausschließlich `opacity` und höchstens 6 px `translateY`; **keine**
Größenanimation des Feldes.

## Wording — final

### 01 · BANKKAPITAL
- Headline: **Deine Bonität macht den Kauf möglich.**
- Text: **Deine Bonität eröffnet dir den Zugang zu Bankkapital. So kannst du heute in einen vollständigen Sachwert investieren, statt den Kaufpreis erst jahrelang anzusparen.**
- Kernaussage: **Du startest direkt mit einer vollständigen Immobilie.**
- **Nicht ergänzen:** kein Hinweis auf einen kleineren eigenen Einsatz, kein Text zu Eigenkapital, keine zusätzlichen Erklärungen.

### 02 · MIETE
- Headline: **Dein Mieter trägt jeden Monat mit.**
- Text: **Die Mieteinnahmen decken einen wesentlichen Teil der laufenden Finanzierung.**
- Kernaussage: **Monat für Monat fließt Geld in deinen Vermögensaufbau.**
- **Nicht ergänzen:** kein Satz darüber, dass sich der eigene Beitrag reduziert; keine weiteren Einschränkungen; keine zusätzlichen Erklärungen.

### 03 · STEUERVORTEILE
- Headline: **Deine Immobilie kann deine Steuerlast reduzieren.**
- Text: **Abschreibung, Finanzierungszinsen und bestimmte Aufwendungen können steuerlich berücksichtigt werden.**
- Kernaussage: **So kann dir mehr Netto vom Brutto bleiben.**
- **Nicht ergänzen:** kein Satz zur persönlichen Situation, kein Satz zur Abhängigkeit vom Objekt, keine weiteren Absätze im Erklärfeld.

### 04 · WERTENTWICKLUNG
- Headline: **Tilgung und Wertentwicklung bauen Vermögen auf.**
- Text: **Mit jeder Tilgung sinkt die Restschuld und dein Eigentumsanteil wächst. Die langfristige Wertentwicklung des Sachwerts verstärkt diesen Vermögensaufbau zusätzlich.**
- Kernaussage: **Dein Eigentum wächst – Jahr für Jahr.**
- **Nicht ergänzen:** kein Hinweis „Chance, keine Garantie"; keine zusätzlichen Einschränkungen; keine weiteren Erklärungen.

## Micro-Animationen

Alle laufen **einmal je Aktivierung**. Keine Endlosschleife, kein Springen.
Nach jeder folgt **einmal** ein dezenter Impuls entlang der bestehenden
Verbindungslinie zur Immobilie.

**Bankkapital** — Bankgrafik unverändert, nur ihr Wrapper wird animiert: hebt
sich höchstens 4 px, leichte räumliche Drehung, kehrt exakt in die
Ausgangsposition zurück. `rotateY` 0 → −8 → 6 → 0 Grad, höchstens
`rotateX(2deg)`, `scale` 1 → 1.04 → 1, Perspektive am Wrapper, 650–800 ms,
weiches `ease-out`.

**Miete** — der vorhandene Schlüssel bewegt sich, als öffne er ein unsichtbares
Schloss. **Keine Tür, kein Schloss, keine neue Grafik ergänzen.**
Transformationspunkt am Schlüsselkopf, `rotate` 0 → −8 → 16 → −4 → 0 Grad,
waagerechte Bewegung höchstens 3 px, `scale` 1 → 1.03 → 1, 600–750 ms.

**Steuervorteile** — vorhandene Steuergrafik weiterverwenden. Im animierten
Bereich eine gut sichtbare Prozentzahl: Start **42 %**, zählt in ganzen Schritten
herunter (42, 41, 40 …) bis **21 %**. 1000–1200 ms, ganze Zahlen, keine
Dezimalstellen, jeder Wert lesbar aktualisiert. Farbe dezent von Navy zum
vorhandenen gedeckten Grün. Bei erneuter Aktivierung wieder bei 42 % beginnen.
Kein Casino-, Tacho- oder Slot-Machine-Effekt. Unter der Zahl klein:
**„Beispielhafte Darstellung"** — gehört ausschließlich zur Prozentanimation und
darf das Erklärfeld nicht vergrößern.

**Wertentwicklung** — bestehendes Icon. Erst die kleinste Säule wachsen, dann
die mittlere, dann die größte; danach zeichnet sich die vorhandene aufsteigende
Linie; der Pfeil bewegt sich am Ende einmal höchstens 5 px nach oben und kommt
zur Ruhe. Säulen über `scaleY`, `transform-origin: bottom`, von ~`scaleY(0.35)`
auf `scaleY(1)`, ~90 ms Verzögerung zwischen den Säulen; SVG-Linie nach
Möglichkeit über `stroke-dasharray`/`stroke-dashoffset`; 750–950 ms.

## Verbindungslinien

Verlauf und Position bleiben. Ergänzt wird nur ein **aktiver Zustand**: aktive
Linie etwas kräftiger, bestehender Goldpunkt leuchtet einmal dezent auf, ein
kleiner Lichtimpuls läuft einmal von der aktiven Karte zur Immobilie, danach
bleibt die Linie ruhig. Keine Partikel, kein Neon, kein Dauerpulsieren.

## Untere Navigation

Position bleibt. **Nur** der erste Begriff ändert sich: „01 BANK" → **„01
BANKKAPITAL"**. Vollständig: 01 BANKKAPITAL · 02 MIETE · 03 STEUERN ·
04 WERTENTWICKLUNG. Alle vier klickbar; ein Klick erzeugt exakt denselben
Zustand wie ein Klick auf die Karte. Bankkapital standardmäßig aktiv.
Position, Abstände, Typografie, Farben, Nummerngestaltung und
Unterstreichungsstil bleiben.

## Responsiv

**Ab 1024 px:** Kartenpositionen unverändert, festes Erklärfeld unter der
Grafik, untere Navigation bleibt.

**Bis 767 px:** vorhandenen mobilen Stil und die bestehenden Abstände behalten;
die vier Faktoren in derselben Reihenfolge; Bankkapital standardmäßig geöffnet;
beim Tippen öffnet sich der Erklärungstext unmittelbar **in** der zugehörigen
Karte; immer nur eine offen; dieselben Texte; dieselben Micro-Animationen einmal
je Aktivierung; keine Desktop-Verbindungslinien erzwingen; keine neuen Farben
oder Gestaltungselemente. Vorhandene Akkordeon-Komponente verwenden, falls es
eine gibt — sonst lokal in dieser Section lösen, **kein** neues globales System.

## Barrierefreiheit

Karten als echte Knöpfe oder semantisch korrekte Tabs; Navigation ebenfalls
tastaturbedienbar; Enter und Leertaste; sichtbarer bestehender Fokuszustand;
aktiver Zustand über `aria-selected` / `aria-pressed` oder Tab-Semantik;
Erklärfeld über `aria-controls` beziehungsweise Tabpanel-Semantik verbunden;
Information nie allein über Farbe.

Bei `prefers-reduced-motion: reduce`: keine Dreh-, Schlüssel-, Zähl- oder
Wachstumsanimation; nur ein kurzer Inhalts-Fade; Interaktion und Texte
vollständig erhalten.

## Grenzen

Keine neue Abhängigkeit · keine Assets ersetzen · keine globalen Styles ändern ·
keine unbeteiligten Dateien formatieren · keine unbeteiligten Komponenten
refaktorieren · keine Texte außerhalb der genannten Stellen ändern · keine
Section verschieben · keine neuen Marketingaussagen · keine neue visuelle
Richtung · keine Änderungen „zur Verbesserung", die nicht verlangt wurden.

Ist eine Animation mit dem vorhandenen Asset technisch nicht exakt möglich: die
nächstmögliche CSS-Transform-Animation am vorhandenen Wrapper verwenden, das
Asset **nicht** ersetzen.

## Validierung

1. Bankkapital beim ersten Laden aktiv · 2. dessen Erklärfeld sichtbar ·
3. alle Karten an ihren Positionen · 4. alle vier Karten klickbar · 5. alle vier
Navigationseinträge klickbar · 6. „01 BANKKAPITAL" vollständig geschrieben ·
7. jede Animation läuft nur einmal je Aktivierung · 8. Erklärfeld behält die
Höhe · 9. keine Layoutsprünge · 10. obere Vergleichssection unverändert ·
11. andere Bereiche unverändert · 12. Desktop und Telefon funktionieren ·
13. Tastaturbedienung funktioniert · 14. `prefers-reduced-motion` funktioniert ·
15. bestehender Build läuft fehlerfrei.

Danach ausschließlich die vorhandenen Prüfungen ausführen (Typecheck, Lint,
Tests, Build). **Keine Regeln oder Konfigurationen ändern, damit Prüfungen
bestehen.**

## Abschlussbericht

1. tatsächlich veränderte Dateien · 2. kurze Zusammenfassung der Interaktionen ·
3. ausgeführte Prüfungen und Ergebnis · 4. mögliche Einschränkungen der
vorhandenen Bildassets.
