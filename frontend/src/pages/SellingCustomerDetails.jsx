import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Button,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    AttachMoney as MoneyIcon,
    ArrowBack as BackIcon,
    Edit as EditIcon
} from '@mui/icons-material';

const SellingCustomerDetails = () => {
    const { id } = useParams();
    const { api } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    
    const [customer, setCustomer] = useState(null);
    const [sales, setSales] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'cash',
        notes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                const [customerRes, salesRes, paymentsRes] = await Promise.all([
                    api.get(`/sales/customers/${id}`),
                    api.get(`/sales/customer/${id}`),
                    api.get(`/sales/customers/${id}/payments`)
                ]);
                
                setCustomer(customerRes.data.data);
                setSales(salesRes.data.data || []);
                setPayments(paymentsRes.data.data || []);
                
            } catch (error) {
                console.error('Error fetching data:', error);
                enqueueSnackbar('Failed to load customer details', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [id]);

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePaymentSubmit = async () => {
        try {
            if (!paymentForm.amount || isNaN(paymentForm.amount)) {
                enqueueSnackbar('Please enter a valid amount', { variant: 'error' });
                return;
            }

            setLoading(true);
            
            await api.post(`/sales/customers/${id}/payments`, paymentForm);
            
            enqueueSnackbar('Payment recorded successfully', { variant: 'success' });
            setOpenPaymentDialog(false);
            
            // Refresh data
            const [customerRes, paymentsRes] = await Promise.all([
                api.get(`/sales/customers/${id}`),
                api.get(`/sales/customers/${id}/payments`)
            ]);
            
            setCustomer(customerRes.data.data);
            setPayments(paymentsRes.data.data || []);
            
        } catch (error) {
            console.error('Error recording payment:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to record payment', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !customer) {
        return <LinearProgress />;
    }

    if (!customer) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Customer not found</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h4">{customer.name}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="body1"><strong>Phone:</strong> {customer.phone}</Typography>
                    <Typography variant="body1"><strong>Type:</strong> {customer.customer_type}</Typography>
                    {customer.address && <Typography variant="body1"><strong>Address:</strong> {customer.address}</Typography>}
                </Box>
                <Box textAlign="right">
                    <Typography variant="h6">Total Purchases: {customer.total_purchases}</Typography>
                    <Typography variant="h6">Total Paid: {customer.total_paid}</Typography>
                    <Typography variant="h6" color="error">Pending: {customer.total_pending}</Typography>
                </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<MoneyIcon />}
                    onClick={() => setOpenPaymentDialog(true)}
                    sx={{ mr: 2 }}
                >
                    Record Payment
                </Button>
            </Box>
            
            <Typography variant="h5" gutterBottom>Sales History</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Rice Type</TableCell>
                            <TableCell>Quantity (kg)</TableCell>
                            <TableCell>Unit Price</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Paid</TableCell>
                            <TableCell>Pending</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                                <TableCell>{sale.rice_variety_name}</TableCell>
                                <TableCell>{sale.quantity_kg}</TableCell>
                                <TableCell>{sale.unit_price}</TableCell>
                                <TableCell>{sale.total_price}</TableCell>
                                <TableCell>{sale.paid_amount}</TableCell>
                                <TableCell>{sale.pending_amount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <Typography variant="h5" gutterBottom>Payment History</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Notes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                <TableCell>{payment.amount}</TableCell>
                                <TableCell>{payment.payment_method}</TableCell>
                                <TableCell>{payment.notes}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <Dialog 
                open={openPaymentDialog} 
                onClose={() => setOpenPaymentDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Record Payment</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            name="amount"
                            label="Amount"
                            type="number"
                            value={paymentForm.amount}
                            onChange={handlePaymentChange}
                            required
                            inputProps={{ min: 0.01, step: 0.01 }}
                        />
                        
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="payment-method-label">Payment Method</InputLabel>
                            <Select
                                name="paymentMethod"
                                value={paymentForm.paymentMethod}
                                onChange={handlePaymentChange}
                                labelId="payment-method-label"
                                label="Payment Method"
                            >
                                <MenuItem value="cash">Cash</MenuItem>
                                <MenuItem value="bank">Bank Transfer</MenuItem>
                                <MenuItem value="mobile">Mobile Payment</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            name="notes"
                            label="Notes"
                            value={paymentForm.notes}
                            onChange={handlePaymentChange}
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handlePaymentSubmit}
                        variant="contained"
                        disabled={loading}
                    >
                        Record Payment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SellingCustomerDetails;