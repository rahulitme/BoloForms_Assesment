# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **MongoDB Atlas**: Set up a cloud database at https://www.mongodb.com/cloud/atlas

---

## Step 1: Set Up MongoDB Atlas

1. Go to https://mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for Vercel
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/boloforms-signatures
   ```

---

## Step 2: Deploy Backend

```bash
cd backend
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name: **boloforms-backend**
- Directory: **.**
- Override settings? **N**

### Set Environment Variables:

```bash
vercel env add MONGODB_URI
# Paste your MongoDB Atlas connection string

vercel env add FRONTEND_URL
# Enter: https://your-frontend-url.vercel.app

vercel env add PORT
# Enter: 5000
```

### Redeploy with environment variables:
```bash
vercel --prod
```

**Copy the backend URL** (e.g., https://boloforms-backend.vercel.app)

---

## Step 3: Deploy Frontend

```bash
cd ../frontend
```

### Update API URL in frontend:

Create `.env.production` file:
```bash
echo REACT_APP_API_URL=https://your-backend-url.vercel.app/api > .env.production
```

### Deploy:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name: **boloforms-frontend**
- Directory: **.**
- Override settings? **N**

### Deploy to production:
```bash
vercel --prod
```

**Copy the frontend URL** (e.g., https://boloforms-frontend.vercel.app)

---

## Step 4: Update Backend CORS

Go back to backend and update the FRONTEND_URL:

```bash
cd ../backend
vercel env add FRONTEND_URL production
# Enter your frontend URL: https://boloforms-frontend.vercel.app

vercel --prod
```

---

## Alternative: One-Click Deployment

### Backend:
1. Push code to GitHub (already done ✅)
2. Go to https://vercel.com/new
3. Import your repository: `rahulitme/BoloForms_Assesment`
4. Set Root Directory: `backend`
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `FRONTEND_URL`: Will add after frontend deployment
   - `PORT`: 5000
6. Click Deploy

### Frontend:
1. Go to https://vercel.com/new
2. Import same repository: `rahulitme/BoloForms_Assesment`
3. Set Root Directory: `frontend`
4. Add environment variable:
   - `REACT_APP_API_URL`: Your backend URL from step above
5. Click Deploy

---

## Important Notes

### File Storage Issue
⚠️ **Vercel has read-only filesystem**. The current file storage (`pdfs/` and `signed/` folders) won't work on Vercel.

**Solution:** Use cloud storage:

#### Option 1: AWS S3 (Recommended)
```bash
npm install aws-sdk
```

Update `backend/server.js` to use S3 instead of local filesystem.

#### Option 2: Vercel Blob Storage
```bash
npm install @vercel/blob
```

See: https://vercel.com/docs/storage/vercel-blob

#### Option 3: Cloudinary (Easiest for PDFs/Images)
```bash
npm install cloudinary
```

### Environment Variables Needed:

**Backend:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `FRONTEND_URL` - Your frontend Vercel URL
- `AWS_ACCESS_KEY_ID` (if using S3)
- `AWS_SECRET_ACCESS_KEY` (if using S3)
- `AWS_BUCKET_NAME` (if using S3)

**Frontend:**
- `REACT_APP_API_URL` - Your backend Vercel URL

---

## Quick Deployment (CLI Method)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy Backend
cd backend
vercel --prod

# Deploy Frontend
cd ../frontend
vercel --prod
```

---

## Verification

After deployment:

1. Visit your frontend URL
2. Upload a PDF
3. Add fields
4. Sign the document
5. Check if signed PDF is generated

---

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` in backend matches your frontend URL exactly
- No trailing slash

### MongoDB Connection Failed
- Check MongoDB Atlas IP whitelist (use 0.0.0.0/0)
- Verify connection string is correct
- Check database user permissions

### File Upload Fails
- Implement cloud storage (S3/Cloudinary)
- Vercel has 4.5MB request limit
- Use streaming for large files

### Build Fails
- Check all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs in Vercel dashboard

---

## Production URLs

After successful deployment:

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-api.vercel.app
- **GitHub**: https://github.com/rahulitme/BoloForms_Assesment

---

## Next Steps After Deployment

1. ✅ Test all functionality
2. ✅ Set up custom domain (optional)
3. ✅ Enable analytics in Vercel dashboard
4. ✅ Set up monitoring and alerts
5. ✅ Implement cloud storage for PDFs
6. ✅ Add authentication if needed

---

**Important:** For production use, you MUST implement cloud storage (S3, Cloudinary, or Vercel Blob) as Vercel's filesystem is ephemeral and read-only in serverless functions.
