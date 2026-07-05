import React, { useState } from 'react';
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
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManualJournalEntryPage = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    entry_date: new Date(),
    description: '',
  });

  const [entryLines, setEntryLines] = useState([
    { account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
    { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }
  ]);

  const [accounts, setAccounts] = useState([]);

  // Fetch accounts on component mount
  React.useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounting/accounts');
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      enqueueSnackbar('Failed to fetch accounts', { variant: 'error' });
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
    
    // If debit is entered, clear credit and vice versa
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
    // Check all lines have accounts
    const hasEmptyAccounts = entryLines.some(line => !line.account_id);
    if (hasEmptyAccounts) {
      return 'All lines must have an account selected';
    }

    // Check all lines have amount
    const hasNoAmount = entryLines.some(line => 
      (parseFloat(line.debit_amount) || 0) <= 0 && (parseFloat(line.credit_amount) || 0) <= 0
    );
    if (hasNoAmount) {
      return 'All lines must have either debit or credit amount';
    }

    // Check debit equals credit
    const totals = calculateTotals();
    if (Math.abs(totals.debit - totals.credit) > 0.01) {
      return `Debit total (${totals.debit}) must equal Credit total (${totals.credit})`;
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
      setLoading(true);
      
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

      await api.post('/accounting/journal-entries/manual', payload);
      
      enqueueSnackbar('Journal entry created successfully', { variant: 'success' });
      navigate('/dashboard/accounting');
      
    } catch (error) {
      console.error('Error creating journal entry:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to create journal entry', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();
  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Create Manual Journal Entry
          </Typography>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

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
                  LKR {totals.debit.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Credit Total
                </Typography>
                <Typography variant="h6" color="error.main">
                  LKR {totals.credit.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Chip 
                  label={isBalanced ? 'BALANCED' : 'NOT BALANCED'} 
                  color={isBalanced ? 'success' : 'error'}
                  variant="outlined"
                />
                {!isBalanced && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    Difference: LKR {Math.abs(totals.debit - totals.credit).toFixed(2)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
              disabled={loading || !isBalanced}
            >
              Save Journal Entry
            </Button>
          </Box>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default ManualJournalEntryPage;