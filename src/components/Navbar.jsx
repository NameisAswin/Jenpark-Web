import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const { isAuthenticated, signOut } = useAuth();
  return (
    <AppBar position="sticky" color="inherit" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, color: 'primary.main', textDecoration: 'none', fontWeight: 700 }}
        >
          JenPark
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button component={RouterLink} to="/dashboard">Dashboard</Button>
          <Button component={RouterLink} to="/vehicles">Vehicles</Button>
          {isAuthenticated ? (
            <Button variant="outlined" onClick={signOut}>Sign Out</Button>
          ) : (
            <Button variant="contained" component={RouterLink} to="/login">
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
