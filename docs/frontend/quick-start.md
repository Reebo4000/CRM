# Frontend Quick Start Guide

React frontend application for the Gemini CRM system.

## 🎨 Overview

Modern React application built with:
- **React 18** with functional components and hooks
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **i18next** for internationalization (Arabic/English)
- **Socket.io** for real-time notifications

## 🚀 Quick Start

### Docker Setup (Recommended)
```bash
# From project root
./scripts/docker-dev.sh start
# Frontend available at http://localhost:5173
```

### Manual Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📚 Documentation

For complete frontend documentation, see [Frontend Documentation](./README.md).

## 🌐 Features

- **Multi-language Support**: Arabic and English with RTL layout
- **Real-time Notifications**: WebSocket integration
- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Theme switching
- **Role-based UI**: Different interfaces for Admin/Staff

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📞 Support

For development questions, refer to the [complete frontend documentation](./README.md) or the main [project documentation](../README.md).
