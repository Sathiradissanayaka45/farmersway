import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  TableHead
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const CompleteBoilingDialog = ({ 
  open, 
  onClose, 
  onComplete, 
  boilingRecord,
  loading 
}) => {
  const [returnedQuantity, setReturnedQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [missingDetails, setMissingDetails] = useState([]);
  const [currentDetail, setCurrentDetail] = useState({
    quantity_kg: '',
    reason: 'evaporation',
    description: ''
  });

  const handleAddMissingDetail = () => {
    if (!currentDetail.quantity_kg || parseFloat(currentDetail.quantity_kg) <= 0) {
      return;
    }

    setMissingDetails([...missingDetails, currentDetail]);
    setCurrentDetail({
      quantity_kg: '',
      reason: 'evaporation',
      description: ''
    });
  };

  const handleRemoveMissingDetail = (index) => {
    setMissingDetails(missingDetails.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!returnedQuantity || parseFloat(returnedQuantity) <= 0) {
      return;
    }

    const totalMissing = missingDetails.reduce(
      (sum, detail) => sum + parseFloat(detail.quantity_kg), 
      0
    );

    const expectedMissing = boilingRecord.quantity_kg - parseFloat(returnedQuantity);

    if (Math.abs(totalMissing - expectedMissing) > 0.01) {
      return;
    }

    onComplete({
      returned_quantity_kg: parseFloat(returnedQuantity),
      cost_amount: costAmount ? parseFloat(costAmount) : null,
      notes,
      missing_details: missingDetails
    });
  };

  const totalMissing = missingDetails.reduce(
    (sum, detail) => sum + parseFloat(detail.quantity_kg), 
    0
  );

  const expectedMissing = boilingRecord 
    ? boilingRecord.quantity_kg - parseFloat(returnedQuantity || 0)
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Complete Boiling Process</DialogTitle>
      <DialogContent>
        {boilingRecord && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Rice Variety:</strong> {boilingRecord.rice_variety_name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Sent Quantity:</strong> {boilingRecord.quantity_kg} kg
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          sx={{ mb: 3 }}
          label="Returned Quantity (kg)"
          type="number"
          value={returnedQuantity}
          onChange={(e) => setReturnedQuantity(e.target.value)}
          inputProps={{ min: 0, step: 0.1 }}
        />

        <TextField
          fullWidth
          sx={{ mb: 3 }}
          label="Completion Cost (Rs)"
          type="number"
          value={costAmount}
          onChange={(e) => setCostAmount(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
        />

        <TextField
          fullWidth
          sx={{ mb: 3 }}
          label="Notes"
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Typography variant="h6" gutterBottom>
          Missing Quantity Details
        </Typography>

        {expectedMissing > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Expected missing quantity: {expectedMissing.toFixed(2)} kg
          </Alert>
        )}

        {Math.abs(totalMissing - expectedMissing) > 0.01 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Total missing quantity ({totalMissing.toFixed(2)} kg) doesn't match expected missing quantity ({expectedMissing.toFixed(2)} kg)
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Quantity (kg)"
              type="number"
              value={currentDetail.quantity_kg}
              onChange={(e) => setCurrentDetail({
                ...currentDetail,
                quantity_kg: e.target.value
              })}
              sx={{ flex: 1 }}
              inputProps={{ min: 0, step: 0.1 }}
            />

            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Reason</InputLabel>
              <Select
                value={currentDetail.reason}
                onChange={(e) => setCurrentDetail({
                  ...currentDetail,
                  reason: e.target.value
                })}
                label="Reason"
              >
                <MenuItem value="evaporation">Evaporation</MenuItem>
                <MenuItem value="spillage">Spillage</MenuItem>
                <MenuItem value="quality_rejection">Quality Rejection</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <Button 
              onClick={handleAddMissingDetail}
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!currentDetail.quantity_kg || parseFloat(currentDetail.quantity_kg) <= 0}
            >
              Add
            </Button>
          </Box>

          <TextField
            fullWidth
            label="Description"
            value={currentDetail.description}
            onChange={(e) => setCurrentDetail({
              ...currentDetail,
              description: e.target.value
            })}
            sx={{ mb: 2 }}
          />
        </Box>

        {missingDetails.length > 0 && (
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Quantity (kg)</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {missingDetails.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>{detail.quantity_kg}</TableCell>
                    <TableCell>{detail.reason}</TableCell>
                    <TableCell>{detail.description}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleRemoveMissingDetail(index)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading || 
            !returnedQuantity || 
            parseFloat(returnedQuantity) <= 0 ||
            Math.abs(totalMissing - expectedMissing) > 0.01
          }
        >
          Complete Process
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompleteBoilingDialog;