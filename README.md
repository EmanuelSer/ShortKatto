# ShortKatto

ShortKatto is a subscription-based video editing service designed to provide creators, growing channels, and teams with studio-quality edits in days, not weeks. The platform allows users to subscribe to a plan, submit footage, and receive unlimited editing and revisions.

## Features

- **Modern Landing Page**: A fully responsive, conversion-optimized landing page detailing the 4-step process, service benefits, pricing plans (Basic & Pro), and FAQs.
- **Client Dashboard**: A secure portal where authenticated users can:
  - Access their dedicated Trello board to manage requests and revisions.
  - Upload raw footage directly via a secure Dropbox request link.
  - Manage their billing and subscription seamlessly.
- **Authentication**: Secure login flow using Firebase Authentication (Google Sign-In and Email/Passwordless).
- **Responsive Design**: Carefully crafted CSS ensuring a flawless experience across desktop, tablet, and mobile devices.
- **Motion Graphics Add-on**: Optional recurring add-on for professional motion graphics.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Custom CSS with CSS Variables), Vanilla JavaScript (ES Modules).
- **Backend / BaaS**: Firebase (Authentication, Firestore).
- **Build Tool**: Vite.

## Project Structure

```text
├── index.html              # Main landing page
├── dashboard.html          # Secure client portal
├── assets/
│   ├── css/
│   │   └── styles.css      # Global stylesheet and responsive rules
│   └── js/
│       ├── main.js         # Landing page interactions and auth state
│       ├── dashboard.js    # Dashboard logic, data fetching, and UI updates
│       └── config.js       # Firebase configuration and initialization
├── package.json            # Project dependencies and scripts
└── vite.config.js          # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository or download the source code.
2. Install the dependencies:

```bash
npm install
```

### Environment Variables

Ensure your Firebase configuration is properly set up in `assets/js/config.js` or via environment variables if configured in your deployment environment.

### Running Locally

Start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

To create a production-ready build:

```bash
npm run build
```

The compiled assets will be output to the `dist/` directory, ready to be deployed to any static hosting service.

## License

© ShortKatto. All rights reserved.
