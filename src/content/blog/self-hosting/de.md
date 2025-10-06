---
title: "Tilly selbst hosten"
description: "Eine vollständige Anleitung zum Hosten deiner eigenen Tilly-Instanz mit voller Kontrolle über deine Daten und Infrastruktur"
pubDate: "15. Januar 2025"
tags: ["technical"]
---

Tilly ist Open Source, weil ich glaube, dass persönliche Software wie diese deine Daten nicht als Geisel nehmen sollte. Ich finde auch, dass Tilly sich richtig gut anfühlt, und möchte zeigen, wie einfach es ist, eine eigene Instanz zu betreiben und deine Daten zu migrieren.

## Warum selbst hosten?

Du möchtest Tilly vielleicht selbst hosten, weil:

- **Es passt in kostenlose Tarife**: Vercel, Clerk und Gemini haben großzügige kostenlose Tarife, die für den persönlichen Gebrauch ausreichen
- **Du lernen möchtest**: Sieh, wie einfach es sein kann, eine moderne Web-App zu deployen
- **Du die Kontrolle haben willst**: Betreibe Tilly nach deinen Regeln, auf deiner Infrastruktur
- **Du es anpassen möchtest**: Passe Tilly nur für dich an, z.B. passe `index.css` an, um einen anderen Style zu bekommen (Tilly basiert auf shadcn/ui)

## Aber meine Daten?

Tilly hat sowohl Datenimport als auch -export via JSON (in den Einstellungen). Du kannst:

- Von der offiziellen Instanz exportieren und deine Daten in der Entwicklung oder deinem eigenen Deployment nutzen (ich nutze das selbst zum Debuggen)
- Deine Daten jederzeit zwischen Instanzen verschieben
- Jederzeit zur offiziellen Version zurückkommen

Kein Lock-in, niemals.

## Was du brauchst

Um Tilly genau so zu deployen wie ich, brauchst du:

- **GitHub-Account** - Um das Repository zu forken
- **Vercel-Account** - Für das Deployment, du kannst auch andere Plattformen nutzen. Viele unterstützen Astro. Vercel ist das, was ich nutze.
- **Clerk-Account** - Für die Authentifizierung (ich nutze Clerk auch für Zahlungen, aber Zahlungen können per Umgebungsvariable deaktiviert werden)
- **Google Cloud Account** - Für den Gemini AI API-Schlüssel
- **Jazz Cloud Account** - Für verschlüsselten Sync-Speicher
- **Eine Domain** - Oder Subdomain für deine Instanz

Tilly ist ein einzelnes Astro-Projekt mit allem an einem Ort, was es einfach macht zu verstehen und zu deployen. Alle diese Services haben kostenlose Tarife, die für den persönlichen Gebrauch mehr als ausreichend sind.

## Deployment-Schritte

### 1. Repository forken

Gehe zu [github.com/ccssmnn/tilly](https://github.com/ccssmnn/tilly) und forke das Repository zu deinem Account.

### 2. Clerk einrichten

1. Erstelle einen kostenlosen Account auf [clerk.com](https://clerk.com)
2. Erstelle eine neue Anwendung und konfiguriere sie für deine Domain/Subdomain
3. Hole dir deine API-Schlüssel (öffentlich und geheim)

### 3. Google Gemini API-Schlüssel besorgen

1. Erstelle einen Google Cloud Account, falls du noch keinen hast
2. Besuche [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Erstelle einen Gemini API-Schlüssel

### 4. Jazz Cloud einrichten

1. Melde dich auf [jazz.tools](https://jazz.tools) an
2. Erstelle ein neues Projekt
3. Hole dir deine Sync-Server-URL und Worker-Zugangsdaten

### 5. Auf Vercel deployen

1. Erstelle einen Vercel-Account
2. Erstelle ein neues Projekt und importiere dein geforktes Repository
3. Füge alle Umgebungsvariablen hinzu (siehe `.env.example` oder die Astro-Config-Datei für alle benötigten Variablen):
   - Clerk-Schlüssel
   - Google Gemini API-Schlüssel
   - Jazz Cloud-Zugangsdaten
   - VAPID-Schlüssel für Push-Benachrichtigungen (generiere mit `npx web-push generate-vapid-keys`)
   - Setze `PUBLIC_ENABLE_PAYWALL=false`, um Abo-Prüfungen in der UI und auf dem Server zu überspringen
   - Konfiguriere `WEEKLY_BUDGET` und AI-Token-Kosten nach deinen Vorlieben

Wöchentliche Nutzungslimits werden durchgesetzt, aber die Abo-Prüfung wird übersprungen, wenn die Paywall deaktiviert ist.

### 6. Domain konfigurieren

Richte deine Domain oder Subdomain in den Vercel-Projekteinstellungen ein.

### 7. Deployen

Drücke auf Deploy! Vercel wird deine Tilly-Instanz bauen und deployen.

### 8. (Optional) Daten importieren

Falls du die offizielle Tilly-Instanz nutzt, kannst du alle deine Daten als JSON exportieren und in deine selbst gehostete Instanz importieren. Das funktioniert in beide Richtungen—du kannst deine Daten jederzeit zurückverschieben, wenn nötig.

## Bonus: Website überspringen

Falls du nicht auf den Marketing- oder Blog-Seiten landen möchtest, wenn du deine Instanz besuchst, kannst du die `vercel.json` konfigurieren, um Traffic weiterzuleiten. Standardmäßig serviert Vercel alles, aber du kannst es so konfigurieren, dass nur die PWA (`/app`) und API-Routen (`/api`) bedient werden.

Schau dir die `vercel.json`-Datei im Repository an, um die aktuelle Konfiguration zu sehen und passe die Rewrites bei Bedarf an.

---

Das war's! Du hast jetzt deine eigene Tilly-Instanz mit voller Kontrolle über deine Daten. Das gesamte Setup dauert vielleicht 30 Minuten, und du kannst deine Daten jederzeit zwischen Instanzen verschieben per JSON-Export/Import.

Tilly selbst zu hosten ist wirklich einfach, und ich möchte es so halten. Falls du auf Probleme stößt, öffne ein Issue auf [GitHub](https://github.com/ccssmnn/tilly)—ich helfe gerne weiter.
