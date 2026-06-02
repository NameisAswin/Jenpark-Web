import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const PLACEHOLDER_ROWS = [
  { id: 'V-1001', plate: 'MH12 AB 1234', type: 'Sedan', status: 'Active' },
  { id: 'V-1002', plate: 'KA01 CD 5678', type: 'SUV', status: 'Idle' },
  { id: 'V-1003', plate: 'DL02 EF 9012', type: 'Hatchback', status: 'Active' },
];

export default function VehicleListPage() {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={700}>Vehicles</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Vehicle
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Plate</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PLACEHOLDER_ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.plate}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>
                  <Chip
                    label={row.status}
                    color={row.status === 'Active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
