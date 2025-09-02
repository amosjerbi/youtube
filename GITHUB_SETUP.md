# GitHub Repository Setup Instructions

Your project is ready to be uploaded to GitHub! Follow these steps:

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the following:
   - **Repository name:** `youtube`
   - **Description:** "YouTube to MP3 Converter - Clean, modern web application for downloading YouTube videos as audio files"
   - **Visibility:** Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you instructions. Run these commands in your terminal:

### Option A: If your GitHub username is `amosjerbi`:
```bash
cd /Users/amosjerbi/Desktop/Youtube
git remote add origin https://github.com/amosjerbi/youtube.git
git push -u origin main
```

### Option B: If your GitHub username is different:
Replace `YOUR_USERNAME` with your actual GitHub username:
```bash
cd /Users/amosjerbi/Desktop/Youtube
git remote add origin https://github.com/YOUR_USERNAME/youtube.git
git push -u origin main
```

## Step 3: Enter Your Credentials

When prompted:
- **Username:** Your GitHub username
- **Password:** Your GitHub Personal Access Token (not your regular password!)

### How to Create a Personal Access Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "youtube-repo"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again!)
7. Use this token as your password when pushing

## Step 4: Verify Upload

Once pushed successfully, your repository will be available at:
```
https://github.com/YOUR_USERNAME/youtube
```

## Alternative: Using GitHub Desktop

If you prefer a GUI approach:
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Sign in with your GitHub account
3. Click "Add" → "Add Existing Repository"
4. Browse to `/Users/amosjerbi/Desktop/Youtube`
5. Click "Publish repository"
6. Choose name "youtube" and click "Publish Repository"

## Your Repository Structure

```
youtube/
├── index.html          # Frontend interface
├── styles.css          # Styling
├── server.js           # Backend server
├── package.json        # Dependencies
├── package-lock.json   # Locked dependencies
├── README.md          # Documentation
└── .gitignore         # Git ignore rules
```

## Next Steps After Upload

1. Add a license file if needed (MIT recommended)
2. Update README with your GitHub username
3. Consider adding GitHub Actions for CI/CD
4. Add badges to your README (build status, license, etc.)

## Troubleshooting

### If you get "authentication failed":
- Make sure you're using a Personal Access Token, not your password
- Check that the token has `repo` permissions

### If you get "repository not found":
- Verify the repository name is exactly `youtube`
- Check your GitHub username is correct
- Make sure you created the repository on GitHub first

### To check your remote URL:
```bash
git remote -v
```

### To change remote URL if needed:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/youtube.git
```

Good luck! 🎉
