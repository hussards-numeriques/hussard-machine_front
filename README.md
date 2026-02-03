# Hussard Machine - Frontend

The web interface for Hussard Machine, built with React and Vite.

## Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Linting/Formatting:** ESLint + Prettier

## Development Setup

### Prerequisites

- Node.js 20+
- npm

### Initialization

Install dependencies:

```bash
npm install
```

### Running the Dev Server

To start the development server (port 3000):

```bash
npm run dev
```

## Code Quality

### Linting

We use ESLint with React hooks and refresh plugins. To check for errors:

```bash
npm run lint
```

To fix auto-fixable issues:

```bash
npm run lint -- --fix
```

### Formatting

We use Prettier for code formatting. To format all files:

```bash
npx prettier --write .
```

### Type Checking

To verify TypeScript types without emitting files:

```bash
npx tsc --noEmit
```

## Building for Production

To build the application for production (outputs to `dist/`):

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Docker

To build the frontend image (served via Nginx):

```bash
docker build -t hussard-frontend .
docker run -p 80:80 hussard-frontend
```
