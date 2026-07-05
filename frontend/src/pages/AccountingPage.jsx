import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  Divider
} from '@mui/material';
import {
  AttachMoney,
  AccountBalance,
  Receipt,
  Timeline,
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Clear,
  Refresh,
  ViewColumn,
  Print,
  Download
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AccountingPage = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [journalEntries, setJournalEntries] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [trialBalance, setTrialBalance] = useState(null);
  const [generalLedger, setGeneralLedger] = useState([]);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryDetails, setEntryDetails] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    accountId: '',
    referenceType: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: filters.startDate.toISOString().split('T')[0],
        end_date: filters.endDate.toISOString().split('T')[0]
      };

      if (filters.accountId) {
        params.account_id = filters.accountId;
      }

      if (filters.referenceType) {
        params.reference_type = filters.referenceType;
      }

      // Fetch all accounting data
      const [
        journalResponse,
        accountsResponse,
        trialResponse,
        ledgerResponse,
        incomeResponse,
        balanceResponse
      ] = await Promise.all([
        api.get('/accounting/journal-entries', { params }),
        api.get('/accounting/accounts'),
        api.get('/accounting/trial-balance'),
        api.get('/accounting/general-ledger', { params }),
        api.get('/accounting/income-statement', { params }),
        api.get('/accounting/balance-sheet')
      ]);

      setJournalEntries(journalResponse.data.data || []);
      setChartOfAccounts(accountsResponse.data.data || []);
      setTrialBalance(trialResponse.data.data);
      setGeneralLedger(ledgerResponse.data.data || []);
      setIncomeStatement(incomeResponse.data.data);
      setBalanceSheet(balanceResponse.data.data);
    } catch (error) {
      console.error('Error fetching accounting data:', error);
      enqueueSnackbar('Failed to fetch accounting data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
      accountId: '',
      referenceType: ''
    });
  };

  const applyFilters = () => {
    fetchData();
  };

  const handleRefresh = () => {
    fetchData();
    enqueueSnackbar('Data refreshed', { variant: 'info' });
  };

  const handleViewDetails = async (entryId) => {
    try {
      const response = await api.get(`/accounting/journal-entries/${entryId}`);
      setEntryDetails(response.data.data);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching entry details:', error);
      enqueueSnackbar('Failed to fetch entry details', { variant: 'error' });
    }
  };

  const handleEditEntry = (entryId) => {
    navigate(`/dashboard/edit-journal-entry/${entryId}`);
  };

  const handleDeleteClick = (entry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/accounting/journal-entries/${selectedEntry.id}`);
      enqueueSnackbar('Journal entry deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete journal entry', { variant: 'error' });
    }
  };

  const handleCreateManualEntry = () => {
    navigate('/dashboard/manual-journal-entry');
  };

  const handleViewAccountDetails = (accountId) => {
    navigate(`/dashboard/account-details/${accountId}`);
  };

  const handleCreateAccount = () => {
    navigate('/dashboard/accounts');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderJournalEntries = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Journal Entries</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateManualEntry}
        >
          New Manual Entry
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Entry No</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Debit</TableCell>
              <TableCell align="right">Credit</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {journalEntries.length > 0 ? (
              journalEntries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{formatDate(entry.entry_date)}</TableCell>
                  <TableCell>
                    <Chip label={entry.entry_number} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                    {formatCurrency(entry.total_debit)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                    {formatCurrency(entry.total_credit)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={entry.reference_type.replace('_', ' ')} 
                      size="small" 
                      variant="outlined"
                      color={
                        entry.reference_type === 'manual_journal' ? 'secondary' :
                        entry.reference_type === 'sales' ? 'success' :
                        entry.reference_type === 'purchase' ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{entry.created_by_name}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={() => handleViewDetails(entry.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {entry.reference_type === 'manual_journal' && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditEntry(entry.id)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(entry)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                    No journal entries found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderTrialBalance = () => (
    <Box>
      {trialBalance ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Trial Balance as of {formatDate(trialBalance.as_of_date)}
            </Typography>
            <Box>
              <Button startIcon={<Print />} sx={{ mr: 1 }}>Print</Button>
              <Button startIcon={<Download />}>Export</Button>
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell align="right">Debit Balance</TableCell>
                  <TableCell align="right">Credit Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trialBalance.trial_balance.map((account) => (
                  <TableRow 
                    key={account.account_code} 
                    hover
                    onClick={() => handleViewAccountDetails(account.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {account.account_code}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {account.account_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {parseFloat(account.debit_balance) > 0 ? (
                        <Typography color="success.main" fontWeight="medium">
                          {formatCurrency(account.debit_balance)}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {parseFloat(account.credit_balance) > 0 ? (
                        <Typography color="error.main" fontWeight="medium">
                          {formatCurrency(account.credit_balance)}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>
                    <Typography fontWeight="bold">Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="success.main">
                      {formatCurrency(trialBalance.totals.total_debit)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="error.main">
                      {formatCurrency(trialBalance.totals.total_credit)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Chip 
              label={trialBalance.is_balanced ? '✓ BALANCED' : '✗ NOT BALANCED'} 
              color={trialBalance.is_balanced ? 'success' : 'error'}
              sx={{ fontWeight: 'bold', px: 2 }}
            />
            {!trialBalance.is_balanced && (
              <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                Difference: {formatCurrency(trialBalance.totals.difference)}
              </Typography>
            )}
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No trial balance data available</Typography>
        </Paper>
      )}
    </Box>
  );

  const renderIncomeStatement = () => (
    <Box>
      {incomeStatement ? (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Income Statement
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {formatDate(incomeStatement.period.start_date)} - {formatDate(incomeStatement.period.end_date)}
            </Typography>
          </Box>
          
          {/* Revenue Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
              REVENUE
            </Typography>
            {incomeStatement.revenue.items.length > 0 ? (
              incomeStatement.revenue.items.map((item) => (
                <Box key={item.account_code} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{item.account_name}</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(item.amount)}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>No revenue transactions</Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography fontWeight="bold">Total Revenue</Typography>
              <Typography fontWeight="bold" color="primary.main">{formatCurrency(incomeStatement.revenue.total)}</Typography>
            </Box>
          </Box>

          {/* Expenses Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="error" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
              EXPENSES
            </Typography>
            {incomeStatement.expenses.items.length > 0 ? (
              incomeStatement.expenses.items.map((item) => (
                <Box key={item.account_code} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{item.account_name}</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(item.amount)}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>No expense transactions</Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography fontWeight="bold">Total Expenses</Typography>
              <Typography fontWeight="bold" color="error.main">{formatCurrency(incomeStatement.expenses.total)}</Typography>
            </Box>
          </Box>

          {/* Net Income */}
          <Box sx={{ 
            p: 3, 
            backgroundColor: incomeStatement.net_income >= 0 ? 'success.light' : 'error.light',
            borderRadius: 2,
            mt: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                {incomeStatement.net_income >= 0 ? 'NET PROFIT' : 'NET LOSS'}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(Math.abs(incomeStatement.net_income))}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No income statement data available</Typography>
        </Paper>
      )}
    </Box>
  );

  const renderBalanceSheet = () => (
    <Box>
      {balanceSheet ? (
        <Grid container spacing={3}>
          {/* Assets */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 2, borderColor: 'primary.main', pb: 1 }}>
                ASSETS
              </Typography>
              {balanceSheet.assets.items.map((asset) => (
                <Box 
                  key={asset.account_code} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1,
                    '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' }
                  }}
                  onClick={() => handleViewAccountDetails(asset.id)}
                >
                  <Typography variant="body2">{asset.account_name}</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(asset.current_balance)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 2, borderColor: 'primary.main' }}>
                <Typography variant="h6" fontWeight="bold">Total Assets</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {formatCurrency(balanceSheet.assets.total)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Liabilities & Equity */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" color="error" gutterBottom sx={{ borderBottom: 2, borderColor: 'error.main', pb: 1 }}>
                LIABILITIES
              </Typography>
              {balanceSheet.liabilities.items.map((liability) => (
                <Box 
                  key={liability.account_code} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1,
                    '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' }
                  }}
                  onClick={() => handleViewAccountDetails(liability.id)}
                >
                  <Typography variant="body2">{liability.account_name}</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(liability.current_balance)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography fontWeight="bold">Total Liabilities</Typography>
                <Typography fontWeight="bold" color="error.main">
                  {formatCurrency(balanceSheet.liabilities.total)}
                </Typography>
              </Box>

              <Typography variant="h6" color="success" gutterBottom sx={{ borderBottom: 2, borderColor: 'success.main', pb: 1 }}>
                EQUITY
              </Typography>
              {balanceSheet.equity.items.map((equity) => (
                <Box 
                  key={equity.account_code} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1,
                    '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' }
                  }}
                  onClick={() => handleViewAccountDetails(equity.id)}
                >
                  <Typography variant="body2">{equity.account_name}</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(equity.current_balance)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography fontWeight="bold">Total Equity</Typography>
                <Typography fontWeight="bold" color="success.main">
                  {formatCurrency(balanceSheet.equity.total)}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold">Total Liabilities & Equity</Typography>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  {formatCurrency(balanceSheet.totals.total_liabilities_equity)}
                </Typography>
              </Box>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Chip 
                  label={balanceSheet.totals.is_balanced ? '✓ BALANCED' : '✗ NOT BALANCED'} 
                  color={balanceSheet.totals.is_balanced ? 'success' : 'error'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No balance sheet data available</Typography>
        </Paper>
      )}
    </Box>
  );

  const renderChartOfAccounts = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Chart of Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateAccount}
        >
          New Account
        </Button>
      </Box>
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
            {chartOfAccounts.length > 0 ? (
              chartOfAccounts.map((account) => (
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
                      label={account.category.toUpperCase()} 
                      size="small"
                      color={
                        account.category === 'asset' ? 'success' :
                        account.category === 'liability' ? 'error' :
                        account.category === 'equity' ? 'warning' :
                        account.category === 'revenue' ? 'info' :
                        'secondary'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
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
                        onClick={() => handleViewAccountDetails(account.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/dashboard/accounts/edit/${account.id}`)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                    No accounts found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Financial Accounting
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Box>
          
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney color="primary" sx={{ mr: 2, fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {balanceSheet ? formatCurrency(balanceSheet.assets.total) : formatCurrency(0)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total Assets
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountBalance color="error" sx={{ mr: 2, fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {balanceSheet ? formatCurrency(balanceSheet.liabilities.total) : formatCurrency(0)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total Liabilities
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timeline color="success" sx={{ mr: 2, fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {incomeStatement ? formatCurrency(incomeStatement.net_income) : formatCurrency(0)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Net Income
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Receipt color="warning" sx={{ mr: 2, fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">{journalEntries.length}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Journal Entries
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Filter Reports
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={filters.accountId}
                    onChange={(e) => handleFilterChange('accountId', e.target.value)}
                    label="Account"
                  >
                    <MenuItem value="">All Accounts</MenuItem>
                    {chartOfAccounts.map(account => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Reference Type</InputLabel>
                  <Select
                    value={filters.referenceType}
                    onChange={(e) => handleFilterChange('referenceType', e.target.value)}
                    label="Reference Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="manual_journal">Manual Journal</MenuItem>
                    <MenuItem value="sales">Sales</MenuItem>
                    <MenuItem value="purchase">Purchase</MenuItem>
                    <MenuItem value="milling">Milling</MenuItem>
                    <MenuItem value="boiling">Boiling</MenuItem>
                    <MenuItem value="extra_income">Extra Income</MenuItem>
                    <MenuItem value="extra_expense">Extra Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<FilterList />}
                    onClick={applyFilters}
                    fullWidth
                    size="medium"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={clearFilters}
                    size="medium"
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab label="Journal Entries" />
              <Tab label="Trial Balance" />
              <Tab label="Income Statement" />
              <Tab label="Balance Sheet" />
              <Tab label="Chart of Accounts" />
            </Tabs>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Tab Content */}
          {activeTab === 0 && renderJournalEntries()}
          {activeTab === 1 && renderTrialBalance()}
          {activeTab === 2 && renderIncomeStatement()}
          {activeTab === 3 && renderBalanceSheet()}
          {activeTab === 4 && renderChartOfAccounts()}

          {/* Journal Entry Details Dialog */}
          <Dialog 
            open={detailsDialogOpen} 
            onClose={() => setDetailsDialogOpen(false)} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle>
              Journal Entry Details
              <IconButton
                onClick={() => setDetailsDialogOpen(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Clear />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {entryDetails && (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Entry Number</Typography>
                      <Typography variant="body1" fontWeight="bold">{entryDetails.entry.entry_number}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Date</Typography>
                      <Typography variant="body1">{formatDate(entryDetails.entry.entry_date)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Description</Typography>
                      <Typography variant="body1">{entryDetails.entry.description || 'No description'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Reference Type</Typography>
                      <Chip 
                        label={entryDetails.entry.reference_type} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">Created By</Typography>
                      <Typography variant="body1">{entryDetails.entry.created_by_name}</Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" gutterBottom>Entry Lines</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Account</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Debit</TableCell>
                          <TableCell align="right">Credit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {entryDetails.lines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">
                                {line.account_code} - {line.account_name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {line.account_type}
                              </Typography>
                            </TableCell>
                            <TableCell>{line.description || '-'}</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main' }}>
                              {parseFloat(line.debit_amount) > 0 ? formatCurrency(line.debit_amount) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'error.main' }}>
                              {parseFloat(line.credit_amount) > 0 ? formatCurrency(line.credit_amount) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell colSpan={2}>
                            <Typography fontWeight="bold">Totals</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="success.main">
                              {formatCurrency(entryDetails.entry.total_debit)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="error.main">
                              {formatCurrency(entryDetails.entry.total_credit)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              {entryDetails?.entry.reference_type === 'manual_journal' && (
                <>
                  <Button 
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleEditEntry(entryDetails.entry.id);
                    }}
                    startIcon={<Edit />}
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleDeleteClick(entryDetails.entry);
                    }}
                    color="error"
                    startIcon={<Delete />}
                  >
                    Delete
                  </Button>
                </>
              )}
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mt: 1 }}>
                Are you sure you want to delete this journal entry?
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  This action cannot be undone and will affect account balances.
                </Typography>
              </Alert>
              {selectedEntry && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>Entry:</strong> {selectedEntry.entry_number}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {formatDate(selectedEntry.entry_date)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Description:</strong> {selectedEntry.description}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default AccountingPage;