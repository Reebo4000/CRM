# Gemini CRM - Complete Documentation Index

This is a comprehensive index of all documentation files in the Gemini CRM project, organized by category and purpose.

## 📋 **Quick Navigation**

### 🚀 **Getting Started**
- **[Main README](../README.md)** - Project overview and quick setup
- **[Docker Deployment Guide](./deployment/docker-deployment.md)** - Complete Docker deployment (recommended)
- **[Documentation Hub](./README.md)** - Central documentation directory

### 🐳 **Docker Deployment (Recommended)**
- **[Docker Deployment Guide](./deployment/docker-deployment.md)** - Comprehensive Docker deployment guide
- **[Docker Setup Script](../docker-setup.sh)** - Automated setup script
- **[Docker Dev Script](../scripts/docker-dev.sh)** - Development environment management
- **[Docker Prod Script](../scripts/docker-prod.sh)** - Production environment management
- **[Docker Quick Reference](./deployment/docker-setup.md)** - Quick Docker commands

### 🏗️ **Manual Deployment**
- **[Deployment Hub](./deployment/README.md)** - Deployment options overview
- **[Production Guide](./deployment/production-guide.md)** - Complete manual deployment
- **[Production Checklist](./deployment/production-checklist.md)** - Pre-deployment verification

### 🔌 **API Documentation**
- **[API Overview](./api/README.md)** - API documentation hub
- **[API Endpoints](./api/endpoints.md)** - Complete endpoint reference
- **[Authentication](./api/authentication.md)** - JWT authentication guide
- **[Integration API](./api/integration.md)** - External integration endpoints

### 🎨 **Frontend Development**
- **[Frontend Overview](./frontend/README.md)** - Complete frontend documentation
- **[Frontend Quick Start](../frontend/README.md)** - Frontend quick start
- **[Internationalization](./frontend/internationalization.md)** - i18n setup (Arabic/English)

### ⚙️ **Backend Development**
- **[Backend Docs](./backend/README.md)** - Backend architecture and development
- **[Database Documentation](./backend/database.md)** - Database schema and migrations

### 👥 **User Documentation**
- **[User Manual](./user/user-manual.md)** - End-user guide
- **[Admin Guide](./user/admin-guide.md)** - Administrator functions

## 📁 **File Structure Overview**

```
gemini-crm/
├── README.md                           # Main project documentation (minimal)
├── docker-setup.sh                     # Docker setup automation script
├── docker-compose.dev.yml              # Development Docker configuration
├── docker-compose.prod.yml             # Production Docker configuration
├── .env.development                    # Development environment variables
├── .env.production                     # Production environment variables
├── package.json                        # Root package.json with scripts
│
├── docs/                               # Main documentation directory
│   ├── README.md                       # Documentation hub
│   ├── DOCUMENTATION_INDEX.md          # This file - documentation index
│   ├── api/                           # API documentation
│   │   ├── README.md                  # API overview
│   │   ├── endpoints.md               # Complete API reference
│   │   ├── authentication.md          # Authentication guide
│   │   └── integration.md             # Integration API
│   ├── deployment/                    # Deployment documentation
│   │   ├── README.md                  # Deployment options
│   │   ├── production-guide.md        # Manual production deployment
│   │   ├── production-checklist.md    # Pre-deployment checklist
│   │   ├── docker-setup.md            # Docker quick reference
│   │   └── docker-deployment.md       # Complete Docker guide
│   ├── frontend/                      # Frontend documentation
│   │   ├── README.md                  # Frontend development guide
│   │   └── internationalization.md    # i18n documentation
│   ├── backend/                       # Backend documentation
│   │   ├── README.md                  # Backend development guide
│   │   └── database.md                # Database documentation
│   └── user/                          # User documentation
│       ├── README.md                  # User docs overview
│       ├── user-manual.md             # End-user guide
│       └── admin-guide.md             # Administrator guide
│
├── frontend/                          # Frontend application
│   ├── README.md                      # Frontend quick start
│   ├── Dockerfile                     # Production frontend image
│   ├── Dockerfile.dev                 # Development frontend image
│   └── nginx.conf                     # Nginx configuration
│
├── backend/                           # Backend application
│   ├── Dockerfile                     # Production backend image
│   ├── Dockerfile.dev                 # Development backend image
│   └── database-init/                 # Database initialization scripts
│
└── scripts/                           # Management scripts
    ├── docker-dev.sh                  # Development environment management
    ├── docker-prod.sh                 # Production environment management
    ├── setup-production.sh            # Manual production setup
    └── [other utility scripts]
```

## 🎯 **Documentation by Use Case**

### **I want to deploy the application quickly**
1. **[Docker Deployment Guide](./deployment/docker-deployment.md)** - Complete Docker guide
2. **[Docker Setup Script](../docker-setup.sh)** - Run this first
3. **[Docker Management Scripts](../scripts/)** - Use docker-dev.sh or docker-prod.sh

### **I want to develop/modify the application**
1. **[Main README](../README.md)** - Project overview
2. **[Frontend Docs](./frontend/README.md)** - Frontend development
3. **[Backend Docs](./backend/README.md)** - Backend development
4. **[API Documentation](./api/README.md)** - API reference

### **I want to integrate with external systems**
1. **[API Overview](./api/README.md)** - API documentation hub
2. **[Integration API](./api/integration.md)** - External integration endpoints
3. **[Authentication](./api/authentication.md)** - API authentication

### **I want to deploy manually (without Docker)**
1. **[Production Guide](./deployment/production-guide.md)** - Complete manual deployment
2. **[Production Checklist](./deployment/production-checklist.md)** - Pre-deployment verification
3. **[Setup Script](../scripts/setup-production.sh)** - Automated manual setup

### **I'm an end user of the application**
1. **[User Manual](./user/user-manual.md)** - Complete user guide
2. **[Admin Guide](./user/admin-guide.md)** - Administrator functions

## 🔄 **Documentation Maintenance**

### **Last Updated**: January 2025
### **Documentation Version**: 1.0.0

### **Recent Updates**:
- ✅ Consolidated all documentation into docs/ folder
- ✅ Updated all file paths and command references
- ✅ Moved Docker deployment guide to docs/deployment/
- ✅ Updated documentation index with new structure
- ✅ Simplified root README.md to point to docs/
- ✅ Fixed all internal links and references

### **Documentation Standards**:
- All documentation is now centralized in docs/ folder
- All file paths are relative to project root
- All commands are tested and verified
- Environment variables match actual configuration files
- URLs and ports are consistent across all documents
- Version numbers and dates are synchronized

---

**Note**: This index is automatically maintained. When adding new documentation, please update this index accordingly.
