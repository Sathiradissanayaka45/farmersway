// pages/CustomerPurchaseHistory.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Chip,
    Button,
    Grid,
    Card,
    CardContent,
    Divider,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    AttachMoney as MoneyIcon,
    History as HistoryIcon,
    Receipt as ReceiptIcon,
    Person as PersonIcon,
    Phone as PhoneIcon
} from '@mui/icons-material';

const CustomerPurchaseHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    
    const [customer, setCustomer] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: ''
    });
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    useEffect(() => {
        fetchCustomerData();
    }, [id]);

    const fetchCustomerData = async () => {
        try {
            setLoading(true);
            
            // Fetch customer details, purchases, and statistics
            const [customerRes, purchasesRes, statsRes] = await Promise.all([
                api.get(`/customers/${id}`),
                api.get(`/purchases/customer/${id}`),
                api.get(`/purchases/customer/${id}/stats`)
            ]);
            
            setCustomer(customerRes.data.data);
            setPurchases(purchasesRes.data.data || []);
            setStats(statsRes.data.data || []);
            
        } catch (error) {
            console.error('Error fetching customer data:', error);
            enqueueSnackbar('Failed to load customer data', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentClick = (purchase) => {
        setSelectedPurchase(purchase);
        setPaymentForm({
            amount: Math.min(purchase.pending_amount, purchase.pending_amount > 0 ? purchase.pending_amount : 0),
            paymentMethod: 'cash',
            referenceNumber: '',
            notes: `Payment for purchase #${purchase.id}`
        });
        setOpenPaymentDialog(true);
    };

    const handleRecordGeneralPayment = () => {
        if (!customer) return;
        
        const maxAmount = customer.total_pending;
        setPaymentForm({
            amount: maxAmount > 0 ? maxAmount : '',
            paymentMethod: 'cash',
            referenceNumber: '',
            notes: `General payment for customer ${customer.name}`
        });
        setSelectedPurchase(null);
        setOpenPaymentDialog(true);
    };

    const handlePaymentSubmit = async () => {
        try {
            if (!paymentForm.amount || isNaN(paymentForm.amount)) {
                enqueueSnackbar('Please enter a valid amount', { variant: 'error' });
                return;
            }

            setLoading(true);
            
            if (selectedPurchase) {
                // Record payment for specific purchase
                await api.post(`/purchases/${selectedPurchase.id}/payments`, paymentForm);
                enqueueSnackbar('Payment recorded for purchase', { variant: 'success' });
            } else if (customer) {
                // Record general customer payment
                await api.post(`/customers/${customer.id}/payments`, paymentForm);
                enqueueSnackbar('General payment recorded', { variant: 'success' });
            }
            
            setOpenPaymentDialog(false);
            fetchCustomerData(); // Refresh data
            
        } catch (error) {
            console.error('Error recording payment:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to record payment', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        const totalPurchases = purchases.reduce((sum, p) => sum + parseFloat(p.total_price || 0), 0);
        const totalPaid = purchases.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
        const totalPending = purchases.reduce((sum, p) => sum + parseFloat(p.pending_amount || 0), 0);
        
        return { totalPurchases, totalPaid, totalPending };
    };

    if (loading && !customer) {
        return <LinearProgress />;
    }

    if (!customer) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="error">
                    Customer not found
                </Typography>
                <Button 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/dashboard/purchases')}
                    sx={{ mt: 2 }}
                >
                    Back to Purchases
                </Button>
            </Box>
        );
    }

    const totals = calculateTotals();

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/dashboard/purchases')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4">
                            {customer.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                                <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                {customer.phone}
                            </Typography>
                            {customer.rice_variety_name && (
                                <Chip 
                                    label={`Primary Rice: ${customer.rice_variety_name}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
                
                <Button
                    variant="contained"
                    startIcon={<MoneyIcon />}
                    onClick={handleRecordGeneralPayment}
                    disabled={customer.total_pending <= 0}
                >
                    Record Payment
                </Button>
            </Box>

            {/* Customer Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Purchases
                            </Typography>
                            <Typography variant="h4">
                                ₹{totals.totalPurchases.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {purchases.length} transactions
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Paid
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                ₹{totals.totalPaid.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Pending
                            </Typography>
                            <Typography variant="h4" color={totals.totalPending > 0 ? "error.main" : "success.main"}>
                                ₹{totals.totalPending.toFixed(2)}
                            </Typography>
                            {totals.totalPending > 0 && (
                                <Typography variant="caption" color="error">
                                    Requires payment
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Payment Status
                            </Typography>
                            <Chip 
                                label={totals.totalPending > 0 ? "Pending" : "Paid"}
                                color={totals.totalPending > 0 ? "warning" : "success"}
                                sx={{ mt: 1 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Purchase Statistics by Rice Variety */}
            {stats.length > 0 && (
                <Paper sx={{ mb: 4, p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon />
                        Purchase Statistics by Rice Variety
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Rice Variety</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="right">Total Quantity (kg)</TableCell>
                                    <TableCell align="right">Total Amount</TableCell>
                                    <TableCell align="right">Total Purchases</TableCell>
                                    <TableCell>Last Purchase</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stats.map((stat, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {stat.rice_variety_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={stat.rice_type_name}
                                                size="small"
                                                color={stat.rice_type_name?.toLowerCase() === 'paddy' ? 'primary' : 'secondary'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {parseFloat(stat.total_quantity_kg).toFixed(2)} kg
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{parseFloat(stat.total_amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {stat.total_purchases}
                                        </TableCell>
                                        <TableCell>
                                            {stat.last_purchase_date ? 
                                                new Date(stat.last_purchase_date).toLocaleDateString() : 
                                                'N/A'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Purchase History Table */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon />
                    Purchase History
                </Typography>
                
                {loading && <LinearProgress />}
                
                {purchases.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="textSecondary">
                            No purchase history found for this customer.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Rice Variety</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="right">Quantity (kg)</TableCell>
                                    <TableCell align="right">Unit Price</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="right">Paid</TableCell>
                                    <TableCell align="right">Pending</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {purchases.map((purchase) => (
                                    <TableRow key={purchase.id} hover>
                                        <TableCell>
                                            {new Date(purchase.purchase_date).toLocaleDateString()}
                                            <br />
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(purchase.purchase_date).toLocaleTimeString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {purchase.rice_variety_name}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={purchase.rice_type_name}
                                                size="small"
                                                color={purchase.rice_type_name?.toLowerCase() === 'paddy' ? 'primary' : 'secondary'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {parseFloat(purchase.quantity_kg).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{parseFloat(purchase.unit_price).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{parseFloat(purchase.total_price).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{parseFloat(purchase.paid_amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip 
                                                label={`₹${parseFloat(purchase.pending_amount).toFixed(2)}`}
                                                size="small"
                                                color={purchase.pending_amount > 0 ? "error" : "success"}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Record Payment">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handlePaymentClick(purchase)}
                                                    disabled={purchase.pending_amount <= 0}
                                                    color="primary"
                                                >
                                                    <MoneyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Payment Dialog */}
            <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedPurchase ? 'Record Payment for Purchase' : 'Record General Payment'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {selectedPurchase && (
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Purchase Details
                                </Typography>
                                <Typography variant="body2">
                                    Purchase #{selectedPurchase.id} - {selectedPurchase.rice_variety_name}
                                </Typography>
                                <Typography variant="body2">
                                    Amount: ₹{parseFloat(selectedPurchase.total_price).toFixed(2)} | 
                                    Paid: ₹{parseFloat(selectedPurchase.paid_amount).toFixed(2)} | 
                                    Pending: ₹{parseFloat(selectedPurchase.pending_amount).toFixed(2)}
                                </Typography>
                            </Box>
                        )}
                        
                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            label="Amount"
                            type="number"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            inputProps={{ step: "0.01", min: "0" }}
                            helperText={
                                selectedPurchase ? 
                                `Max: ₹${parseFloat(selectedPurchase.pending_amount).toFixed(2)}` :
                                `Max: ₹${parseFloat(customer?.total_pending || 0).toFixed(2)}`
                            }
                        />

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Payment Method</InputLabel>
                            <Select
                                value={paymentForm.paymentMethod}
                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                label="Payment Method"
                            >
                                <MenuItem value="cash">Cash</MenuItem>
                                <MenuItem value="bank">Bank Transfer</MenuItem>
                                <MenuItem value="mobile">Mobile Payment</MenuItem>
                                <MenuItem value="cheque">Cheque</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            label="Reference Number"
                            value={paymentForm.referenceNumber}
                            onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                            placeholder="Optional"
                        />

                        <TextField
                            fullWidth
                            label="Notes"
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPaymentDialog(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handlePaymentSubmit}
                        variant="contained"
                        disabled={loading || !paymentForm.amount}
                    >
                        {loading ? 'Recording...' : 'Record Payment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CustomerPurchaseHistory;