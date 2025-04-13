# Vehicle Investigation System - Technical Documentation

This document provides a technical overview of the Vehicle Investigation System, a comprehensive MERN (MongoDB, Express, React, Node.js) stack application built for law enforcement, insurance agents, investigators, and government regulators.

## System Architecture

The application follows a standard MERN stack architecture:

### Frontend
- **React**: UI library for building the user interface
- **Vite**: Modern frontend tooling for fast development and optimized builds
- **Material UI & Bootstrap**: Component libraries for consistent UI design
- **React Router**: For handling application routing
- **Framer Motion**: For animations and transitions
- **Axios**: For API communication
- **JWT Decode**: For handling authentication tokens
- **React-Toastify**: For toast notifications
- **Chart.js & React-Chartjs-2**: For data visualization
- **Tesseract.js**: For OCR-based license plate recognition
- **@react-google-maps/api**: For integrating with Google Maps

### Backend
- **Node.js & Express**: Server-side runtime and framework
- **MongoDB & Mongoose**: Database and ODM
- **JWT**: For secure authentication
- **Bcrypt**: For password hashing
- **Multer**: For file uploads
- **Cloudinary**: For cloud-based media storage
- **Winston & Morgan**: For logging
- **Helmet**: For security
- **Express Rate Limit**: For API rate limiting

## Project Structure

### Backend Structure
```
backend/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   └── cloudinary.js    # Cloudinary setup
├── controllers/         # Route controllers
│   ├── userController.js
│   ├── vehicleController.js
│   ├── incidentController.js
│   └── documentController.js
├── middleware/          # Express middleware
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/              # Mongoose models
│   ├── userModel.js
│   ├── vehicleModel.js
│   ├── incidentModel.js
│   ├── documentModel.js
│   └── auditModel.js
├── routes/              # API routes
│   ├── userRoutes.js
│   ├── vehicleRoutes.js
│   ├── incidentRoutes.js
│   └── documentRoutes.js
├── utils/               # Utility functions
│   ├── logger.js
│   ├── authUtils.js
│   ├── auditUtils.js
│   └── multerConfig.js
├── uploads/             # Local file storage
├── logs/                # Application logs
├── .env                 # Environment variables
├── .env.example         # Example env file
├── package.json         # Dependencies
└── server.js            # Entry point
```

### Frontend Structure
```
frontend/
├── public/              # Static assets
├── src/                 # Source code
│   ├── assets/          # Images, icons, etc.
│   ├── components/      # Reusable components
│   │   ├── layouts/     # Layout components
│   │   └── routing/     # Routing components
│   ├── context/         # React context
│   │   └── AuthContext.jsx
│   ├── pages/           # Application pages
│   │   ├── admin/       # Admin pages
│   │   ├── auth/        # Authentication pages
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── documents/   # Document management
│   │   ├── incidents/   # Incident management
│   │   ├── profile/     # User profile
│   │   ├── vehicles/    # Vehicle management
│   │   └── NotFoundPage.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Root component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables
├── .env.example         # Example env file
├── package.json         # Dependencies
└── vite.config.js       # Vite configuration
```

## API Endpoints

### Authentication Endpoints
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/forgot-password` - Request password reset
- `POST /api/users/reset-password/:token` - Reset password
- `PUT /api/users/consent` - Update GDPR/CCPA consent status

### Vehicle Endpoints
- `GET /api/vehicles` - Get all vehicles (paginated)
- `POST /api/vehicles` - Register a new vehicle
- `GET /api/vehicles/:id` - Get vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete/deactivate vehicle
- `POST /api/vehicles/:id/images` - Upload vehicle images
- `GET /api/vehicles/search` - Search vehicles
- `PUT /api/vehicles/:id/location` - Update vehicle location

### Incident Endpoints
- `GET /api/incidents` - Get all incidents (paginated)
- `POST /api/incidents` - Create a new incident
- `GET /api/incidents/:id` - Get incident details
- `PUT /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident
- `POST /api/incidents/:id/evidence` - Add evidence
- `GET /api/incidents/statistics` - Get incident statistics

### Document Endpoints
- `GET /api/documents` - Get all documents (paginated)
- `POST /api/documents` - Upload a document
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/expiring` - Get documents about to expire

## Database Schema

### User Schema
- `firstName`, `lastName` - User name
- `email`, `password` - Authentication info
- `role` - User role (admin, officer, investigator, viewer)
- `badge`, `department` - Professional information
- `profileImage` - User profile image
- `lastLogin`, `isActive` - Account status
- `consentAccepted`, `consentDate` - GDPR/CCPA compliance

### Vehicle Schema
- `make`, `model`, `year`, `color` - Vehicle details
- `vin`, `licensePlate` - Identification
- `registrationExpiry`, `insuranceExpiry` - Important dates
- `owner` - Owner information
- `complianceStatus`, `complianceDetails` - Regulatory info
- `status` - Vehicle status (active, stolen, etc.)
- `location` - Geospatial info
- `notes`, `flags` - Additional information

### Incident Schema
- `incidentNumber` - Unique reference
- `title`, `description` - Incident details
- `date`, `time`, `location` - When and where
- `type`, `severity`, `status` - Classification
- `vehicles`, `persons` - Related entities
- `evidence`, `timeline` - Case materials
- `assignedTo`, `reportedBy` - Personnel
- `caseFile` - Investigation details

### Document Schema
- `title`, `type` - Document info
- `vehicle`, `incident` - Associations
- `fileUrl`, `thumbnailUrl` - Storage info
- `issuedDate`, `expiryDate` - Validity
- `isVerified`, `isWatermarked` - Document status
- `digitalSignature` - Security feature
- `status` - Document status

### Audit Schema
- `user`, `action` - Who did what
- `resourceType`, `resourceId` - What was affected
- `description`, `ipAddress` - Details
- `timestamp` - When it happened

## Authentication & Security

### Authentication Flow
1. User registers or logs in
2. Server validates credentials
3. JWT token issued with expiration
4. Token stored in localStorage
5. Token included in API requests
6. Server validates token on protected routes

### Security Measures
- Password hashing with bcrypt
- JWTs for stateless authentication
- HTTPS for data transmission
- Rate limiting against brute force attacks
- Helmet for secure HTTP headers
- Audit logging for all actions
- Role-based access control
- Input validation and sanitization

## Development & Deployment

### Local Development
1. Clone repository
2. Install dependencies for backend and frontend
3. Configure environment variables
4. Start MongoDB locally or use Atlas
5. Run backend: `npm run dev`
6. Run frontend: `npm run dev`

### Production Deployment
- Backend: Node.js hosting (Heroku, Render, etc.)
- Frontend: Static hosting (Vercel, Netlify, etc.)
- Database: MongoDB Atlas
- Media Storage: Cloudinary
- Environment Variables: Securely configured on hosting platforms

## Future Enhancements

Potential improvements for future versions:

1. Real-time notifications using WebSockets
2. Enhanced OCR for document scanning
3. Mobile applications (React Native)
4. Advanced analytics with machine learning
5. Integration with external law enforcement databases
6. Offline functionality and PWA features
7. Two-factor authentication
8. Advanced permission system with fine-grained controls 