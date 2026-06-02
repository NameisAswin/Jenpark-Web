import { Box, Typography, Grid, Card, CardContent } from '@mui/material';

const TILES = [
  { title: 'My Vehicles', desc: 'View and manage your registered vehicles' },
  { title: 'Active Parking', desc: 'See the status of ongoing parking sessions' },
  { title: 'Recent Activity', desc: 'Latest bookings, payments, and notifications' },
];

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Welcome to JenPark.
      </Typography>
      <Grid container spacing={2}>
        {TILES.map((t) => (
          <Grid item xs={12} md={4} key={t.title}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>
                  {t.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {t.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
