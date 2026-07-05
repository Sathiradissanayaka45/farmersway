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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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

const SalesManagement = () => {
    const { api } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    
    const [tabValue, setTabValue] = useState(0);
    const [sales, setSales] = useState([]);
    const [riceVarieties, setRiceVarieties] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openSaleDialog, setOpenSaleDialog] = useState(false);
    const [selectedRiceStock, setSelectedRiceStock] = useState(null);
    
    const [saleForm, setSaleForm] = useState({
        customerOption: 'existing',
        existingCustomerId: '',
        customerName: '',
        phone: '',
        address: '',
        riceVarietyId: '',
        packetSize: '5',
        packetQuantity: '',
        unitPrice: '',
        paidAmount: '',
        paymentMethod: 'cash',
        notes: '',
        totalPrice: '',
        pendingAmount: '',
        totalQuantityKg: '',
        saleDate: new Date() // Add sale date field with current date as default
    });

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                const [salesRes, riceRes, customersRes] = await Promise.all([
                    api.get('/sales'),
                    api.get('/rice'),
                    api.get('/sales/customers')
                ]);
                
                setSales(salesRes.data.data || []);
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

    const handleCustomerOptionChange = (e) => {
        const value = e.target.value;
        setSaleForm(prev => ({
            ...prev,
            customerOption: value,
            existingCustomerId: value === 'existing' ? prev.existingCustomerId : '',
            customerName: value === 'new' ? prev.customerName : '',
            phone: value === 'new' ? prev.phone : '',
            address: value === 'new' ? prev.address : ''
        }));
        
        if (value === 'existing' && saleForm.existingCustomerId) {
            const selectedCustomer = customers.find(c => c.id === saleForm.existingCustomerId);
            if (selectedCustomer) {
                setSaleForm(prev => ({
                    ...prev,
                    customerName: selectedCustomer.name,
                    phone: selectedCustomer.phone,
                    address: selectedCustomer.address || ''
                }));
            }
        }
    };

    const handleExistingCustomerChange = (e) => {
        const customerId = e.target.value;
        const selectedCustomer = customers.find(c => c.id === customerId);
        
        setSaleForm(prev => ({
            ...prev,
            existingCustomerId: customerId,
            customerName: selectedCustomer ? selectedCustomer.name : '',
            phone: selectedCustomer ? selectedCustomer.phone : '',
            address: selectedCustomer ? selectedCustomer.address || '' : ''
        }));
    };

    const handleSaleChange = (e) => {
        const { name, value } = e.target;
        setSaleForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Calculate total quantity and price when packet size, quantity, or unit price changes
        if (name === 'packetSize' || name === 'packetQuantity' || name === 'unitPrice') {
            const packetSize = name === 'packetSize' ? value : saleForm.packetSize;
            const packetQuantity = name === 'packetQuantity' ? value : saleForm.packetQuantity;
            const unitPrice = name === 'unitPrice' ? value : saleForm.unitPrice;
            
            let totalQuantityKg = '';
            let totalPrice = '';
            
            // Calculate total quantity in kg
            if (packetSize && packetQuantity) {
                totalQuantityKg = (parseFloat(packetSize) * parseFloat(packetQuantity)).toFixed(2);
            }
            
            // Calculate total price
            if (totalQuantityKg && unitPrice) {
                totalPrice = (parseFloat(totalQuantityKg) * parseFloat(unitPrice)).toFixed(2);
            }
            
            // Calculate pending amount
            let pendingAmount = '';
            if (totalPrice) {
                pendingAmount = (parseFloat(totalPrice) - (parseFloat(saleForm.paidAmount) || 0)).toFixed(2);
            }
            
            setSaleForm(prev => ({
                ...prev,
                totalQuantityKg,
                totalPrice,
                pendingAmount
            }));
        }
        
        // Update pending amount when paid amount changes
        if (name === 'paidAmount' && saleForm.totalPrice) {
            const pending = parseFloat(saleForm.totalPrice) - (parseFloat(value) || 0);
            setSaleForm(prev => ({
                ...prev,
                pendingAmount: pending.toFixed(2)
            }));
        }

        if (name === 'riceVarietyId') {
            const selectedRice = riceVarieties.find(r => r.id === value);
            setSelectedRiceStock(selectedRice ? selectedRice.current_stock_kg : null);
        }
    };

    // Add handler for date change
    const handleDateChange = (date) => {
        setSaleForm(prev => ({
            ...prev,
            saleDate: date
        }));
    };

    const handleSaleSubmit = async () => {
        try {
            // Validate form
            if (!saleForm.riceVarietyId || !saleForm.packetQuantity || !saleForm.unitPrice) {
                enqueueSnackbar('Please fill all required fields', { variant: 'error' });
                return;
            }
            
            if (saleForm.customerOption === 'existing' && !saleForm.existingCustomerId) {
                enqueueSnackbar('Please select a customer', { variant: 'error' });
                return;
            }
            
            if (saleForm.customerOption === 'new' && (!saleForm.customerName || !saleForm.phone)) {
                enqueueSnackbar('Please enter customer name and phone', { variant: 'error' });
                return;
            }

            const totalQuantityKg = parseFloat(saleForm.totalQuantityKg);
            if (selectedRiceStock !== null && totalQuantityKg > selectedRiceStock) {
                enqueueSnackbar(
                    `Insufficient stock. Available: ${selectedRiceStock}kg, Requested: ${totalQuantityKg}kg`, 
                    { variant: 'error' }
                );
                return;
            }
            
            setLoading(true);
            
            const requestData = {
                customerId: saleForm.existingCustomerId,
                customerName: saleForm.customerName,
                customerPhone: saleForm.phone,
                customerAddress: saleForm.address,
                riceVarietyId: saleForm.riceVarietyId,
                quantityKg: totalQuantityKg,
                packetSize: parseFloat(saleForm.packetSize),
                packetQuantity: parseInt(saleForm.packetQuantity),
                unitPrice: parseFloat(saleForm.unitPrice),
                paidAmount: parseFloat(saleForm.paidAmount || 0),
                paymentMethod: saleForm.paymentMethod,
                notes: saleForm.notes,
                saleDate: saleForm.saleDate.toISOString().split('T')[0] // Format date as YYYY-MM-DD
            };
            
            await api.post('/sales', requestData);
            
            enqueueSnackbar('Sale recorded successfully', { variant: 'success' });
            setOpenSaleDialog(false);
            
            // Reset form
            setSaleForm({
                customerOption: 'existing',
                existingCustomerId: '',
                customerName: '',
                phone: '',
                address: '',
                riceVarietyId: '',
                packetSize: '5',
                packetQuantity: '',
                unitPrice: '',
                paidAmount: '',
                paymentMethod: 'cash',
                notes: '',
                totalPrice: '',
                pendingAmount: '',
                totalQuantityKg: '',
                saleDate: new Date() // Reset to current date
            });
            setSelectedRiceStock(null);
            
            // Refresh data
            const [salesRes, customersRes, riceRes] = await Promise.all([
                api.get('/sales'),
                api.get('/sales/customers'),
                api.get('/rice')
            ]);
            
            setSales(salesRes.data.data || []);
            setCustomers(customersRes.data.data || []);
            setRiceVarieties(riceRes.data.data || []);
            
        } catch (error) {
            console.error('Error creating sale:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to record sale', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

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
                await api.post(`/sales/customers/${target.id}/payments`, {
                    amount: paymentAmount,
                    paymentMethod: 'cash',
                    notes: `General payment for customer ${target.name}`
                });
            } else {
                await api.post(`/sales/${target.id}/payments`, {
                    amount: paymentAmount,
                    paymentMethod: 'cash',
                    notes: `Payment for sale #${target.id}`
                });
            }
            
            enqueueSnackbar('Payment recorded successfully', { variant: 'success' });
            
            const [salesRes, customersRes] = await Promise.all([
                api.get('/sales'),
                api.get('/sales/customers')
            ]);
            
            setSales(salesRes.data.data || []);
            setCustomers(customersRes.data.data || []);
            
        } catch (error) {
            console.error('Error recording payment:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to record payment', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Rice Sales Management
                </Typography>
                
                <Paper sx={{ mb: 3 }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        aria-label="sales management tabs"
                    >
                        <Tab label="Sales" icon={<ShoppingCartIcon />} />
                        <Tab label="Customers" icon={<PeopleIcon />} />
                    </Tabs>
                </Paper>
                
                {loading && <LinearProgress />}
                
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenSaleDialog(true)}
                        >
                            New Sale
                        </Button>
                    </Box>
                
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Rice Type</TableCell>
                                <TableCell>Packet Size</TableCell>
                                <TableCell>Packets</TableCell>
                                <TableCell>Quantity (kg)</TableCell>
                                <TableCell>Unit Price</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Paid</TableCell>
                                <TableCell>Pending</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sales.map((sale) => {
                                const rice = riceVarieties.find(r => r.id === sale.rice_variety_id);
                                return (
                                    <TableRow key={sale.id}>
                                        <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                                        <TableCell>{sale.customer_name}</TableCell>
                                        <TableCell>
                                            {sale.rice_variety_name}
                                            {rice && (
                                                <Tooltip title={`Current stock: ${rice.current_stock_kg}kg`}>
                                                    <InfoIcon color="info" sx={{ ml: 1, fontSize: '1rem' }} />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>{sale.packet_size ? `${sale.packet_size}kg` : 'N/A'}</TableCell>
                                        <TableCell>{sale.packet_quantity || 'N/A'}</TableCell>
                                        <TableCell>{sale.quantity_kg}</TableCell>
                                        <TableCell>{sale.unit_price}</TableCell>
                                        <TableCell>{sale.total_price}</TableCell>
                                        <TableCell>{sale.paid_amount}</TableCell>
                                        <TableCell>{sale.pending_amount}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Record Payment">
                                                <IconButton 
                                                    onClick={() => handleRecordPayment(sale)}
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
                                <TableCell>Type</TableCell>
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
                                    <TableCell>{customer.customer_type}</TableCell>
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
                                        <Tooltip title="View Sales">
                                            <IconButton 
                                                onClick={() => navigate(`/dashboard/selling-customers/${customer.id}`)}
                                                aria-label="view customer sales"
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
                    open={openSaleDialog} 
                    onClose={() => setOpenSaleDialog(false)} 
                    maxWidth="sm" 
                    fullWidth
                    aria-labelledby="new-sale-dialog"
                >
                    <DialogTitle id="new-sale-dialog">New Rice Sale</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            {/* Add Date Picker at the top */}
                            <DatePicker
                                label="Sale Date"
                                value={saleForm.saleDate}
                                onChange={handleDateChange}
                                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                                maxDate={new Date()}
                            />

                            <FormControl component="fieldset" sx={{ mb: 3 }}>
                                <FormLabel component="legend">Customer Option</FormLabel>
                                <RadioGroup
                                    row
                                    name="customerOption"
                                    value={saleForm.customerOption}
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

                        {saleForm.customerOption === 'existing' ? (
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="customer-select-label">Select Customer</InputLabel>
                                <Select
                                    name="existingCustomerId"
                                    value={saleForm.existingCustomerId}
                                    onChange={handleExistingCustomerChange}
                                    labelId="customer-select-label"
                                    label="Select Customer"
                                    required
                                >
                                    {customers.map(customer => (
                                        <MenuItem key={customer.id} value={customer.id}>
                                            {customer.name} ({customer.phone}) - {customer.customer_type}
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
                                    value={saleForm.customerName}
                                    onChange={handleSaleChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    name="phone"
                                    label="Phone Number"
                                    value={saleForm.phone}
                                    onChange={handleSaleChange}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    name="address"
                                    label="Address"
                                    value={saleForm.address}
                                    onChange={handleSaleChange}
                                />
                            </>
                        )}

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="rice-variety-label">Rice Variety</InputLabel>
                            <Select
                                name="riceVarietyId"
                                value={saleForm.riceVarietyId}
                                onChange={handleSaleChange}
                                labelId="rice-variety-label"
                                label="Rice Variety"
                                required
                            >
                                {riceVarieties.map(rice => (
                                    <MenuItem key={rice.id} value={rice.id}>
                                        {rice.name} ({rice.current_stock_kg}kg available)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {selectedRiceStock !== null && (
                            <Alert 
                                severity={saleForm.totalQuantityKg && parseFloat(saleForm.totalQuantityKg) > selectedRiceStock ? 'error' : 'info'}
                                icon={<WarningIcon />}
                                sx={{ mb: 2 }}
                            >
                                Current stock: {selectedRiceStock}kg
                                {saleForm.totalQuantityKg && parseFloat(saleForm.totalQuantityKg) > selectedRiceStock && (
                                    <span> - Not enough stock!</span>
                                )}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel id="packet-size-label">Packet Size</InputLabel>
                                <Select
                                    name="packetSize"
                                    value={saleForm.packetSize}
                                    onChange={handleSaleChange}
                                    labelId="packet-size-label"
                                    label="Packet Size"
                                    required
                                >
                                    <MenuItem value="5">5kg</MenuItem>
                                    <MenuItem value="10">10kg</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                name="packetQuantity"
                                label="Number of Packets"
                                type="number"
                                value={saleForm.packetQuantity}
                                onChange={handleSaleChange}
                                required
                                inputProps={{ min: 1, step: 1 }}
                            />
                        </Box>

                        {saleForm.totalQuantityKg && (
                            <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Total Quantity: {saleForm.totalQuantityKg} kg
                            </Typography>
                        )}

                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            name="unitPrice"
                            label="Unit Price (per kg)"
                            type="number"
                            value={saleForm.unitPrice}
                            onChange={handleSaleChange}
                            required
                            inputProps={{ min: 0.01, step: 0.01 }}
                        />

                        {saleForm.totalPrice && (
                            <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Total Price: {saleForm.totalPrice}
                            </Typography>
                        )}

                        <TextField
                            fullWidth
                            sx={{ mb: 2 }}
                            name="paidAmount"
                            label="Paid Amount"
                            type="number"
                            value={saleForm.paidAmount}
                            onChange={handleSaleChange}
                            inputProps={{ min: 0, step: 0.01 }}
                        />

                        {saleForm.pendingAmount && (
                            <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Pending Amount: {saleForm.pendingAmount}
                            </Typography>
                        )}

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="payment-method-label">Payment Method</InputLabel>
                            <Select
                                name="paymentMethod"
                                value={saleForm.paymentMethod}
                                onChange={handleSaleChange}
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
                            value={saleForm.notes}
                            onChange={handleSaleChange}
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => setOpenSaleDialog(false)}
                            aria-label="cancel sale"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaleSubmit}
                            variant="contained"
                            disabled={loading || 
                                (selectedRiceStock !== null && saleForm.totalQuantityKg && 
                                 parseFloat(saleForm.totalQuantityKg) > selectedRiceStock)}
                            aria-label="save sale"
                        >
                            Save Sale
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default SalesManagement;