#!/bin/bash
set -e

echo "🔨 Building web app..."
NODE_ENV=production ./node_modules/.bin/expo export --platform web

echo "🔧 Fixing paths for GitHub Pages..."
# Fix asset paths for GitHub Pages subdirectory
find dist -name "*.html" -exec sed -i '' 's|_expo/|/wardrobe-tracker/_expo/|g' {} \;
find dist -name "*.html" -exec sed -i '' 's|favicon.ico|/wardrobe-tracker/favicon.ico|g' {} \;

echo "📦 Deploying to GitHub Pages..."
git checkout gh-pages
# Copy dist files but exclude .env from deployment
rsync -av --exclude='.env' dist/ .
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin gh-pages

echo "🔄 Returning to main branch..."
git checkout main

echo "✅ Deployment complete! Your app will be live at:"
echo "https://tkomstadius.github.io/wardrobe-tracker/"
