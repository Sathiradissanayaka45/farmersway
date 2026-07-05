// Updated ExtraIncomePage.js with quantity, unit price, and payment method fields
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
  Alert,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
  Calculate as CalculateIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import TypeManagementDialog from '../components/TypeManagementDialog';

const ExtraIncomePage = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [formData, setFormData] = useState({
    income_type_id: '',
    amount: '',
    quantity: '',
    unit_price: '',
    description: '',
    income_date: new Date(),
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
    income_type_id: ''
  });

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Apply filters
      if (filters.payment_method) params.payment_method = filters.payment_method;
      if (filters.income_type_id) params.income_type_id = filters.income_type_id;
      if (filters.start_date) params.start_date = filters.start_date.toISOString().split('T')[0];
      if (filters.end_date) params.end_date = filters.end_date.toISOString().split('T')[0];

      const [typesResponse, recordsResponse] = await Promise.all([
        api.get('/extra/income-types'),
        api.get('/extra/income', { params })
      ]);
      setIncomeTypes(typesResponse.data.data || []);
      setIncomeRecords(recordsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching income data:', error);
      enqueueSnackbar('Failed to fetch income data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    // Calculate amount if quantity and unit_price are both entered
    if ((name === 'quantity' || name === 'unit_price') && 
        (newFormData.quantity || name === 'quantity') && 
        (newFormData.unit_price || name === 'unit_price')) {
      
      const quantity = parseFloat(newFormData.quantity) || 0;
      const unitPrice = parseFloat(newFormData.unit_price) || 0;
      
      if (quantity > 0 && unitPrice > 0) {
        newFormData.amount = (quantity * unitPrice).toFixed(2);
      }
    }
    
    setFormData(newFormData);
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, income_date: date }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      payment_method: '',
      start_date: null,
      end_date: null,
      income_type_id: ''
    });
  };

  const applyFilters = () => {
    fetchIncomeData();
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

  const calculateAmount = () => {
    if (formData.quantity && formData.unit_price) {
      const quantity = parseFloat(formData.quantity) || 0;
      const unitPrice = parseFloat(formData.unit_price) || 0;
      return quantity * unitPrice;
    }
    return 0;
  };

  const handleSubmit = async () => {
    try {
      if (!formData.income_type_id || !formData.income_date || !formData.payment_method) {
        enqueueSnackbar('Please fill all required fields', { variant: 'error' });
        return;
      }

      // Validate that either amount is entered or both quantity and unit price
      if (!formData.amount && (!formData.quantity || !formData.unit_price)) {
        enqueueSnackbar('Please enter either amount or both quantity and unit price', { variant: 'error' });
        return;
      }

      setLoading(true);
      const payload = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : '',
        quantity: formData.quantity ? parseFloat(formData.quantity) : '',
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : ''
      };

      if (editId) {
        await api.put(`/extra/income/${editId}`, payload);
        enqueueSnackbar('Income record updated successfully', { variant: 'success' });
      } else {
        await api.post('/extra/income', payload);
        enqueueSnackbar('Income record added successfully', { variant: 'success' });
      }

      setOpenDialog(false);
      resetForm();
      fetchIncomeData();
    } catch (error) {
      console.error('Error saving income record:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save income record', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      income_type_id: '',
      amount: '',
      quantity: '',
      unit_price: '',
      description: '',
      income_date: new Date(),
      payment_method: 'cash',
      payment_reference: ''
    });
    setEditId(null);
  };

  const handleEdit = (record) => {
    setFormData({
      income_type_id: record.income_type_id,
      amount: record.amount ? record.amount.toString() : '',
      quantity: record.quantity ? record.quantity.toString() : '',
      unit_price: record.unit_price ? record.unit_price.toString() : '',
      description: record.description || '',
      income_date: new Date(record.income_date),
      payment_method: record.payment_method || 'cash',
      payment_reference: record.payment_reference || ''
    });
    setEditId(record.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income record?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/extra/income/${id}`);
      enqueueSnackbar('Income record deleted successfully', { variant: 'success' });
      fetchIncomeData();
    } catch (error) {
      console.error('Error deleting income record:', error);
      enqueueSnackbar('Failed to delete income record', { variant: 'error' });
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
        await api.put(`/extra/income-types/${editingTypeId}`, typeFormData);
        enqueueSnackbar('Income type updated successfully', { variant: 'success' });
      } else {
        await api.post('/extra/income-types', typeFormData);
        enqueueSnackbar('Income type created successfully', { variant: 'success' });
      }
      setOpenTypeDialog(false);
      fetchIncomeData();
    } catch (error) {
      console.error('Error saving income type:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save income type', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income type? This will not delete associated records.')) return;
    
    try {
      setLoading(true);
      await api.delete(`/extra/income-types/${id}`);
      enqueueSnackbar('Income type deleted successfully', { variant: 'success' });
      fetchIncomeData();
    } catch (error) {
      console.error('Error deleting income type:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete income type', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalAmount = incomeRecords.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
  const cashAmount = incomeRecords
    .filter(r => r.payment_method === 'cash')
    .reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
  const bankAmount = incomeRecords
    .filter(r => r.payment_method === 'bank_transfer')
    .reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
  const mobileAmount = incomeRecords
    .filter(r => r.payment_method === 'mobile_payment')
    .reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Extra Income Management
        </Typography>

        {/* Summary Cards */}
        {/* <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Income
                </Typography>
                <Typography variant="h5" color="success.main">
                  ₹{totalAmount.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  {incomeRecords.length} records
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cash Payments
                </Typography>
                <Typography variant="h5">
                  ₹{cashAmount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Bank Transfers
                </Typography>
                <Typography variant="h5" color="primary.main">
                  ₹{bankAmount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Mobile Payments
                </Typography>
                <Typography variant="h5" color="secondary.main">
                  ₹{mobileAmount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid> */}

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="Income Records" />
          <Tab label="Income Types" />
        </Tabs>

        {tabValue === 0 ? (
          <>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Income Records ({incomeRecords.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetForm();
                  setOpenDialog(true);
                }}
              >
                Add Income Record
              </Button>
            </Box>

            {loading && <LinearProgress />}

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Income Type</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Recorded By</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>
                          No income records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeRecords.map((record) => {
                      const calculatedAmount = record.quantity && record.unit_price 
                        ? (parseFloat(record.quantity) * parseFloat(record.unit_price)).toFixed(2)
                        : null;
                      
                      return (
                        <TableRow key={record.id} hover>
                          <TableCell>
                            {new Date(record.income_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={record.income_type_name} 
                              icon={<AttachMoneyIcon />} 
                              color="success"
                              size="small"
                            />
                            {record.quantity && record.unit_price && (
                              <Tooltip title="Calculated from quantity & price">
                                <CalculateIcon fontSize="small" color="info" sx={{ ml: 1, verticalAlign: 'middle' }} />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {record.quantity ? `${parseFloat(record.quantity).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {record.unit_price ? `₹${parseFloat(record.unit_price).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                ₹{parseFloat(record.amount).toFixed(2)}
                              </Typography>
                              {calculatedAmount && calculatedAmount !== parseFloat(record.amount).toFixed(2) && (
                                <Typography variant="caption" color="textSecondary">
                                  (Calc: ₹{calculatedAmount})
                                </Typography>
                              )}
                            </Box>
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Income Types ({incomeTypes.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateType}
              >
                Add Income Type
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
                  {incomeTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>
                          No income types found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeTypes.map((type) => (
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

        {/* Add/Edit Income Record Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editId ? 'Edit Income Record' : 'Add New Income Record'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Income Type *</InputLabel>
                    <Select
                      name="income_type_id"
                      value={formData.income_type_id}
                      onChange={handleInputChange}
                      label="Income Type *"
                    >
                      {incomeTypes.map(type => (
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

              <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="quantity"
                    label="Quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    inputProps={{ step: "0.01", min: "0" }}
                    helperText="Optional"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="unit_price"
                    label="Unit Price (₹)"
                    type="number"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    inputProps={{ step: "0.01", min: "0" }}
                    helperText="Optional"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="amount"
                    label="Total Amount (₹) *"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    inputProps={{ step: "0.01", min: "0" }}
                    helperText="Enter amount or quantity & price"
                  />
                </Grid>
              </Grid>

              {(formData.quantity && formData.unit_price) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Calculated Amount: ₹{calculateAmount().toFixed(2)}
                  </Typography>
                  {parseFloat(formData.amount) !== calculateAmount() && (
                    <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                      Note: This is different from the entered amount
                    </Typography>
                  )}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Income Date *"
                    value={formData.income_date}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
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
              </Grid>

              <TextField
                fullWidth
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Enter any additional details about this income..."
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
              disabled={loading || !formData.income_type_id || !formData.income_date || !formData.payment_method || (!formData.amount && (!formData.quantity || !formData.unit_price))}
            >
              {editId ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Income Type Management Dialog */}
        <TypeManagementDialog
          open={openTypeDialog}
          onClose={() => setOpenTypeDialog(false)}
          title={editingTypeId ? 'Edit Income Type' : 'Create New Income Type'}
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

export default ExtraIncomePage;