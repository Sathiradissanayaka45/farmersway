import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const MinStockDialog = ({ open, onClose, riceItem, onUpdate }) => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [minStock, setMinStock] = useState(riceItem?.min_stock_level || 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.put(`/rice/${riceItem.id}/min-stock`, {
        minStockLevel: parseFloat(minStock)
      });
      enqueueSnackbar('Minimum stock level updated', { variant: 'success' });
      onUpdate();
      onClose();
    } catch (error) {
      enqueueSnackbar('Failed to update minimum stock', { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Update Minimum Stock Level</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {riceItem?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current: {riceItem?.current_stock_kg} kg
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Minimum Stock Level (kg)"
            type="number"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            inputProps={{ min: 0, step: 0.1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MinStockDialog;