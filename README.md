# Startup Project Template - MEVN Stack

## MEVN Stack Overview
The MEVN stack is a popular web development stack that consists of:
- **MongoDB**: A NoSQL database for storing application data.
- **Express.js**: A web application framework for Node.js, used to build the backend
- **Vue.js**: A progressive JavaScript framework for building user interfaces, used for the frontend
- **Node.js**: A JavaScript runtime environment that allows you to run JavaScript on the server side.

## Project Structure
The project is organized into the following directories:
- `backend/`: Contains the Express.js server code and API routes.
    - `models/`: Contains Mongoose models for MongoDB collections.
    - `routes/`: Contains Express.js route definitions.
    - `controllers/`: Contains controller functions to handle business logic.
    - `config/`: Contains configuration files (e.g., database connection).
- `frontend/`: Contains the Vue.js application code.
    - `src/`: Contains the main source code for the Vue.js application.
        - `router/`: Contains Vue Router configuration.
    - `public/`: Contains static assets and the main HTML file.
- `README.md`: This file, providing an overview of the project.
- `.env`: Environment variables for the project.

## Getting Started
To get started with the MEVN stack project, follow these steps:
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. **Install backend dependencies**:
   ```bash
    cd backend
    npm install
    ```
3. **Install frontend dependencies**:
    ```bash
    cd ../frontend
    npm install
    ```
4. **Set up environment variables**:
    Rename `.env.template` file to `.env` and ( optional ) add the necessary environment
    variables (e.g., database connection string).
    
5. **Start the App**:
    Using Docker-Compose:
    ```bash
    docker-compose up --build
    ```

7. **Access the application**:
    Open your web browser and navigate to `http://localhost` to view the frontend application.

## Development Notes
- To access the backend API, use the `api/` in axios requests. As nginx is configured to forward requests from `/api` to the backend service.
- The app themselves (in the container) are served over HTTP, it is NGINX that handles HTTPS termination.
- Ensure that you have Docker and Docker Compose installed on your machine to run the application using the provided `docker-compose.yml` file.
- For development purposes, you can use the given certs under `./certs` or generate your own self-signed certificates by using `generate-certs.sh` script and modifying its parameters as needed.

## Production Notes
- For production deployment, ensure that you replace the self-signed certificates with valid SSL certificates from a trusted Certificate Authority (CA).
- Update the .env file with production database connection strings and other necessary configurations.

## Additional Resources
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Vue.js Documentation](https://vuejs.org/v2/guide/)
- [Node.js Documentation](https://nodejs.org/en/docs/)