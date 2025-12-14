---
layout: ../../www/layouts/LegalPageLayout.astro
title: "Datenschutzerklärung"
description: "Datenschutzerklärung und Informationen zum Datenschutz für Tilly-Nutzer."
locale: "de"
---

# Datenschutzerklärung

_Stand: 1. September 2025_

## Verantwortlicher

Carl Assmann - ccssmnn  
Muellritterstr. 10  
80995 München  
Deutschland  
E-Mail: assmann@hey.com

## Von Tilly verarbeitete Daten

### Benutzereingaben

- Persönliche Informationen, die du zu Tilly hinzufügst (Namen, Beziehungen, Notizen, Erinnerungen)
- Daten werden in deinem Browser verschlüsselt, bevor sie mit Jazz Cloud synchronisiert werden
- Verschlüsselungsschlüssel werden mit deinen Authentifizierungsdaten gespeichert, damit der Tilly-Server:
  - Erinnerungen entschlüsseln kann, um Push-Benachrichtigungen zu versenden
  - Chat-Inhalte verarbeiten und an Google für die Tilly-Chat-Funktionen weitergeben kann

### Authentifizierungsdaten

- Authentifizierungsmethode und Sitzungsinformationen, gespeichert von **Clerk**
- Verschlüsselungsschlüssel in Clerk gespeichert, um Zugang von neuen Geräten zu ermöglichen
- Tilly sammelt keine persönlichen Daten für Analysezwecke

### Zahlungsdaten

- Zahlungsabwicklung durch **Stripe**
- Tilly speichert deine Zahlungskartendaten nicht

## Drittanbieter-Dienste

### Clerk (Authentifizierung)

- Verarbeitet Authentifizierung und speichert Verschlüsselungsschlüssel
- Datenschutzerklärung: https://clerk.com/privacy

### Stripe (Zahlungen)

- Verarbeitet Abonnementzahlungen
- Datenschutzerklärung: https://stripe.com/privacy

### Jazz Cloud (Datenspeicherung)

- Speichert deine verschlüsselten Beziehungsdaten
- Erhält ausschließlich Chiffren; die Entschlüsselung erfolgt auf Tilly-Servern mithilfe der von Clerk bereitgestellten Schlüssel, wenn dies für Funktionsumfang erforderlich ist

### Google Gemini (KI-Dienste)

- Verarbeitet Chat-Inhalte und Tool-Ergebnisse, die über Tilly-Server gesendet werden
- Daten werden nur gesendet, wenn du aktiv Tilly Chat-Funktionen nutzt
- Datenschutzerklärung: https://policies.google.com/privacy

## Rechtsgrundlage (DSGVO Artikel 6)

- **Vertragserfüllung** (Artikel 6(1)(b)): Bereitstellung von Tilly-Diensten
- **Berechtigte Interessen** (Artikel 6(1)(f)): Serviceverbesserung und Sicherheit

## Datenspeicherung

- Daten werden gespeichert, bis du dein Konto löschst
- Kontolöschung entfernt alle Daten und Verschlüsselungsschlüssel
- Backups werden automatisch innerhalb von 30 Tagen gelöscht

## Deine Rechte (DSGVO)

- **Zugriff** auf deine Daten jederzeit mit dem kostenlosen Tarif und Herunterladen deiner Daten
- **Berichtigung** unrichtiger Daten durch direktes Bearbeiten in Tilly
- **Löschung** deines Kontos und aller Daten durch Löschen deines Kontos über das Konto-Dashboard. Dies löscht die gespeicherten Verschlüsselungsschlüssel und macht deine Daten unzugänglich
- **Export** deiner Daten über das Einstellungsmenü jederzeit. Du kannst deine Daten dort auch importieren
- **Widerspruch** gegen die Verarbeitung durch Export deiner Daten und Löschen deines Kontos (da Tilly nicht ohne Verarbeitung deiner Beziehungsdaten funktionieren kann)
- **Einwilligung widerrufen** jederzeit durch Export deiner Daten und Löschen deines Kontos

## Datensicherheit

- Client-seitige Verschlüsselung mit Schlüsseln, die über Clerk für Mehrgeräte-Zugriff verwaltet werden; Tilly-Server greifen nur für Benachrichtigungen und KI-Funktionen auf entschlüsselte Daten zu
- Branchenübliche Sicherheitsmaßnahmen
- Regelmäßige Sicherheitsupdates

## Datenverarbeitungsorte

- **Push-Benachrichtigungen und Tilly Chat**: Verarbeitung in Deutschland; entschlüsselte Daten werden nur für die Dauer dieser Vorgänge genutzt
- **Verschlüsselte Synchronisationsdaten**: Gespeichert im Jazz-Cloud-Knoten mit der geringsten Latenz zu deinem Standort
- **Drittanbieter-Dienste**: Können Daten außerhalb der EU mit angemessenen Schutzmaßnahmen verarbeiten

## Cookies

Tilly verwendet nur wesentliche Cookies für die Authentifizierung. Es werden keine Tracking- oder Analyse-Cookies verwendet.

## Datenschutzbeauftragter

Carl Assmann  
Muellritterstr. 10  
80995 München  
Deutschland  
E-Mail: assmann@hey.com

## Kontakt

Für Datenschutzfragen oder zur Ausübung deiner Rechte:  
**E-Mail:** assmann@hey.com

## Aufsichtsbehörde

Du kannst Beschwerden beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA) einreichen.
