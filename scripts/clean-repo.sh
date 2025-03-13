#!/bin/bash

# Script to clean sensitive data from Git history
# Use this if you accidentally committed sensitive data

echo "⚠️  WARNING: This script will rewrite your Git history. Make sure you have a backup! ⚠️"
echo "This should only be used if you've accidentally committed API keys or credentials."
echo ""
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Example of using BFG Repo Cleaner to remove sensitive data
# 1. Install BFG: https://rtyley.github.io/bfg-repo-cleaner/
# 2. Create a text file with patterns to replace
echo "Creating patterns file..."
cat > patterns.txt << EOL
NEXT_PUBLIC_FIREBASE_API_KEY=[a-zA-Z0-9_-]*
UNSPLASH_ACCESS_KEY=[a-zA-Z0-9_-]*
NEXT_PUBLIC_FIREBASE_APP_ID=[a-zA-Z0-9_:/-]*
EOL

echo "To clean your repository, do the following:"
echo ""
echo "1. Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/"
echo "2. Create a fresh clone of your repo:"
echo "   git clone --mirror git@github.com:yourusername/YoPix.git"
echo ""
echo "3. Run BFG to remove the sensitive data:"
echo "   java -jar bfg.jar --replace-text patterns.txt YoPix.git"
echo ""
echo "4. Clean and push the changes:"
echo "   cd YoPix.git"
echo "   git reflog expire --expire=now --all && git gc --prune=now --aggressive"
echo "   git push"
echo ""
echo "5. Delete the patterns.txt file when you're done." 