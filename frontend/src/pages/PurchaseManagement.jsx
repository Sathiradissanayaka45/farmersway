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
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Card,
    CardContent,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    AttachMoney as MoneyIcon,
    People as PeopleIcon,
    ShoppingCart as ShoppingCartIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    ExpandMore as ExpandMoreIcon,
    RiceBowl as RiceIcon
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
    const [riceTypes, setRiceTypes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
    const [selectedRiceStock, setSelectedRiceStock] = useState(null);
    
    // Payment dialog states
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [selectedPaymentTarget, setSelectedPaymentTarget] = useState(null);
    const [isCustomerPayment, setIsCustomerPayment] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: ''
    });
    
    // Form states
    const [purchaseForm, setPurchaseForm] = useState({
        customerOption: 'existing',
        existingCustomerId: '',
        customerName: '',
        phone: '',
        riceTypeId: '',
        riceVarietyId: '',
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
                
                const [purchasesRes, riceRes, customersRes, riceTypesRes] = await Promise.all([
                    api.get('/purchases'),
                    api.get('/rice'),
                    api.get('/purchases/customers'),
                    api.get('/rice-types')
                ]);
                
                setPurchases(purchasesRes.data.data || []);
                setRiceVarieties(riceRes.data.data || []);
                setCustomers(customersRes.data.data || []);
                setRiceTypes(riceTypesRes.data.data || []);
                
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
            phone: value === 'new' ? prev.phone : '',
            riceVarietyId: ''
        }));
        
        if (value === 'existing' && purchaseForm.existingCustomerId) {
            const selectedCustomer = customers.find(c => c.id === purchaseForm.existingCustomerId);
            if (selectedCustomer) {
                setPurchaseForm(prev => ({
                    ...prev,
                    customerName: selectedCustomer.name,
                    phone: selectedCustomer.phone,
                    riceVarietyId: selectedCustomer.primary_rice_variety || ''
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
            phone: selectedCustomer ? selectedCustomer.phone : '',
            riceVarietyId: selectedCustomer ? selectedCustomer.primary_rice_variety_id || '' : ''
        }));
    };

    // Handle form changes
    const handlePurchaseChange = (e) => {
        const { name, value } = e.target;
        setPurchaseForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Update rice stock when rice variety changes
        if (name === 'riceVarietyId') {
            const selectedRice = riceVarieties.find(r => r.id === value);
            setSelectedRiceStock(selectedRice ? selectedRice.current_stock_kg : null);
            
            // Also set rice type based on selected variety
            if (selectedRice) {
                setPurchaseForm(prev => ({
                    ...prev,
                    riceTypeId: selectedRice.rice_type || selectedRice.rice_type_id || ''
                }));
            }
        }
        
        // Calculate total and pending amounts
        if (name === 'quantityKg' || name === 'unitPrice') {
            const quantity = name === 'quantityKg' ? value : purchaseForm.quantityKg;
            const unitPrice = name === 'unitPrice' ? value : purchaseForm.unitPrice;
            
            if (quantity && unitPrice) {
                const total = parseFloat(quantity) * parseFloat(unitPrice);
                setPurchaseForm(prev => ({
                    ...prev,
                    totalPrice: total.toFixed(2),
                    pendingAmount: (total - (parseFloat(prev.paidAmount) || 0)).toFixed(2)
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
    };

    // Handle payment form changes
    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Open payment dialog
    const openPaymentDialogHandler = (target, isCustomer = false) => {
        setSelectedPaymentTarget(target);
        setIsCustomerPayment(isCustomer);
        setPaymentForm({
            amount: '',
            paymentMethod: 'cash',
            referenceNumber: '',
            notes: isCustomer ? 
                `General payment for customer ${target.name}` : 
                `Payment for order #${target.id}`
        });
        setOpenPaymentDialog(true);
    };

    // Close payment dialog
    const closePaymentDialog = () => {
        setOpenPaymentDialog(false);
        setSelectedPaymentTarget(null);
        setIsCustomerPayment(false);
        setPaymentForm({
            amount: '',
            paymentMethod: 'cash',
            referenceNumber: '',
            notes: ''
        });
    };

    // Record payment
    const handleRecordPayment = async () => {
        try {
            if (!selectedPaymentTarget) return;
            
            const maxAmount = isCustomerPayment ? 
                selectedPaymentTarget.total_pending : 
                selectedPaymentTarget.pending_amount;
            
            const paymentAmount = parseFloat(paymentForm.amount);
            
            if (!paymentAmount || isNaN(paymentAmount)) {
                enqueueSnackbar('Please enter a valid amount', { variant: 'error' });
                return;
            }
            
            if (paymentAmount > maxAmount) {
                enqueueSnackbar(`Payment amount exceeds pending amount (Max: ${maxAmount})`, { variant: 'error' });
                return;
            }

            if (!paymentForm.paymentMethod) {
                enqueueSnackbar('Please select a payment method', { variant: 'error' });
                return;
            }

            setLoading(true);
            
            const paymentData = {
                amount: paymentAmount,
                paymentMethod: paymentForm.paymentMethod,
                referenceNumber: paymentForm.referenceNumber || null,
                notes: paymentForm.notes || `Payment for ${isCustomerPayment ? 'customer' : 'order'}`
            };
            
            if (isCustomerPayment) {
                await api.post(`/customers/${selectedPaymentTarget.id}/payments`, paymentData);
            } else {
                await api.post(`/purchases/${selectedPaymentTarget.id}/payments`, paymentData);
            }
            
            enqueueSnackbar('Payment recorded successfully', { variant: 'success' });
            closePaymentDialog();
            
            // Refresh data
            const [purchasesRes, customersRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/purchases/customers')
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

    // Submit purchase form
    const handlePurchaseSubmit = async () => {
        try {
            // Validate form
            if (!purchaseForm.riceVarietyId || !purchaseForm.quantityKg || !purchaseForm.unitPrice) {
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

            setLoading(true);
            
            const requestData = {
                customerName: purchaseForm.customerName,
                phone: purchaseForm.phone,
                riceTypeId: purchaseForm.riceTypeId,
                riceVarietyId: purchaseForm.riceVarietyId,
                quantityKg: parseFloat(purchaseForm.quantityKg),
                unitPrice: parseFloat(purchaseForm.unitPrice),
                paidAmount: parseFloat(purchaseForm.paidAmount || 0),
                paymentMethod: purchaseForm.paymentMethod,
                notes: purchaseForm.notes
            };
            
            const response = await api.post('/purchases', requestData);
            
            if (response.data.success) {
                enqueueSnackbar('Purchase recorded successfully', { variant: 'success' });
                setOpenPurchaseDialog(false);
                
                // Reset form
                setPurchaseForm({
                    customerOption: 'existing',
                    existingCustomerId: '',
                    customerName: '',
                    phone: '',
                    riceTypeId: '',
                    riceVarietyId: '',
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
                const [purchasesRes, customersRes] = await Promise.all([
                    api.get('/purchases'),
                    api.get('/purchases/customers')
                ]);
                
                setPurchases(purchasesRes.data.data || []);
                setCustomers(customersRes.data.data || []);
            }
            
        } catch (error) {
            console.error('Error creating purchase:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to record purchase', { variant: 'error' });
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
                                <TableCell>Rice Variety</TableCell>
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
                                const rice = riceVarieties.find(r => r.id === purchase.rice_variety_id);
                                return (
                                    <TableRow key={purchase.id}>
                                        <TableCell>
                                            {new Date(purchase.purchase_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {purchase.customer_name}
                                            <br />
                                            <Typography variant="caption" color="textSecondary">
                                                {purchase.phone}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {purchase.rice_variety_name}
                                            {rice && (
                                                <Tooltip title={`Current stock: ${rice.current_stock_kg}kg`}>
                                                    <InfoIcon color="info" sx={{ ml: 1, fontSize: '1rem' }} />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={purchase.rice_type_name} 
                                                size="small"
                                                color={purchase.rice_type_name?.toLowerCase() === 'paddy' ? 'primary' : 'secondary'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{parseFloat(purchase.quantity_kg).toFixed(2)}</TableCell>
                                        <TableCell>{parseFloat(purchase.unit_price).toFixed(2)}</TableCell>
                                        <TableCell>{parseFloat(purchase.total_price).toFixed(2)}</TableCell>
                                        <TableCell>{parseFloat(purchase.paid_amount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={parseFloat(purchase.pending_amount).toFixed(2)} 
                                                size="small"
                                                color={purchase.pending_amount > 0 ? 'error' : 'success'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Record Payment">
                                                <IconButton 
                                                    onClick={() => openPaymentDialogHandler(purchase, false)}
                                                    aria-label="record payment"
                                                    size="small"
                                                    disabled={purchase.pending_amount <= 0}
                                                >
                                                    <MoneyIcon color={purchase.pending_amount > 0 ? "primary" : "disabled"} />
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
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Customer List with Purchase Details
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                        View customer purchase statistics by rice variety
                    </Typography>
                </Box>
                
                <Grid container spacing={3}>
                    {customers.map((customer) => (
                        <Grid item xs={12} key={customer.id}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6">
                                                {customer.name}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Phone: {customer.phone}
                                            </Typography>
                                            {customer.primary_rice_variety && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Chip 
                                                        icon={<RiceIcon />}
                                                        label={`Primary Rice: ${customer.primary_rice_variety}`}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    <Chip 
                                                        label={`Type: ${customer.primary_rice_type}`}
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2">
                                                Total Purchases: LKR {parseFloat(customer.total_purchases).toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2">
                                                Total Paid: LKR {parseFloat(customer.total_paid).toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" color="error">
                                                Pending: LKR {parseFloat(customer.total_pending).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    {/* Customer Purchase Statistics */}
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="subtitle2">
                                                Purchase Details by Rice Variety
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {customer.purchases_by_rice && customer.purchases_by_rice.length > 0 ? (
                                                <TableContainer>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Rice Variety</TableCell>
                                                                <TableCell>Type</TableCell>
                                                                <TableCell align="right">Total Quantity (kg)</TableCell>
                                                                <TableCell align="right">Total Amount</TableCell>
                                                                <TableCell>Last Purchase</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {customer.purchases_by_rice.map((purchase, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            <RiceIcon sx={{ mr: 1, fontSize: '1rem' }} />
                                                                            {purchase.rice_variety_name}
                                                                        </Box>
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
                                                                        {parseFloat(purchase.total_quantity_kg).toFixed(2)} kg
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        LKR {parseFloat(purchase.total_amount).toFixed(2)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {purchase.last_purchase_date ? 
                                                                            new Date(purchase.last_purchase_date).toLocaleDateString() : 
                                                                            'N/A'
                                                                        }
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            ) : (
                                                <Typography variant="body2" color="textSecondary" align="center">
                                                    No purchase history available
                                                </Typography>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                                        <Tooltip title="Record Payment">
                                            <IconButton 
                                                onClick={() => openPaymentDialogHandler(customer, true)}
                                                aria-label="record customer payment"
                                                size="small"
                                                disabled={customer.total_pending <= 0}
                                            >
                                                <MoneyIcon color={customer.total_pending > 0 ? "primary" : "disabled"} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="View Purchase History">
                                            <IconButton 
                                                onClick={() => navigate(`/dashboard/customer-purchases/${customer.id}`)}
                                                aria-label="view customer purchases"
                                                size="small"
                                            >
                                                <ShoppingCartIcon color="action" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit Customer">
                                            <IconButton 
                                                onClick={() => {
                                                    setPurchaseForm({
                                                        ...purchaseForm,
                                                        customerOption: 'existing',
                                                        existingCustomerId: customer.id,
                                                        customerName: customer.name,
                                                        phone: customer.phone,
                                                        riceVarietyId: customer.primary_rice_variety_id || ''
                                                    });
                                                    setOpenPurchaseDialog(true);
                                                }}
                                                aria-label="edit customer"
                                                size="small"
                                            >
                                                <WarningIcon color="secondary" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </TabPanel>
            
            {/* New Purchase Dialog */}
            <Dialog 
                open={openPurchaseDialog} 
                onClose={() => setOpenPurchaseDialog(false)} 
                maxWidth="md" 
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
                                <InputLabel id="customer-select-label">Select Customer *</InputLabel>
                                <Select
                                    name="existingCustomerId"
                                    value={purchaseForm.existingCustomerId}
                                    onChange={handleExistingCustomerChange}
                                    labelId="customer-select-label"
                                    label="Select Customer *"
                                    required
                                >
                                    {customers.map(customer => (
                                        <MenuItem key={customer.id} value={customer.id}>
                                            {customer.name} ({customer.phone}) - {customer.primary_rice_variety || 'No rice selected'}
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
                                    label="Customer Name *"
                                    value={purchaseForm.customerName}
                                    onChange={handlePurchaseChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    name="phone"
                                    label="Phone Number *"
                                    value={purchaseForm.phone}
                                    onChange={handlePurchaseChange}
                                    required
                                />
                            </>
                        )}

                        {/* Rice Variety Selection */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="rice-variety-label">Rice Variety *</InputLabel>
                            <Select
                                name="riceVarietyId"
                                value={purchaseForm.riceVarietyId}
                                onChange={handlePurchaseChange}
                                labelId="rice-variety-label"
                                label="Rice Variety *"
                                required
                            >
                                {riceVarieties.map(rice => {
                                    const riceType = riceTypes.find(t => t.id === (rice.rice_type || rice.rice_type_id));
                                    return (
                                        <MenuItem key={rice.id} value={rice.id}>
                                            {rice.name} - {riceType?.name || 'Unknown Type'} ({rice.current_stock_kg}kg available)
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>

                        {selectedRiceStock !== null && (
                            <Alert 
                                severity="info"
                                icon={<InfoIcon />}
                                sx={{ mb: 2 }}
                            >
                                Current stock: {parseFloat(selectedRiceStock).toFixed(2)}kg
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    name="quantityKg"
                                    label="Quantity (kg) *"
                                    type="number"
                                    value={purchaseForm.quantityKg}
                                    onChange={handlePurchaseChange}
                                    required
                                    inputProps={{ min: 0.01, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    name="unitPrice"
                                    label="Unit Price *"
                                    type="number"
                                    value={purchaseForm.unitPrice}
                                    onChange={handlePurchaseChange}
                                    required
                                    inputProps={{ min: 0.01, step: 0.01 }}
                                />
                            </Grid>
                        </Grid>

                        {purchaseForm.quantityKg && purchaseForm.unitPrice && (
                            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                                Total Amount: LKR {(parseFloat(purchaseForm.quantityKg) * parseFloat(purchaseForm.unitPrice)).toFixed(2)}
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    name="paidAmount"
                                    label="Paid Amount"
                                    type="number"
                                    value={purchaseForm.paidAmount}
                                    onChange={handlePurchaseChange}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="payment-method-label">Payment Method</InputLabel>
                                    <Select
                                        name="paymentMethod"
                                        value={purchaseForm.paymentMethod}
                                        onChange={handlePurchaseChange}
                                        labelId="payment-method-label"
                                        label="Payment Method"
                                    >
                                        <MenuItem value="cash">Cash</MenuItem>
                                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                        <MenuItem value="mobile_payment">Mobile Payment</MenuItem>
                                        <MenuItem value="cheque">Cheque</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {purchaseForm.paidAmount && purchaseForm.quantityKg && purchaseForm.unitPrice && (
                            <Alert 
                                severity={purchaseForm.pendingAmount > 0 ? "warning" : "success"} 
                                sx={{ mt: 2, mb: 2 }}
                            >
                                Pending Amount: LKR {(
                                    parseFloat(purchaseForm.quantityKg) * parseFloat(purchaseForm.unitPrice) - 
                                    (parseFloat(purchaseForm.paidAmount) || 0)
                                ).toFixed(2)}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            sx={{ mt: 2 }}
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
                        disabled={loading || !purchaseForm.riceVarietyId || !purchaseForm.quantityKg || !purchaseForm.unitPrice}
                        aria-label="save purchase"
                    >
                        {loading ? 'Saving...' : 'Save Purchase'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog 
                open={openPaymentDialog} 
                onClose={closePaymentDialog} 
                maxWidth="sm" 
                fullWidth
                aria-labelledby="payment-dialog-title"
            >
                <DialogTitle id="payment-dialog-title">
                    {isCustomerPayment ? 'Record Customer Payment' : 'Record Order Payment'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {selectedPaymentTarget && (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                {isCustomerPayment ? (
                                    <>
                                        <Typography variant="body2">
                                            <strong>Customer:</strong> {selectedPaymentTarget.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Total Pending:</strong> LKR {parseFloat(selectedPaymentTarget.total_pending).toFixed(2)}
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="body2">
                                            <strong>Order #:</strong> {selectedPaymentTarget.id}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Customer:</strong> {selectedPaymentTarget.customer_name}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Order Pending:</strong> LKR {parseFloat(selectedPaymentTarget.pending_amount).toFixed(2)}
                                        </Typography>
                                    </>
                                )}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            sx={{ mb: 3 }}
                            name="amount"
                            label="Payment Amount *"
                            type="number"
                            value={paymentForm.amount}
                            onChange={handlePaymentChange}
                            required
                            inputProps={{ 
                                min: 0.01, 
                                step: 0.01,
                                max: isCustomerPayment ? 
                                    selectedPaymentTarget?.total_pending : 
                                    selectedPaymentTarget?.pending_amount
                            }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                            }}
                        />

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel id="payment-method-dialog-label">Payment Method *</InputLabel>
                            <Select
                                name="paymentMethod"
                                value={paymentForm.paymentMethod}
                                onChange={handlePaymentChange}
                                labelId="payment-method-dialog-label"
                                label="Payment Method *"
                                required
                            >
                                <MenuItem value="cash">Cash</MenuItem>
                                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                <MenuItem value="mobile_payment">Mobile Payment</MenuItem>
                                <MenuItem value="cheque">Cheque</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </Select>
                        </FormControl>

                        {paymentForm.paymentMethod !== 'cash' && (
                            <TextField
                                fullWidth
                                sx={{ mb: 3 }}
                                name="referenceNumber"
                                label="Reference Number"
                                value={paymentForm.referenceNumber}
                                onChange={handlePaymentChange}
                                placeholder="Transaction ID / Cheque Number"
                            />
                        )}

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
                    <Button onClick={closePaymentDialog}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleRecordPayment}
                        variant="contained"
                        color="primary"
                        disabled={loading || !paymentForm.amount || !paymentForm.paymentMethod}
                    >
                        {loading ? 'Processing...' : 'Record Payment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PurchaseManagement;