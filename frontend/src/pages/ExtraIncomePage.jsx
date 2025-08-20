// Update src/pages/ExtraIncomePage.js
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
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon
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
    description: '',
    income_date: new Date()
  });
  const [editId, setEditId] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: ''
  });
  const [editingTypeId, setEditingTypeId] = useState(null);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const [typesResponse, recordsResponse] = await Promise.all([
        api.get('/extra/income-types'),
        api.get('/extra/income')
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, income_date: date }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.income_type_id || !formData.amount || !formData.income_date) {
        enqueueSnackbar('Please fill all required fields', { variant: 'error' });
        return;
      }

      setLoading(true);
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editId) {
        await api.put(`/extra/income/${editId}`, payload);
        enqueueSnackbar('Income record updated successfully', { variant: 'success' });
      } else {
        await api.post('/extra/income', payload);
        enqueueSnackbar('Income record added successfully', { variant: 'success' });
      }

      setOpenDialog(false);
      setFormData({
        income_type_id: '',
        amount: '',
        description: '',
        income_date: new Date()
      });
      setEditId(null);
      fetchIncomeData();
    } catch (error) {
      console.error('Error saving income record:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save income record', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      income_type_id: record.income_type_id,
      amount: record.amount.toString(),
      description: record.description,
      income_date: new Date(record.income_date)
    });
    setEditId(record.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Extra Income Management
        </Typography>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="Income Records" />
          <Tab label="Income Types" />
        </Tabs>

        {tabValue === 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
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
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.income_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={record.income_type_name} 
                          icon={<AttachMoneyIcon />} 
                          color="success"
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
                  {incomeTypes.map((type) => (
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

        {/* Add/Edit Income Record Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editId ? 'Edit Income Record' : 'Add New Income Record'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Income Type</InputLabel>
                <Select
                  name="income_type_id"
                  value={formData.income_type_id}
                  onChange={handleInputChange}
                  label="Income Type"
                  required
                >
                  {incomeTypes.map(type => (
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
                label="Income Date"
                value={formData.income_date}
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
                income_type_id: '',
                amount: '',
                description: '',
                income_date: new Date()
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