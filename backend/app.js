const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/settings', settingsRoutes); 