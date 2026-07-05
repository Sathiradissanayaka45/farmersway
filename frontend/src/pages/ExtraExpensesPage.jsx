// Updated ExtraExpensesPage.js with payment method support
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
  Chip,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import TypeManagementDialog from '../components/TypeManagementDialog';

const ExtraExpensesPage = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [formData, setFormData] = useState({
    expense_type_id: '',
    amount: '',
    description: '',
    expense_date: new Date(),
    payment_method: 'cash',
    payment_reference: ''
  });
  const [editId, setEditId] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: ''
  });
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [filters, setFilters] = useState({
    payment_method: '',
    start_date: null,
    end_date: null,
    expense_type_id: ''
  });

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Apply filters
      if (filters.payment_method) params.payment_method = filters.payment_method;
      if (filters.expense_type_id) params.expense_type_id = filters.expense_type_id;
      if (filters.start_date) params.start_date = filters.start_date.toISOString().split('T')[0];
      if (filters.end_date) params.end_date = filters.end_date.toISOString().split('T')[0];

      const [typesResponse, recordsResponse] = await Promise.all([
        api.get('/extra/expense-types'),
        api.get('/extra/expenses', { params })
      ]);
      setExpenseTypes(typesResponse.data.data || []);
      setExpenseRecords(recordsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching expense data:', error);
      enqueueSnackbar('Failed to fetch expense data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, expense_date: date }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      payment_method: '',
      start_date: null,
      end_date: null,
      expense_type_id: ''
    });
  };

  const applyFilters = () => {
    fetchExpenseData();
  };

  const getPaymentMethodColor = (method) => {
    switch(method) {
      case 'cash': return 'default';
      case 'bank_transfer': return 'primary';
      case 'mobile_payment': return 'secondary';
      case 'cheque': return 'warning';
      case 'other': return 'info';
      default: return 'default';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'cash': return '💰';
      case 'bank_transfer': return '🏦';
      case 'mobile_payment': return '📱';
      case 'cheque': return '📄';
      case 'other': return '🔧';
      default: return '💰';
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.expense_type_id || !formData.amount || !formData.expense_date || !formData.payment_method) {
        enqueueSnackbar('Please fill all required fields', { variant: 'error' });
        return;
      }

      setLoading(true);
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editId) {
        await api.put(`/extra/expenses/${editId}`, payload);
        enqueueSnackbar('Expense record updated successfully', { variant: 'success' });
      } else {
        await api.post('/extra/expenses', payload);
        enqueueSnackbar('Expense record added successfully', { variant: 'success' });
      }

      setOpenDialog(false);
      resetForm();
      fetchExpenseData();
    } catch (error) {
      console.error('Error saving expense record:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save expense record', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      expense_type_id: '',
      amount: '',
      description: '',
      expense_date: new Date(),
      payment_method: 'cash',
      payment_reference: ''
    });
    setEditId(null);
  };

  const handleEdit = (record) => {
    setFormData({
      expense_type_id: record.expense_type_id,
      amount: record.amount.toString(),
      description: record.description || '',
      expense_date: new Date(record.expense_date),
      payment_method: record.payment_method || 'cash',
      payment_reference: record.payment_reference || ''
    });
    setEditId(record.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/extra/expenses/${id}`);
      enqueueSnackbar('Expense record deleted successfully', { variant: 'success' });
      fetchExpenseData();
    } catch (error) {
      console.error('Error deleting expense record:', error);
      enqueueSnackbar('Failed to delete expense record', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = () => {
    setTypeFormData({ name: '', description: '' });
    setEditingTypeId(null);
    setOpenTypeDialog(true);
  };

  const handleEditType = (type) => {
    setTypeFormData({
      name: type.name,
      description: type.description || ''
    });
    setEditingTypeId(type.id);
    setOpenTypeDialog(true);
  };

  const handleSubmitType = async () => {
    try {
      setLoading(true);
      if (editingTypeId) {
        await api.put(`/extra/expense-types/${editingTypeId}`, typeFormData);
        enqueueSnackbar('Expense type updated successfully', { variant: 'success' });
      } else {
        await api.post('/extra/expense-types', typeFormData);
        enqueueSnackbar('Expense type created successfully', { variant: 'success' });
      }
      setOpenTypeDialog(false);
      fetchExpenseData();
    } catch (error) {
      console.error('Error saving expense type:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save expense type', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense type? This will not delete associated records.')) return;
    
    try {
      setLoading(true);
      await api.delete(`/extra/expense-types/${id}`);
      enqueueSnackbar('Expense type deleted successfully', { variant: 'success' });
      fetchExpenseData();
    } catch (error) {
      console.error('Error deleting expense type:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete expense type', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalAmount = expenseRecords.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
  const cashAmount = expenseRecords
    .filter(r => r.payment_method === 'cash')
    .reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
  const bankAmount = expenseRecords
    .filter(r => r.payment_method === 'bank_transfer')
    .reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
  const mobileAmount = expenseRecords
    .filter(r => r.payment_method === 'mobile_payment')
    .reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Extra Expenses Management
        </Typography>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="Expense Records" />
          <Tab label="Expense Types" />
        </Tabs>

        {tabValue === 0 ? (
          <>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Expense Records ({expenseRecords.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetForm();
                  setOpenDialog(true);
                }}
              >
                Add Expense Record
              </Button>
            </Box>

            {loading && <LinearProgress />}

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Expense Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Recorded By</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>
                          No expense records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseRecords.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          {new Date(record.expense_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={record.expense_type_name} 
                            icon={<ReceiptIcon />} 
                            color="error"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="error.main">
                            ₹{Number(record.amount).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: 4 }}>{getPaymentMethodIcon(record.payment_method)}</span>
                                {record.payment_method?.replace('_', ' ') || 'cash'}
                              </Box>
                            }
                            size="small"
                            color={getPaymentMethodColor(record.payment_method)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {record.payment_reference ? (
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {record.payment_reference}
                            </Typography>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.description ? (
                            <Tooltip title={record.description}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {record.description}
                              </Typography>
                            </Tooltip>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.recorded_by_name || '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton 
                              onClick={() => handleEdit(record)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              onClick={() => handleDelete(record.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Expense Types ({expenseTypes.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateType}
              >
                Add Expense Type
              </Button>
            </Box>

            {loading && <LinearProgress />}

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>
                          No expense types found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseTypes.map((type) => (
                      <TableRow key={type.id} hover>
                        <TableCell>
                          <Chip 
                            label={type.name} 
                            icon={<CategoryIcon />} 
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {type.description || '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton 
                              onClick={() => handleEditType(type)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              onClick={() => handleDeleteType(type.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Add/Edit Expense Record Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editId ? 'Edit Expense Record' : 'Add New Expense Record'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Expense Type *</InputLabel>
                    <Select
                      name="expense_type_id"
                      value={formData.expense_type_id}
                      onChange={handleInputChange}
                      label="Expense Type *"
                    >
                      {expenseTypes.map(type => (
                        <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method *</InputLabel>
                    <Select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      label="Payment Method *"
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="mobile_payment">Mobile Payment</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="amount"
                    label="Amount (₹) *"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    inputProps={{ step: "0.01", min: "0" }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Expense Date *"
                    value={formData.expense_date}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="payment_reference"
                    label="Payment Reference"
                    value={formData.payment_reference}
                    onChange={handleInputChange}
                    helperText="Transaction ID, UPI Ref, Cheque No."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* Empty for alignment */}
                </Grid>
              </Grid>

              <TextField
                fullWidth
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Enter details about this expense..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => {
                setOpenDialog(false);
                resetForm();
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !formData.expense_type_id || !formData.amount || !formData.expense_date || !formData.payment_method}
            >
              {editId ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Expense Type Management Dialog */}
        <TypeManagementDialog
          open={openTypeDialog}
          onClose={() => setOpenTypeDialog(false)}
          title={editingTypeId ? 'Edit Expense Type' : 'Create New Expense Type'}
          typeName={typeFormData.name}
          setTypeName={(value) => setTypeFormData(prev => ({ ...prev, name: value }))}
          typeDescription={typeFormData.description}
          setTypeDescription={(value) => setTypeFormData(prev => ({ ...prev, description: value }))}
          onSubmit={handleSubmitType}
          loading={loading}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default ExtraExpensesPage;