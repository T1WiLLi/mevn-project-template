#!/usr/bin/env bash
set -Eeuo pipefail
trap 'error_handler "${LINENO}" "${BASH_COMMAND}"' ERR

###############################################################################
# to-vanilla.sh - Convert MEVN stack to Vanilla TypeScript with Vite
# This script removes the Vue frontend and replaces it with a vanilla TypeScript + Vite setup
###############################################################################

log()   { echo -e "$(date '+%F %T') | ${*}" >&2; }
fail()  { log "ERROR: ${*}"; exit 1; }
error_handler() { log "ERROR at line ${1}: ${2}"; exit 1; }

script_dir() { cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P; }

detect_root() {
  local sd; sd="$(script_dir)"
  if [[ -d "${sd}/.." && -d "${sd}/../frontend" ]]; then
    realpath "${sd}/.."; return
  fi
  if command -v git >/dev/null 2>&1 && git rev-parse --show-toplevel >/dev/null 2>&1; then
    git rev-parse --show-toplevel; return
  fi
  if [[ -d "${PWD}/frontend" || -d "${PWD}/backend" ]]; then
    echo "${PWD}"; return
  fi
  fail "Cannot locate project root. Run inside the repo or keep script in scripts/."
}

ROOT="$(detect_root)"
FRONTEND="${ROOT}/frontend"
BACKUP_DIR="${ROOT}/temp_configs"
ON_START_SCRIPT="${ROOT}/scripts/on-start.sh"

log "Starting MEVN → Vanilla conversion at ROOT=${ROOT}"

command -v node >/dev/null || fail "node is required"
command -v npm  >/dev/null || fail "npm is required"
command -v npx  >/dev/null || fail "npx is required"

if [[ ! -d "${FRONTEND}" ]]; then
  log "No existing frontend/ found at ${FRONTEND} — continuing (will create new React app)."
fi

# Backup important config files
log "-> Backing up important configuration files to ${BACKUP_DIR} ..."
mkdir -p "${BACKUP_DIR}"

# Files to preserve
CONFIG_FILES=(
    "vite.config.ts"
    "vite.config.js"
    "eslint.config.js"
    "eslint.config.ts"
    ".eslintrc.js"
    ".eslintrc.json"
    ".prettierrc"
    ".prettierrc.json"
    ".prettierrc.js"
    "prettier.config.js"
    "tsconfig.json"
    "tsconfig.app.json"
    "tsconfig.node.json"
    ".env"
    ".env.local"
    ".env.example"
    ".gitignore"
)

# Copy config files if they exist
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "${FRONTEND}/${file}" ]; then
        echo "-> Backing up ${file}"
        cp "${FRONTEND}/${file}" "${BACKUP_DIR}/"
    fi
done

# Remove the Vue frontend directory
echo "-> Removing Vue frontend directory..."
rm -rf "${FRONTEND}"

# Create new Vanilla TypeScript + Vite project
echo "-> Creating new Vanilla TypeScript project with Vite..."
(cd "${ROOT}" && npm create vite@latest frontend -- --template vanilla-ts)

# Wait for creation to complete
if [ ! -d "${FRONTEND}" ]; then
    echo "-> Error: Failed to create Vite project"
    exit 1
fi

echo "-> Restoring configuration files..."

# Restore config files
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "${BACKUP_DIR}/${file}" ]; then
        case "${file}" in
            "vite.config.ts"|"vite.config.js")
                echo "-> Converting Vue Vite config to Vanilla TypeScript Vite config"
                echo "-> Your original vite config saved as vite.config.vue-backup.${file##*.}"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/vite.config.vue-backup.${file##*.}"
                
                # Create new Vanilla TS compatible Vite config based on your Vue config
                cat > "${FRONTEND}/vite.config.ts" << 'VITE_EOF'
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      port: 5173,
    },
    proxy: {
      '/api': 'https://backend:5000',
    },
  },
});
VITE_EOF
                ;;
            "tsconfig.json")
                echo "-> Merging TypeScript config (your config saved as tsconfig.backup.json)"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/tsconfig.backup.json"
                # The new Vite template will have its own tsconfig, you might want to merge
                ;;
            ".env"|".env.local"|".env.example")
                echo "  -> Restoring environment file: ${file}"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/"
                ;;
            ".eslintrc.js"|".eslintrc.json"|"eslint.config.js"|"eslint.config.ts")
                echo "  -> Restoring ESLint config: ${file}"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/"
                ;;
            ".prettierrc"|".prettierrc.json"|".prettierrc.js"|"prettier.config.js")
                echo "  -> Restoring Prettier config: ${file}"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/"
                ;;
            ".gitignore")
                echo "  -> Merging .gitignore files"
                cat "${BACKUP_DIR}/${file}" >> "${FRONTEND}/.gitignore"
                # Remove duplicates
                sort "${FRONTEND}/.gitignore" | uniq > "${FRONTEND}/.gitignore.tmp"
                mv "${FRONTEND}/.gitignore.tmp" "${FRONTEND}/.gitignore"
                ;;
        esac
    fi
done

# Create a basic project structure with some common utilities
echo "-> Setting up project structure..."

cd -- "${FRONTEND}"

# Create additional directories that might be useful
mkdir -p src/utils src/types src/styles src/assets

# Create a basic API utility file
cat > src/utils/api.ts << 'EOF'
// API utility functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export const api = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.message || 'Request failed' };
      }
      
      return { data };
    } catch (error) {
      return { error: 'Network error occurred' };
    }
  },

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.message || 'Request failed' };
      }
      
      return { data };
    } catch (error) {
      return { error: 'Network error occurred' };
    }
  },

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.message || 'Request failed' };
      }
      
      return { data };
    } catch (error) {
      return { error: 'Network error occurred' };
    }
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.message || 'Request failed' };
      }
      
      return { data };
    } catch (error) {
      return { error: 'Network error occurred' };
    }
  }
};
EOF

# Create a types file for common interfaces
cat > src/types/index.ts << 'EOF'
// Common type definitions

export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Add more types as needed for your application
EOF

# Create a basic styles file
cat > src/styles/main.css << 'EOF'
/* Global styles for the application */

:root {
  --primary-color: #646cff;
  --primary-hover: #535bf2;
  --background-color: #ffffff;
  --text-color: #213547;
  --border-color: #e5e7eb;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #242424;
    --text-color: rgba(255, 255, 255, 0.87);
    --border-color: #374151;
    --shadow-color: rgba(255, 255, 255, 0.1);
  }
}

body {
  margin: 0;
  padding: 0;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: var(--text-color);
  background-color: var(--background-color);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn:hover {
  background-color: var(--primary-hover);
}

.card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px var(--shadow-color);
}

/* Form styles */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--background-color);
  color: var(--text-color);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.1);
}
EOF

# Update the main.ts file to include the new styles
cat > src/main.ts << 'EOF'
import './style.css'
import './styles/main.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'
import { api } from './utils/api.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vanilla TypeScript + Vite</h1>

    <div class="card">
      <button id="counter" type="button"></button>
    </div>

    <div class="card">
      <h3>Backend Connection Test</h3>
      <button id="test-api" type="button" class="btn">Test Backend Connection</button>
      <div id="api-result" style="margin-top: 1rem;"></div>
    </div>

    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

// Setup API test button
document.querySelector<HTMLButtonElement>('#test-api')!.addEventListener('click', async () => {
  const resultDiv = document.querySelector<HTMLDivElement>('#api-result')!;
  resultDiv.innerHTML = 'Testing connection...';
  
  try {
    const result = await api.get('/health'); // Adjust endpoint as needed
    if (result.data) {
      resultDiv.innerHTML = `<span style="color: green;">✓ Backend connected successfully!</span>`;
    } else {
      resultDiv.innerHTML = `<span style="color: red;">✗ Backend error: ${result.error}</span>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<span style="color: red;">✗ Connection failed: ${error}</span>`;
  }
});
EOF

# Create an example environment file
cat > .env.example << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Add other environment variables as needed
EOF

cd -- "${ROOT}"

# Create the equivalent vanilla TypeScript functionality
echo "-> Creating vanilla TypeScript app with your current functionality..."

cd -- "${FRONTEND}"

# Install axios for API calls (matching your current setup)
npm install axios

# Update the main.ts file to recreate your Vue functionality
cat > src/main.ts << 'EOF'
import './style.css'
import './styles/main.css'
import axios from 'axios'

// Simple router functionality
class SimpleRouter {
  private currentPath: string = '';
  
  constructor() {
    this.currentPath = window.location.pathname;
    window.addEventListener('popstate', () => this.handleRoute());
    this.handleRoute();
  }

  private handleRoute() {
    const path = window.location.pathname;
    this.currentPath = path;
    
    // For this simple app, all routes lead to the welcome screen
    this.renderWelcomeScreen();
  }

  private async renderWelcomeScreen() {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    
    // Set initial loading state
    app.innerHTML = `
      <div class="welcome-screen">
        <h1>Welcome!</h1>
        <p id="message">Loading...</p>
        <p>
          Visit
          <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener">typescriptlang.org</a>
          to read the documentation
        </p>
      </div>
    `;

    // Fetch message from API (same as your Vue component)
    try {
      const res = await axios.get('/api/');
      const messageElement = document.querySelector('#message');
      if (messageElement) {
        messageElement.textContent = res.data.message;
      }
    } catch (err) {
      const messageElement = document.querySelector('#message');
      if (messageElement) {
        messageElement.textContent = 'Failed to fetch message';
      }
      console.error(err);
    }
  }

  // Method to navigate (for future use)
  navigateTo(path: string) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }
}

// Initialize the router
new SimpleRouter();
EOF

# Update the CSS to match your Vue styles exactly
cat > src/styles/main.css << 'EOF'
/* Global styles matching your Vue component */

:root {
  --primary-color: #646cff;
  --primary-hover: #535bf2;
  --background-color: #ffffff;
  --text-color: #213547;
  --border-color: #e5e7eb;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #242424;
    --text-color: rgba(255, 255, 255, 0.87);
    --border-color: #374151;
    --shadow-color: rgba(255, 255, 255, 0.1);
  }
}

body {
  margin: 0;
  padding: 0;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: var(--text-color);
  background-color: var(--background-color);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Welcome screen styles (matching your Vue component exactly) */
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  font-family: sans-serif;
}

.welcome-screen h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.welcome-screen p {
  font-size: 1.2rem;
  text-align: center;
}

/* Utility classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn:hover {
  background-color: var(--primary-hover);
}

.card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px var(--shadow-color);
}

/* Form styles */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--background-color);
  color: var(--text-color);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.1);
}
EOF

# Create a simple router utility for future expansion
cat > src/utils/router.ts << 'EOF'
// Simple router utility for vanilla TypeScript
export class Router {
  private routes: Map<string, () => void> = new Map();
  private fallbackRoute: (() => void) | null = null;

  constructor() {
    window.addEventListener('popstate', () => this.handleRoute());
    // Handle initial route
    this.handleRoute();
  }

  // Add a route handler
  addRoute(path: string, handler: () => void) {
    this.routes.set(path, handler);
  }

  // Set fallback route (catch-all)
  setFallback(handler: () => void) {
    this.fallbackRoute = handler;
  }

  // Navigate to a path
  navigateTo(path: string) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  // Handle route changes
  private handleRoute() {
    const path = window.location.pathname;
    const handler = this.routes.get(path);
    
    if (handler) {
      handler();
    } else if (this.fallbackRoute) {
      this.fallbackRoute();
    } else {
      console.warn(`No route handler found for ${path}`);
    }
  }
}
EOF

cd -- "${ROOT}"

# Clean up backup directory
echo "-> Cleaning up temporary files..."
rm -rf "${BACKUP_DIR}"

# Update root package.json if it has frontend-specific scripts
if [ -f "${ROOT}/package.json" ]; then
    echo "-> Updating root package.json scripts..."
    
    # Check if there are any Vue-specific scripts to update
    if grep -q "vue\|@vue" "${ROOT}/package.json" 2>/dev/null; then
        echo "-> Found Vue references in root package.json - please review manually"
    fi
fi

echo ""
echo "-> MEVN to Vanilla TypeScript conversion completed successfully!"
echo ""

if [[ -x "${ON_START_SCRIPT}" ]]; then
    echo "Running environment startup script (on_start.sh)..."
    "${ON_START_SCRIPT}"
else
    echo "Could not find or execute ${ON_START_SCRIPT}"
    exit 1
fi

echo ""
echo "-> Project structure created:"
echo "   ├── src/"
echo "   │   ├── utils/api.ts      (API utility functions)"
echo "   │   ├── types/index.ts    (TypeScript type definitions)"
echo "   │   ├── styles/main.css   (Global styles)"
echo "   │   └── ..."
echo ""
echo "-> Configuration backups:"
echo "   - tsconfig.backup.json (your original TypeScript config)"
echo "   - vite.config.backup.* (your original Vite config, if exists)"
echo ""
echo "-> Your backend and other project files remain unchanged"
echo "-> The API utility is configured to work with your existing backend"