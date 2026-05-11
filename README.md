# Cycle Tracker - Natural Family Planning

Cycle Tracker is a privacy-first, offline-capable Progressive Web App (PWA) designed to help users track their fertility using the Symptothermal Method of Natural Family Planning (NFP).

## Features

- **Daily Logging**: Track your daily signs with evening assessment guidance:
  - **Bleeding**: Unknown, None, Spotting, Light, Medium, Heavy.
  - **Basal Body Temperature (BBT)**: Record your daily waking temperature to confirm ovulation.
  - **Cervical Mucus (assess after 5pm)**: Track what you observe (see) and feel (sensation). Log None/Dry, Cloudy/Damp, or Clear/Slippery.
- **Goal Setting**: Choose whether you're trying to **Avoid Pregnancy** or **Conceive**. The app provides concise sex recommendations based on your goal and current fertility status.
- **Fertility Insights with Color Coding**:
  - **Green** - High Fertility (peak mucus or within 3-day window)
  - **Amber** - Potentially Fertile (non-peak mucus, pre-ovulation, or bleeding)
  - **Blue** - Low Fertility (dry days confirmed or post-ovulation)
  - **Orange** - Menstruation (days 1-5)
- **STM-Compliant Rules**:
  - **3-Day Rule**: Fertile window stays open for 3 days after last fertile mucus.
  - **Dry Day Rules**: Requires 3+ consecutive dry days for low fertility (unknown mucus breaks the streak).
  - **Doering Rule**: Uses your shortest past cycle to estimate earliest possible ovulation and applies a conservative cutoff.
  - **Ovulation Confirmation**: 3-over-6 temperature shift rule (0.2°C rise over previous 6-day high).
- **Cycle Overview Stats**: At-a-glance stats including cycle day, phase, average cycle length, shortest cycle, predicted next period, and ovulation status.
- **Quick Navigation**: Tap the date display to jump back to today instantly.
- **Offline First**: Works entirely offline once installed. Your data stays on your device.
- **Data Backup**: Export cycle data and goal settings as JSON, import back anytime.
- **Modern UI**: Responsive, mobile-first design with smooth interactions.

## How It Works

The app applies standard Symptothermal rules with conservative safety margins:
- **New Cycle**: Begins on the first day of full bleeding (Light, Medium, or Heavy).
- **Fertile Window**: Opens when fertile mucus is observed (Cloudy/Damp or Clear/Slippery).
- **3-Day Rule**: The fertile window remains open for 3 full days after the last observation of fertile mucus.
- **Dry Day Rules**: Pre-ovulation low fertility requires 3 consecutive dry days after your period ends, with no fertile mucus in the last 5 days. The Doering Rule (shortest cycle - 20) further restricts early-cycle assumptions.
- **Evening Assessment**: Cervical mucus should be assessed after 5pm for the most accurate daily reading.
- **Ovulation Confirmation**: Identified by a temperature shift (3 consecutive days of BBT that are at least 0.2°C higher than the highest of the previous 6 days).

## Running Locally

Because this is a static web app, no build step or package manager is required. However, to utilize local storage and PWA features, it should sit behind a local server rather than being opened directly as a `file://` URL.

1. Clone or download the repository.
2. Open your terminal in the project directory.
3. Run a simple local server. For example:
   - Using PowerShell: `.\server.ps1`
   - Using Python: `python -m http.server 8000`
   - Using Node.js: `npx serve .`
4. Open your browser and navigate to the provided local URL (e.g., `http://localhost:8000`).

## Installation (PWA)

To install Cycle Tracker on your device:
1. Open the app in your browser (like Chrome or Safari).
2. Look for the "Install" or "Add to Home Screen" prompt in your browser's menu (or URL bar).
3. Follow the steps to install. It will now appear as a native app on your phone or desktop and work offline.

## Technologies Used

- HTML5
- CSS3 (Vanilla)
- JavaScript (Vanilla, ES6)
- Service Workers & Web App Manifest (PWA)

## Privacy Protocol

This app does not send any of your health or logging data to external servers. Everything is saved locally on your device within your browser's storage. You are in full control of your data backups via the provided Import/Export functionalities.
