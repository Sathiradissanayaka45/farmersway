import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
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
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const EditJournalEntryPage = () => {
  const { id } = useParams();
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState([]);
  
  const [formData, setFormData] = useState({
    entry_date: new Date(),
    description: '',
  });

  const [entryLines, setEntryLines] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch journal entry details
      const entryResponse = await api.get(`/accounting/journal-entries/${id}`);
      const entry = entryResponse.data.data.entry;
      const lines = entryResponse.data.data.lines;
      
      setFormData({
        entry_date: new Date(entry.entry_date),
        description: entry.description || '',
      });
      
      setEntryLines(lines.map(line => ({
        account_id: line.account_id,
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount,
        description: line.description || ''
      })));

      // Fetch accounts
      const accountsResponse = await api.get('/accounting/accounts');
      setAccounts(accountsResponse.data.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      enqueueSnackbar('Failed to load journal entry', { variant: 'error' });
      navigate('/dashboard/accounting');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, entry_date: date }));
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...entryLines];
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: value
    };
    
    if (field === 'debit_amount' && parseFloat(value) > 0) {
      updatedLines[index].credit_amount = 0;
    } else if (field === 'credit_amount' && parseFloat(value) > 0) {
      updatedLines[index].debit_amount = 0;
    }
    
    setEntryLines(updatedLines);
  };

  const addLine = () => {
    setEntryLines([...entryLines, { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }]);
  };

  const removeLine = (index) => {
    if (entryLines.length > 2) {
      const updatedLines = [...entryLines];
      updatedLines.splice(index, 1);
      setEntryLines(updatedLines);
    } else {
      enqueueSnackbar('Journal entry must have at least 2 lines', { variant: 'warning' });
    }
  };

  const calculateTotals = () => {
    const totals = entryLines.reduce((acc, line) => {
      acc.debit += parseFloat(line.debit_amount) || 0;
      acc.credit += parseFloat(line.credit_amount) || 0;
      return acc;
    }, { debit: 0, credit: 0 });
    
    return totals;
  };

  const validateEntry = () => {
    const hasEmptyAccounts = entryLines.some(line => !line.account_id);
    if (hasEmptyAccounts) {
      return 'All lines must have an account selected';
    }

    const hasNoAmount = entryLines.some(line => 
      (parseFloat(line.debit_amount) || 0) <= 0 && (parseFloat(line.credit_amount) || 0) <= 0
    );
    if (hasNoAmount) {
      return 'All lines must have either debit or credit amount';
    }

    const totals = calculateTotals();
    if (Math.abs(totals.debit - totals.credit) > 0.01) {
      return `Debit total (${totals.debit.toFixed(2)}) must equal Credit total (${totals.credit.toFixed(2)})`;
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateEntry();
    if (validationError) {
      enqueueSnackbar(validationError, { variant: 'error' });
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        entry_date: formData.entry_date.toISOString().split('T')[0],
        description: formData.description,
        lines: entryLines.map(line => ({
          account_id: line.account_id,
          debit_amount: parseFloat(line.debit_amount) || 0,
          credit_amount: parseFloat(line.credit_amount) || 0,
          description: line.description || ''
        }))
      };

      await api.put(`/accounting/journal-entries/${id}`, payload);
      
      enqueueSnackbar('Journal entry updated successfully', { variant: 'success' });
      navigate('/dashboard/accounting');
      
    } catch (error) {
      console.error('Error updating journal entry:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to update journal entry', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/accounting/journal-entries/${id}`);
      enqueueSnackbar('Journal entry deleted successfully', { variant: 'success' });
      navigate('/dashboard/accounting');
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete journal entry', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Container>
        <LinearProgress />
      </Container>
    );
  }

  const totals = calculateTotals();
  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard/accounting')}
            >
              Back
            </Button>
            <Typography variant="h4">
              Edit Journal Entry
            </Typography>
          </Box>

          {(saving || loading) && <LinearProgress sx={{ mb: 3 }} />}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Entry Date *"
                  value={formData.entry_date}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter journal entry description..."
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Journal Entry Lines
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addLine}
              >
                Add Line
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell width="100">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entryLines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <InputLabel>Account *</InputLabel>
                          <Select
                            value={line.account_id}
                            onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                            label="Account *"
                          >
                            {accounts.map(account => (
                              <MenuItem key={account.id} value={account.id}>
                                {account.account_code} - {account.account_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={line.debit_amount}
                          onChange={(e) => handleLineChange(index, 'debit_amount', e.target.value)}
                          inputProps={{ step: "0.01", min: "0" }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={line.credit_amount}
                          onChange={(e) => handleLineChange(index, 'credit_amount', e.target.value)}
                          inputProps={{ step: "0.01", min: "0" }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={line.description}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => removeLine(index)}
                          color="error"
                          size="small"
                          disabled={entryLines.length <= 2}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: 'action.hover',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Debit Total
                </Typography>
                <Typography variant="h6" color="success.main">
                  ₹{totals.debit.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Credit Total
                </Typography>
                <Typography variant="h6" color="error.main">
                  ₹{totals.credit.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Chip 
                  label={isBalanced ? 'BALANCED' : 'NOT BALANCED'} 
                  color={isBalanced ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete Entry
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/dashboard/accounting')}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving || !isBalanced}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default EditJournalEntryPage;