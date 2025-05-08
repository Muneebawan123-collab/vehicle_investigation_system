<<<<<<< HEAD
<<<<<<< HEAD
# Vehicle Investigation System

A comprehensive MERN stack application for law enforcement, insurance agents, investigators, and government regulators to manage vehicle investigations, case management, and document tracking.

![Vehicle Investigation System Dashboard](https://placeholder-for-dashboard-screenshot.com/screenshot.png)

## 🚀 Features

- **Vehicle Registration & License Plate Recognition**
  - Register vehicles with detailed information
  - OCR-based license plate recognition
  - VIN validation
  - Vehicle profiles with complete history

- **Incident & Case Management**
  - Create and track incidents
  - Assign investigators
  - Upload evidence
  - Case status tracking
  - Full timeline visualization

- **Vehicle History & Document Vault**
  - Secure document storage
  - Expiry alerts and notifications
  - Digital watermarking
  - Document verification

- **Smart Search & Investigation Tools**
  - Advanced search across all data
  - Duplicate VIN detection
  - Fraud pattern recognition
  - Interactive dashboards and charts

- **Compliance & Government Integration**
  - Check emissions status
  - Track safety recalls
  - Validate registrations
  - Compliance badges

- **Secure Authentication & Access Control**
  - Role-based permissions (Admin, Officer, Investigator, Viewer)
  - JWT authentication
  - Audit logging
  - GDPR/CCPA consent tracking

## 📋 Prerequisites

- Node.js (>= 14.x)
- MongoDB (>= 4.x)
- NPM or Yarn

## 🛠️ Installation

### Clone the repository
```bash
git clone https://github.com/yourusername/vehicle_investigation_system.git
cd vehicle_investigation_system
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your configuration
# MONGODB_URI, JWT_SECRET, CLOUDINARY credentials, etc.

# Start the backend server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

## 🔐 Environment Variables

The following environment variables need to be set in your `.env` file:

### Backend Environment Variables
- `PORT` - Port for the backend server (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRES_IN` - JWT token expiration time
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `NODE_ENV` - Environment (development/production)

## 👥 User Roles

- **Admin**: Full system access, user management, system configuration
- **Officer**: Vehicle registration, incident reporting, document management
- **Investigator**: Case management, evidence handling, investigations
- **Viewer**: Read-only access to non-sensitive information

## 📱 API Endpoints

### Auth Endpoints
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `POST /api/users/forgot-password` - Request password reset
- `POST /api/users/reset-password/:token` - Reset password

### Vehicle Endpoints
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Register a new vehicle
- `GET /api/vehicles/:id` - Get vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete/deactivate vehicle

### Incident Endpoints
- `GET /api/incidents` - Get all incidents
- `POST /api/incidents` - Create a new incident
- `GET /api/incidents/:id` - Get incident details
- `PUT /api/incidents/:id` - Update incident
- `GET /api/incidents/statistics` - Get incident statistics

### Document Endpoints
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Upload a document
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update document metadata
- `GET /api/documents/expiring` - Get documents about to expire

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent brute force attacks
- XSS protection with Helmet
- Audit logging for all critical operations
- Role-based access control
- GDPR/CCPA compliance features

## 📦 Deployment

### Backend Deployment
The backend can be deployed to Heroku, Render, or any Node.js hosting service.

```bash
# Build for production
cd backend
npm run build
```

### Frontend Deployment
The frontend can be deployed to Vercel, Netlify, or any static hosting service.

```bash
# Build for production
cd frontend
npm run build
```

## 📚 Documentation

Additional documentation:
- [User Guide](docs/user-guide.md)
- [Admin Guide](docs/admin-guide.md)
- [API Documentation](docs/api-docs.md)
- [Development Guide](docs/dev-guide.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

For questions, support, or feature requests, please contact:
- Email: [your-email@example.com](mailto:your-email@example.com)
- GitHub Issues: [https://github.com/yourusername/vehicle_investigation_system/issues](https://github.com/yourusername/vehicle_investigation_system/issues)

## 🎥 Demo

Check out our live demo: [https://vehicle-investigation-system-demo.vercel.app](https://vehicle-investigation-system-demo.vercel.app)

Login credentials for demo:
- Admin: admin@example.com / password123
- Officer: officer@example.com / password123
- Investigator: investigator@example.com / password123
- Viewer: viewer@example.com / password123

## 📸 Screenshots

![Dashboard](https://placeholder-for-screenshot.com/dashboard.png)
![Vehicle Registration](https://placeholder-for-screenshot.com/vehicle-registration.png)
![Case Management](https://placeholder-for-screenshot.com/case-management.png)
![Document Vault](https://placeholder-for-screenshot.com/document-vault.png)

## ✨ Contributors

- Your Name - Lead Developer 
=======
# Vehicle_registration_system
>>>>>>> 3c89962ff277d3227ba6c425e2f87b67d244c535
=======
# vehicle_investigation_system
>>>>>>> dd9fd1e894bbfbd3b620bd5f771f05eeaf49b981
