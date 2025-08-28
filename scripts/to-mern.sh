#!/bin/bash

# to-mern.sh - Convert MEVN stack to MERN stack
# This script removes the Vue frontend and replaces it with a React frontend

set -e  # Exit on any error

echo "🔄 Starting MEVN to MERN conversion..."

# Check if we're in the right directory (should have frontend folder)
if [ ! -d "frontend" ]; then
    echo "❌ Error: No 'frontend' directory found. Make sure you're in the project root."
    exit 1
fi

# Backup important config files from frontend
echo "📋 Backing up important configuration files..."
BACKUP_DIR="./temp_configs"
mkdir -p "$BACKUP_DIR"

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
    if [ -f "frontend/$file" ]; then
        echo "  ✓ Backing up $file"
        cp "frontend/$file" "$BACKUP_DIR/"
    fi
done

# Remove the Vue frontend directory
echo "🗑️  Removing Vue frontend directory..."
rm -rf frontend/

# Create new React app
echo "⚛️  Creating new React application..."
npx create-react-app frontend --template typescript

# Wait for creation to complete
if [ ! -d "frontend" ]; then
    echo "❌ Error: Failed to create React app"
    exit 1
fi

echo "🔧 Restoring configuration files..."

# Restore config files, but handle conflicts intelligently
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$BACKUP_DIR/$file" ]; then
        case $file in
            "vite.config.ts"|"vite.config.js")
                echo "  ⚠️  Converting Vue Vite config to React Vite config"
                # Create a React-compatible vite.config.ts based on the original
                echo "  📝 Your original Vite config saved as vite.config.vue-backup.${file##*.}"
                cp "$BACKUP_DIR/$file" "frontend/vite.config.vue-backup.${file##*.}"
                
                # Create new React-compatible Vite config based on your Vue config
                cat > "frontend/vite.config.ts" << 'VITE_EOF'
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
                cp "$BACKUP_DIR/$file" "frontend/tsconfig.backup.json"
                ;;
            ".env"|".env.local"|".env.example")
                echo "  ✓ Restoring environment file: $file"
                cp "$BACKUP_DIR/$file" "frontend/"
                ;;
            ".eslintrc.js"|".eslintrc.json"|"eslint.config.js"|"eslint.config.ts")
                echo "  ✓ Restoring ESLint config: $file"
                cp "$BACKUP_DIR/$file" "frontend/"
                ;;
            ".prettierrc"|".prettierrc.json"|".prettierrc.js"|"prettier.config.js")
                echo "  ✓ Restoring Prettier config: $file"
                cp "$BACKUP_DIR/$file" "frontend/"
                ;;
            ".gitignore")
                echo "  ✓ Merging .gitignore files"
                cat "$BACKUP_DIR/$file" >> "frontend/.gitignore"
                # Remove duplicates
                sort "frontend/.gitignore" | uniq > "frontend/.gitignore.tmp"
                mv "frontend/.gitignore.tmp" "frontend/.gitignore"
                ;;
        esac
    fi
done

# If Vite config was restored, we need to modify package.json to use Vite instead of react-scripts
echo "🔧 Setting up Vite for React..."

cd frontend

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

cd ..

# Create the equivalent React components
echo "⚛️  Creating React components with your current functionality..."

cd frontend

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

cd ..

# Clean up backup directory
echo "🧹 Cleaning up temporary files..."
rm -rf "$BACKUP_DIR"

# Update root package.json if it has frontend-specific scripts
if [ -f "package.json" ]; then
    echo "📝 Updating root package.json scripts..."
    
    # Check if there are any Vue-specific scripts to update
    if grep -q "vue\|@vue" package.json 2>/dev/null; then
        echo "  ⚠️  Found Vue references in root package.json - please review manually"
    fi
fi

echo ""
echo "✅ MEVN to MERN conversion completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. cd frontend"
echo "   2. npm install (if needed)"
if [ -f "frontend/vite.config.ts" ] || [ -f "frontend/vite.config.js" ]; then
    echo "   3. npm run dev (using Vite)"
else
    echo "   3. npm start (using react-scripts)"
fi
echo "   4. Review and merge any configuration conflicts"
echo ""
echo "📄 Note: Check frontend/tsconfig.backup.json for your original TypeScript config"
echo "🔧 Your backend and other project files remain unchanged"