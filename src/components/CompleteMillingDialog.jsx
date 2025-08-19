import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box
} from '@mui/material';

const CompleteMillingDialog = ({ open, onClose, onComplete, millingRecord, riceVarieties, loading }) => {
  const [formData, setFormData] = useState({
    output_rice_variety_id: '',
    returned_quantity_kg: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.output_rice_variety_id || !formData.returned_quantity_kg) {
      return;
    }
    onComplete(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Milling Process</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Input Rice: {millingRecord.rice_variety_name}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Quantity Sent: {millingRecord.quantity_kg} kg
          </Typography>

          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Output Rice Variety</InputLabel>
            <Select
              name="output_rice_variety_id"
              value={formData.output_rice_variety_id}
              onChange={handleChange}
              label="Output Rice Variety"
              required
            >
              {riceVarieties
                .filter(rice => rice.id !== millingRecord.rice_variety_id)
                .map(rice => (
                  <MenuItem key={rice.id} value={rice.id}>{rice.name}</MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            name="returned_quantity_kg"
            label="Returned Quantity (kg)"
            type="number"
            value={formData.returned_quantity_kg}
            onChange={handleChange}
            required
            inputProps={{ 
              min: 0.1, 
              max: millingRecord.quantity_kg,
              step: 0.1
            }}
            helperText={`Maximum: ${millingRecord.quantity_kg} kg`}
          />

          <TextField
            fullWidth
            sx={{ mb: 2 }}
            name="notes"
            label="Notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.output_rice_variety_id || !formData.returned_quantity_kg}
        >
          Complete Process
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompleteMillingDialog;