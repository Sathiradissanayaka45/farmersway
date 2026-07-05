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
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import MinStockDialog from '../components/MinStockDialog';

const InventoryManagement = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [riceVarieties, setRiceVarieties] = useState([]);
  const [riceTypes, setRiceTypes] = useState([]); // Add rice types state
  const [filteredRiceVarieties, setFilteredRiceVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riceTypesLoading, setRiceTypesLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    riceVarietyId: '',
    adjustment: '',
    notes: ''
  });
  const [historyData, setHistoryData] = useState([]);
  const [editMinStockDialog, setEditMinStockDialog] = useState({
    open: false,
    riceItem: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riceTypeFilter, setRiceTypeFilter] = useState('all');

  // Fetch rice types from database
  const fetchRiceTypes = async () => {
    try {
      setRiceTypesLoading(true);
      const response = await api.get('/rice-types');
      if (response.data && response.data.success) {
        setRiceTypes(response.data.data);
      } else {
        enqueueSnackbar('Failed to load rice types', { 
          variant: 'warning',
          autoHideDuration: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching rice types:', error);
      enqueueSnackbar('Failed to fetch rice types. Please check if rice-types API is working.', { 
        variant: 'error',
        autoHideDuration: 5000
      });
      // Set default types as fallback
      setRiceTypes([
        { id: 1, name: 'paddy', description: 'Raw paddy rice' },
        { id: 2, name: 'selling', description: 'Selling quality rice' }
      ]);
    } finally {
      setRiceTypesLoading(false);
    }
  };

  const fetchRiceVarieties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rice'); // Changed from '/inventory' to '/rice'
      
      if (response.data && response.data.success) {
        const varieties = response.data.data || [];
        setRiceVarieties(varieties);
        setFilteredRiceVarieties(varieties);
      } else {
        enqueueSnackbar('No rice varieties data received', { 
          variant: 'warning',
          autoHideDuration: 2000
        });
        setRiceVarieties([]);
        setFilteredRiceVarieties([]);
      }
    } catch (error) {
      console.error('Error fetching rice varieties:', error);
      enqueueSnackbar('Failed to fetch inventory data', { variant: 'error' });
      setRiceVarieties([]);
      setFilteredRiceVarieties([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch adjustment history
  const fetchAdjustmentHistory = async (riceId) => {
    try {
      setLoading(true);
      const response = await api.get(`/inventory/adjustments?riceId=${riceId}`);
      setHistoryData(response.data.data || []);
      setOpenHistoryDialog(true);
    } catch (error) {
      console.error('Error fetching adjustment history:', error);
      enqueueSnackbar('Failed to fetch adjustment history', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiceTypes();
    fetchRiceVarieties();
  }, []);

  // Apply filters whenever searchTerm, statusFilter, or riceTypeFilter changes
  useEffect(() => {
    let filtered = riceVarieties;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(rice => 
        rice.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rice => {
        if (statusFilter === 'low') {
          return rice.current_stock_kg <= rice.min_stock_level;
        } else {
          return rice.current_stock_kg > rice.min_stock_level;
        }
      });
    }
    
    // Apply rice type filter - updated to use rice_type_id
    if (riceTypeFilter !== 'all') {
      filtered = filtered.filter(rice => 
        rice.rice_type?.toString() === riceTypeFilter || 
        rice.rice_type_id?.toString() === riceTypeFilter
      );
    }
    
    setFilteredRiceVarieties(filtered);
  }, [searchTerm, statusFilter, riceTypeFilter, riceVarieties]);

  const handleAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAdjustment = async () => {
    try {
      if (!adjustmentForm.riceVarietyId || !adjustmentForm.adjustment) {
        enqueueSnackbar('Please select rice variety and enter adjustment amount', { variant: 'error' });
        return;
      }

      setLoading(true);
      // Use the updated endpoint from rice controller
      await api.put(`/rice/${adjustmentForm.riceVarietyId}/stock`, {
        adjustment: parseFloat(adjustmentForm.adjustment),
        notes: adjustmentForm.notes
      });

      enqueueSnackbar('Inventory adjusted successfully', { variant: 'success' });
      setOpenDialog(false);
      setAdjustmentForm({
        riceVarietyId: '',
        adjustment: '',
        notes: ''
      });
      fetchRiceVarieties();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to adjust inventory', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Get rice type name by ID
  const getRiceTypeName = (riceTypeId) => {
    if (!riceTypeId) return 'Unknown';
    const type = riceTypes.find(t => t.id === riceTypeId);
    return type ? type.name : 'Unknown';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Inventory Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={riceTypesLoading}
        >
          Adjust Inventory
        </Button>
        <Button
          variant="outlined"
          startIcon={<WarningIcon />}
          onClick={() => {
            const lowStockItems = riceVarieties.filter(item => 
              item.current_stock_kg <= item.min_stock_level
            );
            if (lowStockItems.length === 0) {
              enqueueSnackbar('No low stock items', { variant: 'info' });
            } else {
              enqueueSnackbar(
                `${lowStockItems.length} item(s) below minimum stock level`, 
                { variant: 'warning' }
              );
            }
          }}
        >
          Check Low Stock
        </Button>
      </Box>

      {/* Filter Controls */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search rice varieties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            minWidth: 250,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Filter by Status"
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="low">Low Stock</MenuItem>
            <MenuItem value="ok">Stock OK</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Rice Type</InputLabel>
          <Select
            value={riceTypeFilter}
            onChange={(e) => setRiceTypeFilter(e.target.value)}
            label="Filter by Rice Type"
            sx={{ borderRadius: 2 }}
            disabled={riceTypesLoading}
          >
            <MenuItem value="all">All Types</MenuItem>
            {riceTypes.map((type) => (
              <MenuItem key={type.id} value={type.id.toString()}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rice Variety</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Current Stock (kg)</TableCell>
              <TableCell align="right">Min Stock Level</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRiceVarieties.map((rice) => (
              <TableRow key={rice.id}>
                <TableCell>{rice.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={getRiceTypeName(rice.rice_type || rice.rice_type_id)} 
                    color={getRiceTypeName(rice.rice_type || rice.rice_type_id)?.toLowerCase() === 'paddy' ? 'primary' : 'secondary'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right">
                  {parseFloat(rice.current_stock_kg || 0).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  {parseFloat(rice.min_stock_level || 100).toFixed(2)}
                </TableCell>
                <TableCell align="center">
                  {rice.current_stock_kg <= rice.min_stock_level ? (
                    <Chip label="Low Stock" color="error" size="small" />
                  ) : (
                    <Chip label="OK" color="success" size="small" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Adjustment History">
                    <IconButton 
                      onClick={() => fetchAdjustmentHistory(rice.id)}
                      size="small"
                    >
                      <HistoryIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Minimum Stock">
                    <IconButton 
                      onClick={() => setEditMinStockDialog({
                        open: true,
                        riceItem: rice
                      })}
                      size="small"
                    >
                      <EditIcon color="secondary" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredRiceVarieties.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    No rice varieties found. {riceTypes.length === 0 ? 'Please add rice types first.' : 'Add rice varieties to get started.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Adjustment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Rice Variety *</InputLabel>
              <Select
                name="riceVarietyId"
                value={adjustmentForm.riceVarietyId}
                onChange={handleAdjustmentChange}
                label="Rice Variety *"
                required
                disabled={riceTypesLoading || loading}
              >
                {riceVarieties.map(rice => (
                  <MenuItem key={rice.id} value={rice.id}>
                    {rice.name} ({getRiceTypeName(rice.rice_type || rice.rice_type_id)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              sx={{ mb: 2 }}
              name="adjustment"
              label="Adjustment Amount (kg) *"
              type="number"
              value={adjustmentForm.adjustment}
              onChange={handleAdjustmentChange}
              required
              helperText="Use positive number to add stock, negative to remove"
              disabled={loading}
              inputProps={{ step: "0.01" }}
            />

            <TextField
              fullWidth
              sx={{ mb: 2 }}
              name="notes"
              label="Notes"
              value={adjustmentForm.notes}
              onChange={handleAdjustmentChange}
              multiline
              rows={3}
              disabled={loading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitAdjustment}
            variant="contained"
            disabled={loading || !adjustmentForm.riceVarietyId || !adjustmentForm.adjustment}
          >
            {loading ? 'Processing...' : 'Save Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog 
        open={openHistoryDialog} 
        onClose={() => setOpenHistoryDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Inventory Adjustment History</DialogTitle>
        <DialogContent>
          {historyData.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No adjustment history found for this rice variety.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Adjustment</TableCell>
                    <TableCell>Previous Stock</TableCell>
                    <TableCell>New Stock</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Adjusted By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.adjustment_date).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${item.adjustment_amount > 0 ? '+' : ''}${parseFloat(item.adjustment_amount).toFixed(2)}kg`}
                          color={item.adjustment_amount > 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{parseFloat(item.previous_stock).toFixed(2)}kg</TableCell>
                      <TableCell>{parseFloat(item.new_stock).toFixed(2)}kg</TableCell>
                      <TableCell>{item.notes || '-'}</TableCell>
                      <TableCell>{item.adjusted_by_name || 'System'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      <MinStockDialog
        open={editMinStockDialog.open}
        onClose={() => setEditMinStockDialog({ open: false, riceItem: null })}
        riceItem={editMinStockDialog.riceItem}
        onUpdate={fetchRiceVarieties}
      />
    </Box>
  );
};

export default InventoryManagement;