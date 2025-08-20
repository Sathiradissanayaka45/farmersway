import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import {
    Box,
    Tabs,
    Tab,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    IconButton,
    Tooltip,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    AttachMoney as MoneyIcon,
    People as PeopleIcon,
    ShoppingCart as ShoppingCartIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
} from '@mui/icons-material';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const PurchaseManagement = () => {
    const { api } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    
    // Tab state
    const [tabValue, setTabValue] = useState(0);
    
    // Data states
    const [purchases, setPurchases] = useState([]);
    const [riceVarieties, setRiceVarieties] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
    const [selectedRiceStock, setSelectedRiceStock] = useState(null);
    
    // Form states
    const [purchaseForm, setPurchaseForm] = useState({
        customerOption: 'existing',
        existingCustomerId: '',
        customerName: '',
        phone: '',
        riceTypeId: '',
        quantityKg: '',
        unitPrice: '',
        paidAmount: '',
        paymentMethod: 'cash',
        notes: '',
        totalPrice: '',
        pendingAmount: ''
    });

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Fetch all necessary data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                const [purchasesRes, riceRes, customersRes] = await Promise.all([
                    api.get('/purchases'),
                    api.get('/inventory'),
                    api.get('/customers')
                ]);
                
                setPurchases(purchasesRes.data.data || []);
                setRiceVarieties(riceRes.data.data || []);
                setCustomers(customersRes.data.data || []);
                
            } catch (error) {
                console.error('Error fetching data:', error);
                enqueueSnackbar('Failed to load data', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    // Handle customer option change (existing/new)
    const handleCustomerOptionChange = (e) => {
        const value = e.target.value;
        setPurchaseForm(prev => ({
            ...prev,
            customerOption: value,
            existingCustomerId: value === 'existing' ? prev.existingCustomerId : '',
            customerName: value === 'new' ? prev.customerName : '',
            phone: value === 'new' ? prev.phone : ''
        }));
        
        if (value === 'existing' && purchaseForm.existingCustomerId) {
            const selectedCustomer = customers.find(c => c.id === purchaseForm.existingCustomerId);
            if (selectedCustomer) {
                setPurchaseForm(prev => ({
                    ...prev,
                    customerName: selectedCustomer.name,
                    phone: selectedCustomer.phone
                }));
            }
        }
    };

    const handleExistingCustomerChange = (e) => {
        const customerId = e.target.value;
        const selectedCustomer = customers.find(c => c.id === customerId);
        
        setPurchaseForm(prev => ({
            ...prev,
            existingCustomerId: customerId,
            customerName: selectedCustomer ? selectedCustomer.name : '',
            phone: selectedCustomer ? selectedCustomer.phone : ''
        }));
    };

    // Handle form changes
    const handlePurchaseChange = (e) => {
        const { name, value } = e.target;
        setPurchaseForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'quantityKg' || name === 'unitPrice') {
            const quantity = name === 'quantityKg' ? value : purchaseForm.quantityKg;
            const unitPrice = name === 'unitPrice' ? value : purchaseForm.unitPrice;
            
            if (quantity && unitPrice) {
                const total = parseFloat(quantity) * parseFloat(unitPrice);
                setPurchaseForm(prev => ({
                    ...prev,
                    totalPrice: total.toFixed(2),
                    pendingAmount: (total - (parseFloat(prev.paidAmount) || 0).toFixed(2))
                }));
            }
        }
        
        if (name === 'paidAmount' && purchaseForm.quantityKg && purchaseForm.unitPrice) {
            const total = parseFloat(purchaseForm.quantityKg) * parseFloat(purchaseForm.unitPrice);
            const pending = total - (parseFloat(value) || 0);
            setPurchaseForm(prev => ({
                ...prev,
                pendingAmount: pending.toFixed(2)
            }));
        }

        if (name === 'riceTypeId') {
            const selectedRice = riceVarieties.find(r => r.id === value);
            setSelectedRiceStock(selectedRice ? selectedRice.current_stock_kg : null);
        }
    };

    // Submit purchase form
    const handlePurchaseSubmit = async () => {
        try {
            // Validate form
            if (!purchaseForm.riceTypeId || !purchaseForm.quantityKg || !purchaseForm.unitPrice) {
                enqueueSnackbar('Please fill all required fields', { variant: 'error' });
                return;
            }
            
            if (purchaseForm.customerOption === 'existing' && !purchaseForm.existingCustomerId) {
                enqueueSnackbar('Please select a customer', { variant: 'error' });
                return;
            }
            
            if (purchaseForm.customerOption === 'new' && (!purchaseForm.customerName || !purchaseForm.phone)) {
                enqueueSnackbar('Please enter customer name and phone', { variant: 'error' });
                return;
            }

            // // Check stock availability
            const quantity = parseFloat(purchaseForm.quantityKg);
            // {
            //     enqueueSnackbar(
            //         `Insufficient stock. Available: ${selectedRiceStock}kg`, 
            //         { variant: 'error' }
            //     );
            //     return;
            // }
            
            setLoading(true);
            
            const requestData = {
                customerName: purchaseForm.customerName,
                phone: purchaseForm.phone,
                riceTypeId: purchaseForm.riceTypeId,
                quantityKg: quantity,
                unitPrice: parseFloat(purchaseForm.unitPrice),
                paidAmount: parseFloat(purchaseForm.paidAmount || 0),
                paymentMethod: purchaseForm.paymentMethod,
                notes: purchaseForm.notes
            };
            
            await api.post('/purchases', requestData);
            
            enqueueSnackbar('Purchase recorded successfully', { variant: 'success' });
            setOpenPurchaseDialog(false);
            
            // Reset form
            setPurchaseForm({
                customerOption: 'existing',
                existingCustomerId: '',
                customerName: '',
                phone: '',
                riceTypeId: '',
                quantityKg: '',
                unitPrice: '',
                paidAmount: '',
                paymentMethod: 'cash',
                notes: '',
                totalPrice: '',
                pendingAmount: ''
            });
            setSelectedRiceStock(null);
            
            // Refresh data
            const [purchasesRes, customersRes, riceRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/customers'),
                api.get('/inventory')
            ]);
            
            setPurchases(purchasesRes.data.data || []);
            setCustomers(customersRes.data.data || []);
            setRiceVarieties(riceRes.data.data || []);
            
        } catch (error) {
            console.error('Error creating purchase:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to record purchase', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Record payment
    const handleRecordPayment = async (target, isCustomerPayment = false) => {
        try {
            const maxAmount = isCustomerPayment ? target.total_pending : target.pending_amount;
            const amount = prompt(`Enter payment amount (Max: ${maxAmount}):`);
            
            if (!amount || isNaN(amount)) return;
            
            const paymentAmount = parseFloat(amount);
            if (paymentAmount > maxAmount) {
                enqueueSnackbar(`Payment amount exceeds pending amount (Max: ${maxAmount})`, { variant: 'error' });
                return;
            }

            setLoading(true);
            
            if (isCustomerPayment) {
                await api.post(`/customers/${target.id}/payments`, {
                    amount: paymentAmount,
                    paymentMethod: 'cash',
                    notes: `General payment for customer ${target.name}`
                });
            } else {
                await api.post(`/purchases/${target.id}/payments`, {
                    amount: paymentAmount,
                    paymentMethod: 'cash',
                    notes: `Payment for order #${target.id}`
                });
            }
            
            enqueueSnackbar('Payment recorded successfully', { variant: 'success' });
            
            const [purchasesRes, customersRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/customers')
            ]);
            
            setPurchases(purchasesRes.data.data || []);
            setCustomers(customersRes.data.data || []);
            
        } catch (error) {
            console.error('Error recording payment:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to record payment', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Rice Purchase Management
            </Typography>
            
            <Paper sx={{ mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    aria-label="purchase management tabs"
                >
                    <Tab label="Purchases" icon={<ShoppingCartIcon />} />
                    <Tab label="Customers" icon={<PeopleIcon />} />
                </Tabs>
            </Paper>
            
            {loading && <LinearProgress />}
            
            <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenPurchaseDialog(true)}
                    >
                        New Purchase
                    </Button>
                </Box>
                
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Rice Type</TableCell>
                                <TableCell>Quantity (kg)</TableCell>
                                <TableCell>Unit Price</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Paid</TableCell>
                                <TableCell>Pending</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {purchases.map((purchase) => {
                                const rice = riceVarieties.find(r => r.id === purchase.rice_type_id);
                                return (
                                    <TableRow key={purchase.id}>
                                        <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                                        <TableCell>{purchase.customer_name}</TableCell>
                                        <TableCell>
                                            {purchase.rice_type_name}
                                            {rice && (
                                                <Tooltip title={`Current stock: ${rice.current_stock_kg}kg`}>
                                                    <InfoIcon color="info" sx={{ ml: 1, fontSize: '1rem' }} />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>{purchase.quantity_kg}</TableCell>
                                        <TableCell>{purchase.unit_price}</TableCell>
                                        <TableCell>{purchase.total_price}</TableCell>
                                        <TableCell>{purchase.paid_amount}</TableCell>
                                        <TableCell>{purchase.pending_amount}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Record Payment">
                                                <IconButton 
                                                    onClick={() => handleRecordPayment(purchase)}
                                                    aria-label="record payment"
                                                >
                                                    <MoneyIcon color="primary" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Total Purchases</TableCell>
                                <TableCell>Total Paid</TableCell>
                                <TableCell>Pending</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>{customer.name}</TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell>{customer.total_purchases}</TableCell>
                                    <TableCell>{customer.total_paid}</TableCell>
                                    <TableCell>{customer.total_pending}</TableCell>
                                    <TableCell>
                                        <Tooltip title="Record Payment">
                                            <IconButton 
                                                onClick={() => handleRecordPayment(customer, true)}
                                                aria-label="record customer payment"
                                            >
                                                <MoneyIcon color="primary" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="View Purchases">
                                            <IconButton 
                                                onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                                                aria-label="view customer purchases"
                                            >
                                                <ShoppingCartIcon color="action" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>
            
            <Dialog 
                open={openPurchaseDialog} 
                onClose={() => setOpenPurchaseDialog(false)} 
                maxWidth="sm" 
                fullWidth
                aria-labelledby="new-purchase-dialog"
            >
                <DialogTitle id="new-purchase-dialog">New Rice Purchase</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControl component="fieldset" sx={{ mb: 3 }}>
                            <FormLabel component="legend">Customer Option</FormLabel>
                            <RadioGroup
                                row
                                name="customerOption"
                                value={purchaseForm.customerOption}
                                onChange={handleCustomerOptionChange}
                                aria-label="customer option"
                            >
                                <FormControlLabel 
                                    value="existing" 
                                    control={<Radio />} 
                                    label="Existing Customer" 
                                />
                                <FormControlLabel 
                                    value="new" 
                                    control={<Radio />} 
                                    label="New Customer" 
                                />
                            </RadioGroup>
                        </FormControl>

                        {purchaseForm.customerOption === 'existing' ? (
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="customer-select-label">Select Customer</InputLabel>
                                <Select
                                    name="existingCustomerId"
                                    value={purchaseForm.existingCustomerId}
                                    onChange={handleExistingCustomerChange}
                                    labelId="customer-select-label"
                                    label="Select Customer"
                                    required
                                >
                                    {customers.map(customer => (
                                        <MenuItem key={customer.id} value={customer.id}>
                                            {customer.name} ({customer.phone})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <>
                                <TextField
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    name="customerName"
                                    label="Customer Name"
                                    value={purchaseForm.customerName}
                                    onChange={handlePurchaseChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    name="phone"
                                    label="Phone Number"
                                    value={purchaseForm.phone}
                                    onChange={handlePurchaseChange}
                                    required
                                />
                            </>
                        )}

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="rice-type-label">Rice Type</InputLabel>
                            <Select
                                name="riceTypeId"
                                value={purchaseForm.riceTypeId}
                                onChange={handlePurchaseChange}
                                labelId="rice-type-label"
                                label="Rice Type"
                                required
                            >
                                {riceVarieties.map(rice => (
                                    <MenuItem key={rice.id} value={rice.id}>
                                        {rice.name} ({rice.current_stock_kg}kg available)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* {selectedRiceStock !== null && (
                            <Alert 
                                severity={parseFloat(purchaseForm.quantityKg) < selectedRiceStock ? 'error' : 'info'}
                                icon={<WarningIcon />}
                                sx={{ mb: 2 }}
                            >
                                Current stock: {selectedRiceStock}kg
                                {parseFloat(purchaseForm.quantityKg) < selectedRiceStock && (
                                    <span> - Not enough stock!</span>
                                )}
                            </Alert>
                        )} */}

                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            name="quantityKg"
                            label="Quantity (kg)"
                            type="number"
                            value={purchaseForm.quantityKg}
                            onChange={handlePurchaseChange}
                            required
                            inputProps={{ min: 0.01, step: 0.01 }}
                        />

                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            name="unitPrice"
                            label="Unit Price"
                            type="number"
                            value={purchaseForm.unitPrice}
                            onChange={handlePurchaseChange}
                            required
                            inputProps={{ min: 0.01, step: 0.01 }}
                        />

                        {purchaseForm.quantityKg && purchaseForm.unitPrice && (
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Total: {(parseFloat(purchaseForm.quantityKg) * parseFloat(purchaseForm.unitPrice)).toFixed(2)}
                            </Typography>
                        )}

                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            name="paidAmount"
                            label="Paid Amount"
                            type="number"
                            value={purchaseForm.paidAmount}
                            onChange={handlePurchaseChange}
                            inputProps={{ min: 0, step: 0.01 }}
                        />

                        {purchaseForm.paidAmount && purchaseForm.quantityKg && purchaseForm.unitPrice && (
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Pending: {(
                                    parseFloat(purchaseForm.quantityKg) * parseFloat(purchaseForm.unitPrice) - 
                                    (parseFloat(purchaseForm.paidAmount) || 0)
                                ).toFixed(2)}
                            </Typography>
                        )}

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="payment-method-label">Payment Method</InputLabel>
                            <Select
                                name="paymentMethod"
                                value={purchaseForm.paymentMethod}
                                onChange={handlePurchaseChange}
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
                            value={purchaseForm.notes}
                            onChange={handlePurchaseChange}
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setOpenPurchaseDialog(false)}
                        aria-label="cancel purchase"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handlePurchaseSubmit}
                        variant="contained"
                        // disabled={loading || (selectedRiceStock !== null && parseFloat(purchaseForm.quantityKg) > selectedRiceStock)}
                        aria-label="save purchase"
                    >
                        Save Purchase
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PurchaseManagement;