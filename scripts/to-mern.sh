#!/usr/bin/env bash
set -Eeuo pipefail
trap 'error_handler "${LINENO}" "${BASH_COMMAND}"' ERR

###############################################################################
# to-mern.sh - Convert MEVN stack to MERN stack
# This script removes the Vue frontend and replaces it with a React frontend
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
ON_START_SCRIPT="${ROOT}/scripts/on_start.sh"

log "Starting MEVN → MERN conversion at ROOT=${ROOT}"

command -v node >/dev/null || fail "node is required"
command -v npm  >/dev/null || fail "npm is required"
command -v npx  >/dev/null || fail "npx is required"

if [[ ! -d "${FRONTEND}" ]]; then
  log "No existing frontend/ found at ${FRONTEND} — continuing (will create new React app)."
fi

# Backup important config files
log "📋 Backing up important configuration files to ${BACKUP_DIR} ..."
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
        echo "  ✓ Backing up ${file}"
        cp "${FRONTEND}/${file}" "${BACKUP_DIR}/"
    fi
done

# Remove the Vue frontend directory
echo "🗑️  Removing Vue frontend directory..."
rm -rf "${FRONTEND}"

# Create new React app
echo "⚛️  Creating new React application..."
npx create-react-app "${FRONTEND}" --template typescript

# Wait for creation to complete
if [ ! -d "${FRONTEND}" ]; then
    echo "❌ Error: Failed to create React app"
    exit 1
fi

echo "🔧 Restoring configuration files..."

# Restore config files, but handle conflicts intelligently
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "${BACKUP_DIR}/${file}" ]; then
        case "${file}" in
            "vite.config.ts"|"vite.config.js")
                echo "  ⚠️  Converting Vue Vite config to React Vite config"
                # Create a React-compatible vite.config.ts based on the original
                echo "  📝 Your original Vite config saved as vite.config.vue-backup.${file##*.}"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/vite.config.vue-backup.${file##*.}"
                
                # Create new React-compatible Vite config based on your Vue config
                cat > "${FRONTEND}/vite.config.ts" << 'VITE_EOF'
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
                echo "  ⚠️  Merging TypeScript config (keeping React's base, adding your customizations)"
                # Note: Manual merge might be needed for complex tsconfig changes
                echo "  📝 Your original tsconfig.json saved as tsconfig.backup.json"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/tsconfig.backup.json"
                ;;
            ".env"|".env.local"|".env.example")
                echo "  ✓ Restoring environment file: ${file}"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/"
                ;;
            ".eslintrc.js"|".eslintrc.json"|"eslint.config.js"|"eslint.config.ts")
                echo "  ✓ Restoring ESLint config: ${file}"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/"
                ;;
            ".prettierrc"|".prettierrc.json"|".prettierrc.js"|"prettier.config.js")
                echo "  ✓ Restoring Prettier config: ${file}"
                cp "${BACKUP_DIR}/${file}" "${FRONTEND}/"
                ;;
            ".gitignore")
                echo "  ✓ Merging .gitignore files"
                cat "${BACKUP_DIR}/${file}" >> "${FRONTEND}/.gitignore"
                # Remove duplicates
                sort "${FRONTEND}/.gitignore" | uniq > "${FRONTEND}/.gitignore.tmp"
                mv "${FRONTEND}/.gitignore.tmp" "${FRONTEND}/.gitignore"
                ;;
        esac
    fi
done

# If Vite config was restored, we need to modify package.json to use Vite instead of react-scripts
echo "🔧 Setting up Vite for React..."

cd -- "${FRONTEND}"

# Remove react-scripts and add Vite with React plugin
npm uninstall react-scripts
npm install --save-dev vite @vitejs/plugin-react @types/node

# Update package.json scripts
node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts = {
        ...pkg.scripts,
        'dev': 'vite',
        'build': 'vite build',
        'preview': 'vite preview'
    };
    delete pkg.scripts.start;
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Move index.html to root and update it for Vite + React
if [ -f "public/index.html" ]; then
    mv public/index.html .
    # Update the index.html for Vite + React
    sed -i.bak 's|%PUBLIC_URL%||g' index.html
    # Remove the React app div and script if they exist, then add proper Vite setup
    cat > index.html << 'HTML_EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + TypeScript + Vite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML_EOF
    rm -f index.html.bak
fi

cd -- "${ROOT}"

# Create the equivalent React components
echo "⚛️  Creating React components with your current functionality..."

cd -- "${FRONTEND}"

# Install axios for API calls (matching your current setup)
npm install axios
npm install --save-dev @types/axios

# Install React Router for routing
npm install react-router-dom
npm install --save-dev @types/react-router-dom

# Create the Welcome component (equivalent to your Vue component)
mkdir -p src/components
cat > src/components/Welcome.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Welcome.css';

const Welcome: React.FC = () => {
  const [message, setMessage] = useState<string>('Loading...');

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await axios.get('/api/') as any;
        setMessage(res.data.message);
      } catch (err) {
        setMessage('Failed to fetch message');
        console.error(err);
      }
    };

    fetchMessage();
  }, []);

  return (
    <div className="welcome-screen">
      <h1>Welcome!</h1>
      <p>{message}</p>
      <p>
        Visit{' '}
        <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">
          reactjs.org
        </a>{' '}
        to read the documentation
      </p>
    </div>
  );
};

export default Welcome;
EOF

# Create the CSS file for Welcome component
cat > src/components/Welcome.css << 'EOF'
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
EOF

# Update App.tsx to include routing
cat > src/App.tsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './components/Welcome';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Welcome />} />
          {/* Add more routes here as needed */}
          <Route path="*" element={<Welcome />} /> {/* Fallback route */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
EOF

# Update App.css to be minimal since styles are in Welcome.css
cat > src/App.css << 'EOF'
.App {
  text-align: center;
}

/* You can add global app styles here */
EOF

# Update index.tsx if using Vite (otherwise keep the default)
if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
  cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF
fi

cd -- "${ROOT}"

# Clean up backup directory
echo "🧹 Cleaning up temporary files..."
rm -rf "${BACKUP_DIR}"

# Update root package.json if it has frontend-specific scripts
if [ -f "${ROOT}/package.json" ]; then
    echo "📝 Updating root package.json scripts..."
    
    # Check if there are any Vue-specific scripts to update
    if grep -q "vue\|@vue" "${ROOT}/package.json" 2>/dev/null; then
        echo "  ⚠️  Found Vue references in root package.json - please review manually"
    fi
fi

echo ""
echo "✅ MEVN to MERN conversion completed successfully!"
echo ""

if [[ -x "${ON_START_SCRIPT}" ]]; then
    echo "Running environment startup script (on_start.sh)..."
    "${ON_START_SCRIPT}"
else
    echo "Could not find or execute ${ON_START_SCRIPT}"
    exit 1
fi

echo ""
echo "📄 Note: Check frontend/tsconfig.backup.json for your original TypeScript config"
echo "🔧 Your backend and other project files remain unchanged"
