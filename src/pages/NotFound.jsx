import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <Box textAlign="center">
        <Typography variant="h2" fontWeight={800}>404</Typography>
        <Typography variant="h6" color="text.secondary" mb={2}>
          We couldn’t find that page.
        </Typography>
        <Button variant="contained" component={Link} to="/">Go Home</Button>
      </Box>
    </Box>
  );
}
