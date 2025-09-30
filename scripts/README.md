# Mock Data Generation

This directory contains scripts and resources for generating realistic mock data for the Tilly app.

## Structure

- `data/mock-data-template.json` - Static template with realistic data and timestamp placeholders
- `data/avatars/` - Collection of avatar images from Unsplash
- `process-mock-data.js` - Script that processes the template to generate final mock data
- `mock-data.json` - Generated output file ready for import

## Usage

1. Run the processing script:

   ```bash
   node scripts/process-mock-data.js
   ```

2. Import the generated `scripts/mock-data.json` through the app's data import feature

## How It Works

The script processes the template file and:

- Converts timestamp placeholders to actual dates relative to `new Date()`:
  - `"TODAY"` → current date/time
  - `"DAYS_AGO:-7"` → 7 days ago
  - `"DAYS_FROM_NOW:3"` → 3 days from now
- Converts avatar file references to dataURL format:
  - `"avatar1.jpg"` → `{"dataURL": "data:image/jpeg;base64,..."}`

## Data Included

- **15 people** with realistic names, relationships, and backgrounds
- **43 notes** including pinned important facts and detailed journal entries
- **26 reminders** with various states (due, future, completed, deleted)
- **12 diverse avatars** from Unsplash
- **1 deleted person** for testing deletion functionality

The generated data includes:

- Due reminders for testing notification systems
- Completed reminders to show task history
- Deleted items (soft and permanent deletion)
- Realistic relationship dynamics and life updates
- Proper timestamp distribution for development scenarios

## Customization

To modify the data:

1. Edit `data/mock-data-template.json` directly
2. Add more avatars to `data/avatars/`
3. Run the script to regenerate `mock-data.json`

The timestamp syntax makes it easy to create realistic data scenarios without manually calculating dates.
