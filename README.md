# S-Bahn Werkstatt Tool

Ein Werkstatt-Management-Tool für S-Bahn Werkstätten. Materialverwaltung, Fehlermeldungen und Fahrzeuginformationen.

## Features

- 📦 **Materialverwaltung** - Material suchen, filtern und verwalten
- 🔴 **Fehlermeldungen** - Fahrzeugfehler erfassen und verfolgen
- 🚆 **Fahrzeuginfo** - Übersicht über Baureihen 423, 425, 430
- 📝 **Notizen** - Gemeinsame Notizen für das Team
- 📊 **Barcode-Generator** - SAP-Nummern als Barcodes anzeigen
- 🔐 **Berechtigungen** - Rollenbasierte Zugriffssteuerung

## Tech Stack

- Vanilla JavaScript (kein Framework)
- Supabase Backend (PostgreSQL + Auth)
- Dark Mode UI (für Werkstatt optimiert)
- Mobile-first Responsive Design

## Deployment

### Vercel (empfohlen)
```bash
vercel --prod
```

### Manuelles Deployment
Einfach die statischen Dateien auf einen beliebigen Webserver kopieren.

## GitHub Repository

https://github.com/larsdanielowski-svg/sbahn-werkstatt-tool

## Auto-Deployment einrichten

1. Öffne https://vercel.com/dashboard
2. Wähle das `sbahn-werkstatt-tool` Projekt
3. Gehe zu **Settings** → **Git**
4. Klicke auf **Connect Git Repository**
5. Wähle `larsdanielowski-svg/sbahn-werkstatt-tool`
6. Production Branch: `main`

## Lokale Entwicklung

```bash
# Live-Server starten
npx live-server --port=3000

# Oder Python
python3 -m http.server 3000
```

## Supabase Schema

Siehe `supabase_schema.sql` für die Datenbankstruktur.

## Berechtigungen

| Rolle | Berechtigungen |
|-------|---------------|
| admin | Alles |
| user + edit | Erstellen, Bearbeiten, Löschen (eigene Einträge) |
| user + create | Erstellen (nur eigene Einträge bearbeiten) |
| user | Nur Lesen |

## License

MIT
