# OAuth Setup Instructions

## Google OAuth Configuration

### 1. Configure Supabase Authentication

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Settings
3. Under "Site URL", make sure it's set to your development URL:
   - For local development: `http://localhost:5173`
   - For production: your actual domain

4. Under "Redirect URLs", add these URLs:
   - `http://localhost:5173/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

### 2. Enable Google Provider

1. In Supabase Dashboard, go to Authentication > Providers
2. Find "Google" and click to configure
3. Enable the Google provider
4. You'll need to create a Google OAuth app:

### 3. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and Google Identity API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client IDs"
5. Set application type to "Web application"

6. **IMPORTANT: Configure JavaScript Origins**
   Add these to "Authorized JavaScript origins":
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)

7. **Configure Redirect URIs**
   Add these to "Authorized redirect URIs":
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Replace `your-project-ref` with your actual Supabase project reference

8. Copy the Client ID and Client Secret
9. Paste them into your Supabase Google provider settings

### 4. Detailed Google Console Setup Steps

#### Step-by-step for JavaScript Origins:

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click on your OAuth 2.0 Client ID
3. In the "Authorized JavaScript origins" section, click "ADD URI"
4. Add these URIs one by one:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   https://yourdomain.com (when you deploy)
   ```

5. In the "Authorized redirect URIs" section, click "ADD URI"
6. Add this URI:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

7. Click "SAVE"

### 5. OAuth Consent Screen Configuration

1. Go to "OAuth consent screen" in Google Cloud Console
2. Choose "External" user type (unless you have Google Workspace)
3. Fill in required fields:
   - App name: "GoalCrusher"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes (optional, basic profile info is included by default)
5. Add test users if in testing mode

### 6. Apple OAuth Configuration (Optional)

1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create a new App ID and Service ID
3. Configure Sign in with Apple
4. Add the redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Copy the credentials to Supabase Apple provider settings

### 7. Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 8. Test the Setup

1. Restart your development server: `npm run dev`
2. Try signing in with Google
3. Check the browser console for any errors
4. Verify the redirect URL in the address bar matches your configuration

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**: 
   - Check that redirect URLs match exactly in both Google Console and Supabase
   - Ensure no trailing slashes or extra characters

2. **"unauthorized_client"**:
   - Verify Google OAuth credentials are correctly entered in Supabase
   - Check that the Google project has the correct APIs enabled

3. **"access_denied"**:
   - User cancelled the OAuth flow
   - Check Google OAuth consent screen configuration

4. **"origin_mismatch" or "JavaScript origins" error**:
   - **This is your current issue!**
   - Add `http://localhost:5173` to "Authorized JavaScript origins" in Google Console
   - Also add `http://127.0.0.1:5173` as a backup
   - Make sure there are no trailing slashes

5. **CORS errors**:
   - Verify Site URL is correctly set in Supabase
   - Check that your development server is running on the expected port

### Debug Steps:

1. Open browser developer tools
2. Go to Network tab
3. Try signing in with Google
4. Look for failed requests and error messages
5. Check the Console tab for JavaScript errors

### Quick Fix for Current Issue:

The "refusing to connect" error is likely because Google doesn't recognize `http://localhost:5173` as an authorized origin. Here's what to do:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized JavaScript origins", click "ADD URI"
5. Add: `http://localhost:5173`
6. Click "SAVE"
7. Wait a few minutes for changes to propagate
8. Try signing in again

If you're still having issues, check the Supabase logs in your dashboard under "Logs" > "Auth logs" for more detailed error information.

## Additional Notes

- Changes to Google OAuth settings can take up to 5 minutes to take effect
- Make sure your Supabase project is properly configured with the correct Google credentials
- Test with an incognito/private browser window to avoid cached authentication states
- Check that your Google Cloud project has billing enabled (required for OAuth in production)