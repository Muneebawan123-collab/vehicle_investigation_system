# Vehicle Investigation System - Setup Guide

This guide provides step-by-step instructions for setting up and running the Vehicle Investigation System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **npm** or **yarn** package manager
4. **Git** for version control

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vehicle_investigation_system.git
cd vehicle_investigation_system
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create environment variables file
cp .env.example .env
```

Edit the `.env` file to configure your environment variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vehicle_investigation_system
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NODE_ENV=development
```

If you're using MongoDB Atlas, replace the MONGODB_URI with your connection string.

### 3. Frontend Setup

```bash
# Navigate to the frontend directory from project root
cd ../frontend

# Install dependencies
npm install

# Create environment variables file
cp .env.example .env
```

Edit the `.env` file to configure your frontend environment variables:

```
VITE_API_URL=http://localhost:5000/api
VITE_ENABLE_MOCK_API=false
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

### 4. Start the Development Servers

#### Start MongoDB (if using local installation)

```bash
# Start MongoDB service (this may vary depending on your OS)
mongod
```

#### Start the Backend Server

```bash
# From the backend directory
npm run dev
```

The backend server should start at http://localhost:5000

#### Start the Frontend Development Server

```bash
# From the frontend directory
npm run dev
```

The frontend development server should start at http://localhost:5173

### 5. Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Initial Setup

### Creating an Admin User

When you first start the application, you'll need to create an admin user:

1. Register a new user through the signup form
2. Use MongoDB Compass or another MongoDB client to connect to your database
3. Navigate to the "users" collection
4. Update the user document to set `role` to "admin"

```javascript
// Example MongoDB update operation
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB service is running
   - Check your MONGODB_URI in the .env file
   - Verify network connectivity to MongoDB Atlas (if using cloud)

2. **JWT Secret Issues**
   - Make sure to set a strong, unique JWT_SECRET in your .env file
   - Do not use the default value in production

3. **API Connection Issues**
   - Verify that the VITE_API_URL in the frontend .env file points to your backend server
   - Check for CORS issues if backend and frontend are on different domains

4. **File Upload Issues**
   - Ensure the uploads directory exists and has write permissions
   - Check Cloudinary credentials if using cloud storage

### Logs

Check the following log locations for troubleshooting:

- Backend logs: `backend/logs/combined.log` and `backend/logs/error.log`
- Frontend console logs: Browser developer tools > Console tab

## Production Deployment

For production deployment, additional steps are recommended:

1. **Security Hardening**
   - Use a strong, random JWT_SECRET
   - Set NODE_ENV to "production"
   - Configure proper HTTPS with SSL certificates

2. **Database Configuration**
   - Use MongoDB Atlas or another managed database service
   - Set up database users with appropriate permissions
   - Enable database backups

3. **Media Storage**
   - Configure Cloudinary for production media storage
   - Set appropriate security policies

4. **Build Process**
   - Build the frontend with `npm run build`
   - Serve static files from a CDN or web server

5. **Hosting**
   - Backend: Deploy to a Node.js hosting service (Heroku, Render, etc.)
   - Frontend: Deploy to a static hosting service (Vercel, Netlify, etc.)

## Support

If you encounter any issues or need assistance, please:

1. Check the documentation in the `docs` directory
2. Review the troubleshooting section above
3. Open an issue on the GitHub repository
4. Contact the development team at [your-email@example.com] 