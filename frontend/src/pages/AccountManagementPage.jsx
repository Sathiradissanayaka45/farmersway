import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AccountManagementPage = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type_id: '',
    parent_account_id: '',
    description: '',
    opening_balance: '0',
    is_active: true
  });

  useEffect(() => {
    fetchAccounts();
    fetchAccountTypes();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/accounts');
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      enqueueSnackbar('Failed to fetch accounts', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const response = await api.get('/accounting/account-types');
      setAccountTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching account types:', error);
    }
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setFormData({
      account_code: '',
      account_name: '',
      account_type_id: '',
      parent_account_id: '',
      description: '',
      opening_balance: '0',
      is_active: true
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (account) => {
    setDialogMode('edit');
    setSelectedAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type_id: account.account_type_id,
      parent_account_id: account.parent_account_id || '',
      description: account.description || '',
      opening_balance: account.opening_balance || '0',
      is_active: account.is_active
    });
    setOpenDialog(true);
  };

  const handleOpenView = (account) => {
    setDialogMode('view');
    setSelectedAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type_id: account.account_type_id,
      parent_account_id: account.parent_account_id || '',
      description: account.description || '',
      opening_balance: account.opening_balance || '0',
      is_active: account.is_active
    });
    setOpenDialog(true);
  };

  const handleOpenDelete = (account) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAccount(null);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        await api.post('/accounting/accounts', formData);
        enqueueSnackbar('Account created successfully', { variant: 'success' });
      } else if (dialogMode === 'edit') {
        await api.put(`/accounting/accounts/${selectedAccount.id}`, formData);
        enqueueSnackbar('Account updated successfully', { variant: 'success' });
      }
      handleCloseDialog();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save account', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/accounting/accounts/${selectedAccount.id}`);
      enqueueSnackbar('Account deleted successfully', { variant: 'success' });
      handleCloseDelete();
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete account', { variant: 'error' });
    }
  };

  const handleViewDetails = (accountId) => {
    navigate(`/dashboard/account-details/${accountId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'asset': return 'success';
      case 'liability': return 'error';
      case 'equity': return 'warning';
      case 'revenue': return 'info';
      case 'expense': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Chart of Accounts
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAccounts}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              New Account
            </Button>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Code</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Current Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {account.account_code}
                    </Typography>
                  </TableCell>
                  <TableCell>{account.account_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={account.account_type_name} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={account.category} 
                      size="small"
                      color={getCategoryColor(account.category)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      color={
                        (account.category === 'asset' || account.category === 'expense') && parseFloat(account.current_balance) > 0 ? 'success.main' :
                        (account.category === 'liability' || account.category === 'equity' || account.category === 'revenue') && parseFloat(account.current_balance) > 0 ? 'error.main' :
                        'textSecondary'
                      }
                    >
                      {formatCurrency(account.current_balance)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={account.is_active ? 'Active' : 'Inactive'} 
                      size="small"
                      color={account.is_active ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={() => handleViewDetails(account.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenEdit(account)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleOpenDelete(account)}
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

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {dialogMode === 'create' && 'Create New Account'}
            {dialogMode === 'edit' && 'Edit Account'}
            {dialogMode === 'view' && 'View Account'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Code"
                  name="account_code"
                  value={formData.account_code}
                  onChange={handleInputChange}
                  disabled={dialogMode === 'view'}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Name"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  disabled={dialogMode === 'view'}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required disabled={dialogMode === 'view'}>
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    name="account_type_id"
                    value={formData.account_type_id}
                    onChange={handleInputChange}
                    label="Account Type"
                  >
                    {accountTypes.map(type => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.category})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>Parent Account</InputLabel>
                  <Select
                    name="parent_account_id"
                    value={formData.parent_account_id}
                    onChange={handleInputChange}
                    label="Parent Account"
                  >
                    <MenuItem value="">None</MenuItem>
                    {accounts.map(account => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={dialogMode === 'view'}
                  multiline
                  rows={2}
                />
              </Grid>
              {dialogMode === 'create' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Opening Balance"
                    name="opening_balance"
                    type="number"
                    value={formData.opening_balance}
                    onChange={handleInputChange}
                    disabled={dialogMode === 'view'}
                    InputProps={{ inputProps: { step: "0.01" } }}
                  />
                </Grid>
              )}
              {dialogMode === 'edit' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="is_active"
                      value={formData.is_active}
                      onChange={handleInputChange}
                      label="Status"
                    >
                      <MenuItem value={true}>Active</MenuItem>
                      <MenuItem value={false}>Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            {dialogMode !== 'view' && (
              <Button onClick={handleSubmit} variant="contained">
                {dialogMode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDelete}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mt: 1 }}>
              Are you sure you want to delete account "{selectedAccount?.account_name}"?
              {selectedAccount?.current_balance !== '0.00' && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Warning: This account has a balance of {formatCurrency(selectedAccount?.current_balance)}.
                  Deleting it may affect your financial reports.
                </Typography>
              )}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDelete}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AccountManagementPage;