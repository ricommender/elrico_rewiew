# ELRICO – Website-Vorschau

Öffentliche Vorschau der Webseite für **elrico.de**. Das unveränderte Logo **FINAL Version 1.0** wird aus `logo/elrico-final.svg` eingebunden.

## GitHub Pages aktivieren

1. Öffne [Settings → Pages](https://github.com/ricommender/elrico_rewiew/settings/pages).
2. Wähle unter **Build and deployment → Source** die Option **GitHub Actions**.
3. Starte auf [Actions → Publish elrico preview](https://github.com/ricommender/elrico_rewiew/actions/workflows/deploy-pages.yml) den Workflow über **Run workflow**.
4. Prüfe anschließend die Vorschau unter https://ricommender.github.io/elrico_rewiew/ .

Die Testseite ist öffentlich und mit `noindex` gekennzeichnet. Das private Entwicklungsrepository bleibt getrennt.

## Preview v1.1

- Animiertes Logo-Intro mit rotem Cut/Scan, drei Phasen **IDEE → KI → CODE**, Skip und Replay.
- Neue Einblendungen für Hero und Leistungsbereiche, Fortschrittsbalken und animierte Mikrointeraktionen.
- Respektiert `prefers-reduced-motion` und lässt das Original-Logo FINAL v1.0 unverändert.
- Die Vorschau nutzt nur statische Dateien und lädt keine externen Tracking-Skripte.

## Website Intro — Cinematic Preview 1.2

- **Film:** `assets/elrico-orb-intro.mp4` – 5 Sekunden, bei Magnific mit Kling 3.0 erzeugt: 3D-artige Drehung des metallischen ELRICO-Emblems vor rot pulsierendem Orb.
- **Metalllogo:** `assets/elrico-metallic.png` – freigestellte, silber-rote Logo-Variante ohne weißen Hintergrund.
- **Darstellung:** Video im Intro mit CSS-Orb/3D-Fallback; Skip und Replay vorhanden. Die Hauptseite zeigt das metallische Logo frei vor dem Orb.
- **Originalmarke:** `logo/elrico-final.svg` bleibt unverändert; das private Original-Repository `ricommender/elrico` bleibt Referenz.
- **Performance / Bedienung:** Film stumm, auf Mobilgeräten `playsinline`; bei reduzierter Bewegung wird das Intro übersprungen.

Live-Test: https://ricommender.github.io/elrico_rewiew/
