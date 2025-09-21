# GEMINI.md - Project Overview

## Project Overview

This project is a comprehensive CRM (Customer Relationship Management) system designed for a women's bag store. It's a full-stack web application with a React-based frontend and a Node.js backend. The system includes features for managing customers, orders, products, and inventory. It also has role-based access control (admin, staff) and real-time notifications using WebSockets.

### Key Technologies

*   **Frontend:** React, Vite, Tailwind CSS, `react-router-dom`, `axios`, `socket.io-client`, `i18next`
*   **Backend:** Node.js, Express, Sequelize (with PostgreSQL), `socket.io`, `bcrypt`, `jsonwebtoken`, `multer`, `nodemailer`
*   **Database:** PostgreSQL
*   **Development:** Docker, Nodemon
*   **Testing:** (No testing framework specified in `package.json` scripts)

### Architecture

The application is divided into two main parts: a `frontend` directory containing the React client and a `backend` directory for the Node.js API server. The two communicate via a RESTful API, and real-time updates are pushed from the server to the client using WebSockets. The entire development environment is containerized using Docker.

## Building and Running

### Docker (Recommended)

The most straightforward way to get the project running is with Docker.

**Development:**

1.  **Start the services:**
    ```bash
    docker-compose -f docker-compose.dev.yml up -d
    ```
2.  **Access the application:**
    *   Frontend: `http://localhost:5173`
    *   Backend: `http://localhost:5000`
    *   pgAdmin: `http://localhost:8080`

**Production:**

1.  **Start the services:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d
    ```

### Manual Setup

If you prefer not to use Docker, you can run the application manually.

1.  **Install dependencies:**
    ```bash
    npm install
    cd frontend && npm install
    cd backend && npm install
    ```
2.  **Set up the database:**
    *   Make sure you have a PostgreSQL server running.
    *   Create a `.env` file in the `backend` directory with the database connection details.
    *   Run the migrations and seeders:
        ```bash
        npm run migrate
        npm run seed
        ```
3.  **Start the development servers:**
    ```bash
    npm run dev
    ```

## Development Conventions

### Database

*   Database schema changes are managed through Sequelize migrations. To create a new migration, use the `sequelize-cli`.
*   The database is seeded with initial data using Sequelize seeders.

### API

*   The API is documented in the `docs/api` directory.
*   Authentication is handled with JSON Web Tokens (JWTs).
*   File uploads are handled by `multer`.

### Frontend

*   The frontend is built with React and Vite.
*   Styling is done with Tailwind CSS.
*   Routing is handled by `react-router-dom`.
*   The application is internationalized using `i18next`.

### Real-time Features

*   The application uses `socket.io` for real-time communication between the frontend and backend.
*   Notifications are pushed to the client when certain events occur, such as a new order being placed.
