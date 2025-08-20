import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CompleteMillingDialog from '../components/CompleteMillingDialog';

const MillingManagement = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [millingRecords, setMillingRecords] = useState([]);
  const [completedRecords, setCompletedRecords] = useState([]);
  const [riceVarieties, setRiceVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [formData, setFormData] = useState({
    rice_variety_id: '',
    quantity_kg: ''
  });
  const [tabValue, setTabValue] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [millingRes, completedRes, riceRes] = await Promise.all([
        api.get('/milling'),
        api.get('/milling/completed'),
        api.get('/rice')
      ]);
      
      const pendingRecords = millingRes.data.data.filter(record => record.status === 'pending');
      setMillingRecords(pendingRecords || []);
      setCompletedRecords(completedRes.data.data || []);
      setRiceVarieties(riceRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      enqueueSnackbar('Failed to fetch data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.rice_variety_id || !formData.quantity_kg) {
        enqueueSnackbar('Please select rice variety and enter quantity', { variant: 'error' });
        return;
      }

      setLoading(true);
      await api.post('/milling', formData);
      enqueueSnackbar('Milling record created successfully', { variant: 'success' });
      setOpenDialog(false);
      setFormData({
        rice_variety_id: '',
        quantity_kg: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating milling record:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to create milling record', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (data) => {
    try {
      setLoading(true);
      await api.post(`/milling/${completeDialog.id}/complete`, {
        output_rice_variety_id: data.output_rice_variety_id,
        returned_quantity_kg: data.returned_quantity_kg,
        notes: data.notes
      });
      
      enqueueSnackbar('Milling process completed successfully', { variant: 'success' });
      setCompleteDialog(null);
      fetchData();
    } catch (error) {
      console.error('Error completing milling process:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to complete milling process', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/milling/${deleteDialog.id}`);
      enqueueSnackbar('Milling record deleted successfully', { variant: 'success' });
      setDeleteDialog(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting milling record:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete milling record', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Milling Management
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Pending" />
          <Tab label="Completed" />
        </Tabs>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Milling Record
        </Button>
      </Box>

      {loading && <LinearProgress />}

      {tabValue === 0 && (
        <>
          {millingRecords.length === 0 && !loading ? (
            <Alert severity="info">No pending milling records found</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rice Variety</TableCell>
                    <TableCell align="right">Quantity (kg)</TableCell>
                    <TableCell>Milling Date</TableCell>
                    <TableCell>Recorded By</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {millingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {record.rice_variety_name || 'Unknown'}
                      </TableCell>
                      <TableCell align="right">{record.quantity_kg}</TableCell>
                      <TableCell>
                        {new Date(record.milling_date).toLocaleString()}
                      </TableCell>
                      <TableCell>{record.created_by_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label="Pending" 
                          color="warning" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Complete Process">
                          <IconButton 
                            onClick={() => setCompleteDialog(record)}
                            color="primary"
                            sx={{ mr: 1 }}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Record">
                          <IconButton 
                            onClick={() => setDeleteDialog(record)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tabValue === 1 && (
        <>
          {completedRecords.length === 0 && !loading ? (
            <Alert severity="info">No completed milling records found</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Input Rice</TableCell>
                    <TableCell align="right">Sent (kg)</TableCell>
                    <TableCell>Output Rice</TableCell>
                    <TableCell align="right">Returned (kg)</TableCell>
                    <TableCell>Completion Date</TableCell>
                    <TableCell>Completed By</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedRecords.map((record) => (
                    <TableRow key={record.milling_id}>
                      <TableCell>{record.input_rice_variety_name}</TableCell>
                      <TableCell align="right">{record.sent_quantity}</TableCell>
                      <TableCell>{record.output_rice_variety_name}</TableCell>
                      <TableCell align="right">{record.returned_quantity_kg}</TableCell>
                      <TableCell>
                        {new Date(record.completion_date).toLocaleString()}
                      </TableCell>
                      <TableCell>{record.completed_by}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            onClick={() => navigate(`/dashboard/milling/${record.milling_id}`)}
                            color="primary"
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Create Milling Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Milling Record</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Rice Variety</InputLabel>
              <Select
                name="rice_variety_id"
                value={formData.rice_variety_id}
                onChange={handleInputChange}
                label="Rice Variety"
                required
              >
                {riceVarieties.map(rice => (
                  <MenuItem key={rice.id} value={rice.id}>{rice.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              sx={{ mb: 2 }}
              name="quantity_kg"
              label="Quantity (kg)"
              type="number"
              value={formData.quantity_kg}
              onChange={handleInputChange}
              required
              inputProps={{ min: 0.1, step: 0.1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            Create Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Milling Dialog */}
      {completeDialog && (
        <CompleteMillingDialog
          open={Boolean(completeDialog)}
          onClose={() => setCompleteDialog(null)}
          onComplete={handleComplete}
          millingRecord={completeDialog}
          riceVarieties={riceVarieties}
          loading={loading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={Boolean(deleteDialog)} 
        onClose={() => setDeleteDialog(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this milling record?
          </Typography>
          {deleteDialog && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Rice Variety:</strong> {deleteDialog.rice_variety_name}
              </Typography>
              <Typography variant="body2">
                <strong>Quantity:</strong> {deleteDialog.quantity_kg} kg
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {new Date(deleteDialog.milling_date).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MillingManagement;