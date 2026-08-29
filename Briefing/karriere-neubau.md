# Karriere — Neubau nach zwei Vorlagen

Auftrag vom 29.08.2026. **Der bisherige Stand von `karriere.html` kommt
vollständig raus** und wird ersetzt. Der alte Aufbau ist über den Commit
`b704be4` und die Sicherung im Kladdeordner jederzeit zurückholbar.

## Zwei Vorlagen, zwei Ebenen

| | Vorlage | betrifft |
|---|---|---|
| Übersichtsseite | `https://wiesedental.de/karriereseite` | `karriere.html` |
| Stellenseite | `https://estateanfrage-karriere.de/immobilienberater` | zwei neue Unterseiten |

Die Bauaufnahmen liegen in `<kladde>/wiese/bericht.md` und
`<kladde>/estate/bericht.md`, die Aufnahmen daneben unter `shots/`.

**Übernommen wird:** Anordnung, Größenverhältnisse, Abstände, Reihenfolge,
jede Bewegung.
**Nicht übernommen:** Schrift (Cormorant), Farben (Navy, Creme, Gold, Sand),
**kein Wort Text**. Die Namen Wiesedental und Estateanfrage tauchen nirgends
auf, ebenso wenig deren Personen- und Kundennamen.

## Der Kopfbereich

Die Vorlage stapelt mittig, in dieser Reihenfolge, über bildschirmfüllendem
Video mit kräftigem dunklem Schleier:

1. Bildmarke
2. fünf Sterne
3. kleine Kennzeile in Versalien auf einer Pille
4. große Überschrift
5. eine Reihe grauer Partnerlogos

Bei uns:

| Stelle | Inhalt |
|---|---|
| Bildmarke | **Estera** als Wortmarke, im Schnitt der Website |
| Sterne | fünf, in Sand |
| Kennzeile | **BAUE DIR ETWAS EIGENES AUF** |
| Überschrift | **Starte deine Karriere bei Estera** |
| Logoreihe | **entfällt** — ausdrücklich, vorerst |

Knöpfe stehen im Kopfbereich der Vorlage **nicht**; wir setzen dort auch
keine.

### Das Video

`assets/video/kar-hero.webm` (4,2 MB) und `kar-hero.mp4` (6,1 MB),
Standbild `kar-hero-poster.jpg`. 1920 × 1080, 24 Bilder/s, 9,25 s.

**Spielt von selbst ab** — `autoplay muted loop playsinline preload="auto"`,
kein Bedienfeld, kein Klick. Genau wie die Vorlage, die ebenfalls stumm und
in Schleife läuft (dort 1920 × 1080, 32,96 s).

Der Schnitt ist als **nahtlose Schleife** gebaut: die letzten 0,8 s blenden
in die ersten 0,8 s über, deshalb 9,25 s statt 10 s. An der Nahtstelle gibt
es keinen Sprung.

Erzeugt über kie.ai mit `kling-3.0/video` im Modus `pro`. Gewählt wurde von
drei Fassungen die durchgehende Kamerafahrt: außen am Glasturm herab, unter
dem Vordach hindurch, hinein in das Großraumbüro an den Schreibtischreihen
vorbei. **Auf keinem Bild ist ein Mensch zu sehen** — geprüft an Einzelbildern
im Sekundentakt über die volle Länge. Die beiden verworfenen Fassungen liegen
unter `Bilder/video-entwuerfe/` (nicht versioniert).

## Der zweite Abschnitt

Vorlage: Bogen mit Bildmarke, Pille **KURZE VORSTELLUNG**, Überschrift
„Wer ist … ?" zweifarbig, darunter zwei mittig gesetzte Absätze in schmalem
Satzspiegel.

**Der Bogen entfällt** — ausdrücklich. Alles übrige bleibt in Anordnung und
Schriftgrößen wie die Vorlage.

Überschrift: **Wer ist Estera?**

Der Text ist **Platzhalter** und im Markup als solcher vermerkt. Er ist nicht
frei erfunden, sondern aus bereits freigegebenen Sätzen der Website
zusammengesetzt, damit nichts Neues behauptet wird:

> Estera begleitet Menschen beim Aufbau von Eigentum — von der Auswahl der
> Immobilie über die passende Finanzierung bis zur Betreuung nach dem
> Notartermin. Wir arbeiten mit ausgewählten Objekten, klaren Prozessen und
> einem Ansprechpartner, der bleibt.
>
> Unser Anspruch ist keine schnelle Vermittlung, sondern eine Entscheidung,
> die in zehn Jahren noch trägt.

## Der dritte Abschnitt — Deine Karriere, unser Angebot

Vorlage: vier Karten nebeneinander. Je Karte von oben nach unten: Bild mit
weichen Ecken, Beschäftigungsart klein und grau, Stellenbezeichnung fett,
Zeile „Bereiche: …" klein und grau, dann **zwei** Knöpfe über die volle
Kartenbreite — oben gefüllt **Jetzt bewerben**, darunter mit Umriss
**Mehr erfahren**.

Bei uns **zwei** Karten, entsprechend breiter, gleicher innerer Aufbau:

| | Karte 1 | Karte 2 |
|---|---|---|
| Art | Vollzeit (m/w/d) | Vollzeit (m/w/d) |
| Bezeichnung | **Immobilienberater** | **Back-Office-Manager** |
| Bereiche | Vertrieb, Kapitalanlagen | Immobilienabwicklung, After Sales |
| Bild | Platzhalter, erzeugt | `assets/img/karriere/stelle-backoffice.*` |
| Jetzt bewerben | `kontakt.html` | `kontakt.html` |
| Mehr erfahren | `karriere-immobilienberater.html` | `karriere-backoffice.html` |

Das Bild für Karte 2 stammt vom Kunden (`Bilder/IMG_8954.PNG`), von den
schwarzen Balken befreit: 1206 × 1506, Verhältnis 4:5.

**Karte 1 trägt vorerst ein Platzhalterbild ohne Gesicht.** Ein Gesicht zu
erzeugen hieße, eine Person zu erfinden, die es nicht gibt — auf einer
Stellenseite ist das heikel. Sobald es eine echte Aufnahme gibt, wird sie
getauscht.

## Die zwei Stellenseiten

Aufbau 1:1 nach `estateanfrage-karriere.de/immobilienberater`, in der
Reihenfolge, die die Bauaufnahme belegt — nach Beschreibung des Kunden:

1. Kopfbereich mit **demselben Video**, darüber **Wir suchen dich** und die
   Stellenbezeichnung
2. **Was wir bieten**
3. eine durchlaufende Bilderreihe
4. ein Abschnitt in Richtung **Das macht dich aus**
5. wieder eine Bilderreihe
6. **Das erwartet dich** und der Abschluss

Der Inhalt der Seite **Immobilienberater** steht wörtlich im Wording-Master,
siehe [karriereseite.md](karriereseite.md), Abschnitte 12 bis 18.

**Für den Back-Office-Manager gibt es im Master keinen Inhalt.** Der Text
dieser Seite ist deshalb durchgehend **Platzhalter** und im Markup als solcher
vermerkt. Keine Zahl, keine Voraussetzung und keine Zusage darin ist von
Estera bestätigt.

## Harte Grenzen

- **Keine erfundene Zahl** — kein Gehalt, keine Provision, keine Quote, keine
  Mitarbeiterzahl, kein Jahr.
- Verbotene Wörter: garantiert, risikofrei, krisensicher, sichere Rendite,
  maximale Rendite, garantierte Wertsteigerung.
- Anrede **Du**. Kein Schwarz — Navy.
- **Kopfleiste und Fußbereich bleiben unverändert**, wie auf allen Seiten.
- Der Sandknopf `.btn--sand` trägt weiße Schrift auf Sand und misst 1,94:1 —
  auf diesen Seiten **nicht** einsetzbar.
- Ohne Javascript und bei `prefers-reduced-motion: reduce` muss alles lesbar
  und bedienbar sein. Bei `reduce` steht das Video still und zeigt das
  Standbild.

## Offen, vom Kunden zu entscheiden

- Die Logoreihe im Kopfbereich fehlt bewusst. Kommen Partnerlogos dazu,
  braucht jedes eine schriftliche Freigabe.
- Das Platzhalterbild der Karte „Immobilienberater".
- Der gesamte Text der Back-Office-Seite.
- Die Vorstellung im zweiten Abschnitt.
