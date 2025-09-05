#!/bin/bash
set -e

echo "🔨 Building web app..."
./node_modules/.bin/expo export --platform web

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
