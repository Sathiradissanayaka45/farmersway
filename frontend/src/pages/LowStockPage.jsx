import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import MinStockDialog from '../components/MinStockDialog';

const LowStockPage = () => {
  const { api } = useAuth();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState({
    open: false,
    riceItem: null
  });

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory/low-stock');
      setLowStockItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleUpdateMinStock = () => {
    fetchLowStock();
    setEditDialog({ open: false, riceItem: null });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Low Stock Items
      </Typography>

      {loading && <LinearProgress />}

      {lowStockItems.length === 0 && !loading && (
        <Alert severity="info">No items below minimum stock level</Alert>
      )}

      {lowStockItems.length > 0 && (
        <Paper sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rice Variety</TableCell>
                  <TableCell align="right">Current Stock</TableCell>
                  <TableCell align="right">Minimum Level</TableCell>
                  <TableCell align="right">Difference</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon color="warning" sx={{ mr: 1 }} />
                        {item.name}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{item.current_stock_kg} kg</TableCell>
                    <TableCell align="right">{item.min_stock_level} kg</TableCell>
                    <TableCell align="right" sx={{ 
                      color: item.current_stock_kg < item.min_stock_level ? 'error.main' : 'inherit'
                    }}>
                      {(item.current_stock_kg - item.min_stock_level).toFixed(2)} kg
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Minimum Stock">
                        <IconButton onClick={() => setEditDialog({
                          open: true,
                          riceItem: item
                        })}>
                          <EditIcon color="secondary" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <MinStockDialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, riceItem: null })}
        riceItem={editDialog.riceItem}
        onUpdate={handleUpdateMinStock}
      />
    </Box>
  );
};

export default LowStockPage;