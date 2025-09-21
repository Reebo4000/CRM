# Gemini CRM - Women's Bag Store Management System

A comprehensive web-based CRM tailored for a local women's bag retail store. The platform delivers role-based access control, inventory tracking, sales analytics, WhatsApp integration scaffolding, and a responsive frontend.

## Documentation

All reference material lives in the `docs/` directory. Key entry points:

- [Documentation Hub](./docs/README.md) — start here for structure and navigation
- [Docker Deployment Guide](./docs/deployment/docker-setup.md) — recommended production setup
- [Manual Production Guide](./docs/deployment/production-guide.md) — alternative to Docker
- [API Reference](./docs/api/) — endpoints, auth, and integration notes
- [User Manuals](./docs/user/) — administrator and staff walkthroughs
- [Backend Guides](./docs/backend/) and [Frontend Guides](./docs/frontend/) — developer onboarding

## Quick Start

### Docker (recommended)
```bash
./scripts/docker-dev.sh start   # launch development stack
./scripts/docker-prod.sh start  # launch production stack
```

### Manual workflow
```bash
npm install       # install root dependencies
npm run dev       # start frontend and backend dev servers
```

> Additional service-specific setup lives in `backend/` and `frontend/` READMEs.

## Status

- Version: 1.0.0
- Last updated: January 2025
- License: ISC (Mohamed Rabee)

For more details, explore the `docs/` directory.
