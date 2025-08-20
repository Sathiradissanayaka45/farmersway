// Update src/pages/ExtraExpensesPage.js
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
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon
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
    expense_date: new Date()
  });
  const [editId, setEditId] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: ''
  });
  const [editingTypeId, setEditingTypeId] = useState(null);

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const [typesResponse, recordsResponse] = await Promise.all([
        api.get('/extra/expense-types'),
        api.get('/extra/expenses')
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

  const handleSubmit = async () => {
    try {
      if (!formData.expense_type_id || !formData.amount || !formData.expense_date) {
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
      setFormData({
        expense_type_id: '',
        amount: '',
        description: '',
        expense_date: new Date()
      });
      setEditId(null);
      fetchExpenseData();
    } catch (error) {
      console.error('Error saving expense record:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save expense record', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      expense_type_id: record.expense_type_id,
      amount: record.amount.toString(),
      description: record.description,
      expense_date: new Date(record.expense_date)
    });
    setEditId(record.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
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
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={record.expense_type_name} 
                          icon={<ReceiptIcon />} 
                          color="error"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        ₹{Number(record.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{record.description || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(record)}>
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(record.id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
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
                  {expenseTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <Chip 
                          label={type.name} 
                          icon={<CategoryIcon />} 
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{type.description || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEditType(type)}>
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteType(type.id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Add/Edit Expense Record Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editId ? 'Edit Expense Record' : 'Add New Expense Record'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Expense Type</InputLabel>
                <Select
                  name="expense_type_id"
                  value={formData.expense_type_id}
                  onChange={handleInputChange}
                  label="Expense Type"
                  required
                >
                  {expenseTypes.map(type => (
                    <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                sx={{ mb: 2 }}
                name="amount"
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />

              <DatePicker
                label="Expense Date"
                value={formData.expense_date}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />

              <TextField
                fullWidth
                sx={{ mb: 2 }}
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              setEditId(null);
              setFormData({
                expense_type_id: '',
                amount: '',
                description: '',
                expense_date: new Date()
              });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
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