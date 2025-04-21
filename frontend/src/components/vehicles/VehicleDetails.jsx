import React from 'react';
import { Card, CardContent, Typography, Grid, Chip, Box } from '@mui/material';
import { DirectionsCar, CalendarToday, Person, LocationOn, Description } from '@mui/icons-material';

const VehicleDetails = ({ vehicle }) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <DirectionsCar sx={{ mr: 1 }} />
              <Typography variant="h6">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                License Plate:
              </Typography>
              <Chip
                label={vehicle.licensePlate}
                color="primary"
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                VIN:
              </Typography>
              <Typography variant="body2">{vehicle.vin}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <Person sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2">
                Owner: {vehicle.ownerName}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2">
                State: {vehicle.registrationState}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <CalendarToday sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2">
                Registration Expiry: {new Date(vehicle.registrationExpiry).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <Description sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2">
                Insurance: {vehicle.insuranceProvider}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Chip
              label={vehicle.status}
              color={vehicle.status === 'active' ? 'success' : 'warning'}
              size="small"
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VehicleDetails; 