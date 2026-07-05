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
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const AccountDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState(null);

  useEffect(() => {
    fetchAccountDetails();
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/accounting/accounts/${id}`);
      setAccountData(response.data.data);
    } catch (error) {
      console.error('Error fetching account details:', error);
      enqueueSnackbar('Failed to fetch account details', { variant: 'error' });
      navigate('/dashboard/accounting');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <Container>
        <LinearProgress />
      </Container>
    );
  }

  if (!accountData) {
    return (
      <Container>
        <Typography>Account not found</Typography>
      </Container>
    );
  }

  const { account, recent_transactions } = accountData;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard/accounting')}
            >
              Back
            </Button>
            <Typography variant="h4">
              Account Details
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/dashboard/accounts/edit/${id}`)}
          >
            Edit Account
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Account Info Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="textSecondary">
                      Account Code
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {account.account_code}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="textSecondary">
                      Account Name
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {account.account_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="textSecondary">
                      Type
                    </Typography>
                    <Typography variant="body1">
                      {account.account_type_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="textSecondary">
                      Category
                    </Typography>
                    <Chip 
                      label={account.category} 
                      size="small"
                      color={
                        account.category === 'asset' ? 'success' :
                        account.category === 'liability' ? 'error' :
                        account.category === 'equity' ? 'warning' :
                        account.category === 'revenue' ? 'info' :
                        'secondary'
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Normal Balance
                    </Typography>
                    <Typography variant="body1">
                      {account.normal_balance === 'debit' ? 'Debit' : 'Credit'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Status
                    </Typography>
                    <Chip 
                      label={account.is_active ? 'Active' : 'Inactive'} 
                      size="small"
                      color={account.is_active ? 'success' : 'default'}
                    />
                  </Grid>
                  {account.parent_account_name && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        Parent Account
                      </Typography>
                      <Typography variant="body1">
                        {account.parent_account_code} - {account.parent_account_name}
                      </Typography>
                    </Grid>
                  )}
                  {account.description && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {account.description}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Balance Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Balance
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {formatCurrency(account.current_balance)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                  Opening Balance: {formatCurrency(account.opening_balance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Transactions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Recent Transactions
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ReceiptIcon />}
                    onClick={() => navigate(`/dashboard/accounting?account=${id}`)}
                  >
                    View All Transactions
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Entry No</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Debit</TableCell>
                        <TableCell align="right">Credit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recent_transactions.length > 0 ? (
                        recent_transactions.map((transaction, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{formatDate(transaction.entry_date)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={transaction.entry_number} 
                                size="small" 
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell align="right">
                              {parseFloat(transaction.debit_amount) > 0 ? formatCurrency(transaction.debit_amount) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {parseFloat(transaction.credit_amount) > 0 ? formatCurrency(transaction.credit_amount) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                              No transactions found for this account
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AccountDetailsPage;