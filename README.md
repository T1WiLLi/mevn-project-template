
## MEVN Stack Overview
The MEVN stack is a popular web development stack that consists of:
-   **MongoDB**: A NoSQL database for storing application data.
-   **Express.js**: A web application framework for Node.js, used to build the backend.
-   **Vue.js**: A progressive JavaScript framework for building user interfaces, used for the frontend.
-   **Node.js**: A JavaScript runtime environment that allows you to run JavaScript on the server side.

## Project Structure
The project is organized into the following directories:
-   `backend/`: Contains the Express.js server code and API routes.
    -   `models/`: Contains Mongoose models for MongoDB collections.
    -   `routes/`: Contains Express.js route definitions.
    -   `controllers/`: Contains controller functions to handle business logic.
    -   `config/`: Contains configuration files (e.g., database connection).
-   `frontend/`: Contains the Vue.js application code.
    -   `src/`: Contains the main source code for the Vue.js application.
        -   `router/`: Contains Vue Router configuration.
    -   `public/`: Contains static assets and the main HTML file.
-   `on-start.sh`: Script to move .env.template to .env, execute npm install, and run docker automatically.
-   `to-mern.sh`: Script to convert the MEVN stack to MERN (MongoDB + Express + React + Node).
-   `to-vanilla.sh`: Script to convert the MEVN stack to vanilla TypeScript with Vite.
-   `README.md`: This file, providing an overview of the project.
-   `.env`: Environment variables for the project.

## Getting Started
To get started with the MEVN stack project, follow these steps:
1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Execute on-start.sh**:
    ```bash
    ~/scripts/on-start.sh
    ```
3.  **Access the application**: Open your web browser and navigate to `http://localhost` to view the frontend application.

## Stack Transformation Scripts
The project includes two transformation scripts located in the project root that allow you to convert between different frontend frameworks while preserving your backend and configurations.

### Convert to MERN Stack (React)
Transform your MEVN project to use React instead of Vue:
```bash
~/scripts/to-mern.sh
```
**What the MERN script does:**
-   Removes the Vue frontend while preserving configuration files.
-   Creates a new React + TypeScript application.
-   Recreates your current Welcome component functionality.
-   Sets up React Router with the same routing structure (`/` → Welcome, `*` → fallback).
-   Preserves your Vite configuration (converted to React-compatible).
-   Maintains all ESLint, Prettier, and environment configurations.
-   Executes on-start.sh for the the new stack.

### Convert to Vanilla TypeScript
Transform your project to use vanilla TypeScript with Vite:
```bash
~/scripts/to-vanilla.sh
```
**What the Vanilla TypeScript script does:**
-   Removes the Vue frontend while preserving configuration files.
-   Creates a new vanilla TypeScript + Vite project.
-   Implements the same welcome screen and API functionality.
-   Sets up a simple router system for future expansion.
-   Creates organized project structure with utilities and types.
-   Maintains all your development configurations.
-   Executes on-start.sh for the the new stack.

### Features Preserved in Both Transformations:
-   **API Integration**: Same axios calls to `/api/` endpoint.
-   **Welcome Screen**: Identical functionality and styling.
-   **Docker Configuration**: Full compatibility with existing docker-compose setup.
-   **Vite Configuration**: Preserves your server settings, proxy, and HMR config.
-   **Development Tools**: ESLint, Prettier, TypeScript configurations.
-   **Environment Variables**: All .env files preserved.
-   **Routing**: Same route structure with fallback handling.

## Development Notes
-   To access the backend API, use `api/` in axios requests, as nginx is configured to forward requests from `/api` to the backend service.
-   The apps themselves (in the container) are served over HTTP; it is NGINX that handles HTTPS termination.
-   Ensure that you have Docker and Docker Compose installed on your machine to run the application using the provided `docker-compose.yml` file.
-   For development purposes, you can use the given certs under `./certs` or generate your own self-signed certificates by using the `generate-certs.sh` script and modifying its parameters as needed.
-   **Framework Flexibility**: Use the transformation scripts to switch between Vue, React, or vanilla TypeScript based on project needs or team preferences.

## Production Notes
-   For production deployment, ensure that you replace the self-signed certificates with valid SSL certificates from a trusted Certificate Authority (CA).
-   Update the .env file with production database connection strings and other necessary configurations.
-   The transformation scripts are designed for development use - for production, ensure proper testing after any stack changes.

## Additional Resources
-   [MongoDB Documentation](https://docs.mongodb.com/)
-   [Express.js Documentation](https://expressjs.com/)
-   [Vue.js Documentation](https://vuejs.org/guide/)
-   [React Documentation](https://react.dev/)
-   [TypeScript Documentation](https://www.typescriptlang.org/docs/)
-   [Vite Documentation](https://vitejs.dev/guide/)
-   [Node.js Documentation](https://nodejs.org/en/docs/)
