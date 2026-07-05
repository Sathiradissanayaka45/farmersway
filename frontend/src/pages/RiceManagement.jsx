import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Paper,
    LinearProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Alert
} from '@mui/material';
import { 
    DataGrid, 
    GridToolbar
} from '@mui/x-data-grid';
import { 
    Add as AddIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { useAuth } from '../contexts/AuthContext';

// Updated validation schema
const validationSchema = yup.object({
    name: yup.string()
        .required('Rice variety name is required')
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must be less than 100 characters'),
    riceType: yup.number()
        .required('Rice type is required')
        .positive('Please select a valid rice type')
        .integer('Please select a valid rice type')
});

const RiceManagement = () => {
    const { api } = useAuth();
    const [riceVarieties, setRiceVarieties] = useState([]);
    const [riceTypes, setRiceTypes] = useState([]);
    const [filteredRiceVarieties, setFilteredRiceVarieties] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [riceTypesLoading, setRiceTypesLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [currentRice, setCurrentRice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const { enqueueSnackbar } = useSnackbar();

    // Debug log
    console.log('Component rendered with state:', {
        riceTypesCount: riceTypes.length,
        riceVarietiesCount: riceVarieties.length,
        openDialog,
        editMode
    });

    // Fetch rice types from database
    const fetchRiceTypes = async () => {
        try {
            setRiceTypesLoading(true);
            console.log('Fetching rice types...');
            const response = await api.get('/rice-types');
            console.log('Rice types response:', response.data);
            
            if (response.data && response.data.success) {
                setRiceTypes(response.data.data);
            } else {
                enqueueSnackbar('Failed to load rice types', { 
                    variant: 'warning',
                    autoHideDuration: 3000
                });
            }
        } catch (error) {
            console.error('Error fetching rice types:', error);
            enqueueSnackbar('Failed to fetch rice types. Please check if rice-types API is working.', { 
                variant: 'error',
                autoHideDuration: 5000
            });
            // Set default types as fallback
            setRiceTypes([
                { id: 1, name: 'paddy', description: 'Raw paddy rice' },
                { id: 2, name: 'selling', description: 'Selling quality rice' }
            ]);
        } finally {
            setRiceTypesLoading(false);
        }
    };

    const fetchRiceVarieties = async () => {
        try {
            setLoading(true);
            console.log('Fetching rice varieties...');
            const response = await api.get('/rice');
            console.log('Rice varieties response:', response.data);

            if (response.data && response.data.success) {
                const varieties = response.data.data.map(item => ({
                    ...item,
                    id: item.id,
                    rice_type_name: item.rice_type_name || 'Unknown'
                }));
                setRiceVarieties(varieties);
                setFilteredRiceVarieties(varieties);
            } else {
                enqueueSnackbar('No rice varieties data received', { 
                    variant: 'warning',
                    autoHideDuration: 2000
                });
                setRiceVarieties([]);
                setFilteredRiceVarieties([]);
            }
        } catch (error) {
            console.error('Error fetching rice varieties:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch rice varieties';
            enqueueSnackbar(errorMessage, { 
                variant: 'error',
                autoHideDuration: 3000
            });
            setRiceVarieties([]);
            setFilteredRiceVarieties([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiceTypes();
        fetchRiceVarieties();
    }, []);

    // Apply filters whenever searchTerm or typeFilter changes
    useEffect(() => {
        let filtered = riceVarieties;
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(rice => 
                rice.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(rice => 
                rice.rice_type?.toString() === typeFilter
            );
        }
        
        setFilteredRiceVarieties(filtered);
    }, [searchTerm, typeFilter, riceVarieties]);

    const handleEditRice = (rice) => {
        console.log('Editing rice:', rice);
        setCurrentRice(rice);
        formik.setValues({
            name: rice.name,
            riceType: rice.rice_type || ''
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDeleteRice = async (riceId) => {
        if (!window.confirm('Are you sure you want to delete this rice variety?')) {
            return;
        }
        
        try {
            console.log('Deleting rice variety:', riceId);
            const response = await api.delete(`/rice/${riceId}`);
            
            if (response.data && response.data.success) {
                enqueueSnackbar('Rice variety deleted successfully', { 
                    variant: 'success',
                    autoHideDuration: 2000
                });
                fetchRiceVarieties();
            } else {
                enqueueSnackbar('Failed to delete rice variety', { 
                    variant: 'error',
                    autoHideDuration: 3000
                });
            }
        } catch (error) {
            console.error('Error deleting rice variety:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete rice variety';
            enqueueSnackbar(errorMessage, { 
                variant: 'error',
                autoHideDuration: 3000
            });
        }
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            riceType: ''
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm, setSubmitting }) => {
            console.log('Form submitted with values:', values);
            console.log('Edit mode:', editMode);
            console.log('Current rice ID:', currentRice?.id);
            
            try {
                let response;
                if (editMode && currentRice) {
                    console.log(`Making PUT request to /rice/${currentRice.id} with:`, values);
                    response = await api.put(`/rice/${currentRice.id}`, values);
                } else {
                    console.log('Making POST request to /rice with:', values);
                    response = await api.post('/rice', values);
                }
                
                console.log('API Response:', response.data);
                
                if (response.data && response.data.success) {
                    enqueueSnackbar(
                        editMode ? 'Rice variety updated successfully' : 'Rice variety added successfully', 
                        { 
                            variant: 'success',
                            autoHideDuration: 2000
                        }
                    );
                    setOpenDialog(false);
                    resetForm();
                    fetchRiceVarieties();
                    setEditMode(false);
                    setCurrentRice(null);
                } else {
                    enqueueSnackbar(response.data?.message || 'Operation failed', { 
                        variant: 'error',
                        autoHideDuration: 3000
                    });
                }
            } catch (error) {
                console.error('Form submission error:', error);
                console.error('Error details:', {
                    message: error.message,
                    response: error.response,
                    request: error.request
                });
                
                let errorMessage = 'An error occurred';
                if (error.response) {
                    errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        `Server error: ${error.response.status}`;
                } else if (error.request) {
                    errorMessage = 'No response from server. Check network connection.';
                } else {
                    errorMessage = error.message || 'Failed to process request';
                }
                
                enqueueSnackbar(errorMessage, { 
                    variant: 'error',
                    autoHideDuration: 4000
                });
            } finally {
                setSubmitting(false);
            }
        },
    });

    const columns = [
        { 
            field: 'id', 
            headerName: 'ID', 
            width: 80 
        },
        { 
            field: 'name', 
            headerName: 'Rice Variety', 
            flex: 1,
            minWidth: 200
        },
        { 
            field: 'rice_type_name', 
            headerName: 'Type', 
            width: 120,
            renderCell: (params) => {
                const typeName = params.value || 'Unknown';
                const isPaddy = typeName.toLowerCase() === 'paddy';
                return (
                    <Chip 
                        label={typeName} 
                        color={isPaddy ? 'primary' : 'secondary'} 
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },
        { 
            field: 'current_stock_kg', 
            headerName: 'Current Stock (kg)', 
            width: 150,
            type: 'number',
            valueFormatter: (params) => params.value?.toFixed(2) || '0.00'
        },
        { 
            field: 'min_stock_level', 
            headerName: 'Min Stock (kg)', 
            width: 150,
            type: 'number',
            valueFormatter: (params) => params.value?.toFixed(2) || '100.00'
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            renderCell: (params) => (
                <Box>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditRice(params.row)}
                        sx={{ mr: 1 }}
                    >
                        Edit
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteRice(params.row.id)}
                    >
                        Delete
                    </Button>
                </Box>
            )
        }
    ];

    return (
        <Box 
            sx={{ 
                height: '100vh', 
                p: 3, 
                bgcolor: '#f5f7fa',
                overflow: 'auto'
            }}
        >
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
            >
                <Box 
                    sx={{ 
                        mb: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #edf2f7',
                        pb: 3
                    }}
                >
                    <Box>
                        <Typography 
                            variant="h5" 
                            component="h1" 
                            sx={{ 
                                fontWeight: 600,
                                color: '#2d3748',
                                mb: 1
                            }}
                        >
                            Rice Varieties
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#718096',
                                fontSize: '0.95rem'
                            }}
                        >
                            Manage rice varieties in the system
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        
                        <Button
                            variant="outlined"
                            onClick={() => {
                                fetchRiceTypes();
                                fetchRiceVarieties();
                            }}
                            disabled={loading}
                            sx={{ 
                                textTransform: 'none',
                                borderRadius: 2,
                            }}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                console.log('Add button clicked');
                                console.log('Rice types:', riceTypes);
                                setOpenDialog(true);
                                setEditMode(false);
                                setCurrentRice(null);
                                formik.resetForm();
                            }}
                            disabled={riceTypesLoading}
                            sx={{ 
                                textTransform: 'none',
                                bgcolor: '#3182ce',
                                '&:hover': {
                                    bgcolor: '#2c5282'
                                },
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                boxShadow: '0 2px 4px rgba(49,130,206,0.2)'
                            }}
                        >
                            Add New Variety
                        </Button>
                    </Box>
                </Box>

                {riceTypes.length === 0 && !riceTypesLoading && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        No rice types found. Please add rice types first or check database connection.
                    </Alert>
                )}

                {/* Filter Controls */}
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mb: 3,
                    flexWrap: 'wrap'
                }}>
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search rice varieties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ 
                            minWidth: 250,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Filter by Type</InputLabel>
                        <Select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            label="Filter by Type"
                            sx={{ borderRadius: 2 }}
                            disabled={riceTypesLoading}
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            {riceTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ 
                    height: 'calc(100vh - 240px)', 
                    width: '100%',
                    '& .MuiDataGrid-root': {
                        border: 'none',
                        borderRadius: 2,
                        bgcolor: 'white',
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none',
                        },
                        '& .MuiDataGrid-row:hover': {
                            bgcolor: '#f7fafc'
                        }
                    }
                }}>
                    <DataGrid
                        loading={loading}
                        rows={filteredRiceVarieties}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10 }
                            },
                            sorting: {
                                sortModel: [{ field: 'name', sort: 'asc' }]
                            }
                        }}
                        pageSizeOptions={[5, 10, 20]}
                        slots={{
                            toolbar: GridToolbar,
                            loadingOverlay: LinearProgress,
                        }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: false,
                                sx: {
                                    p: 2,
                                    '& .MuiButton-root': {
                                        color: '#4a5568'
                                    }
                                }
                            }
                        }}
                        disableRowSelectionOnClick
                        density="comfortable"
                        sx={{
                            '& .MuiDataGrid-cell': {
                                py: 1.5,
                                px: 2,
                                fontSize: '0.95rem',
                                color: '#2d3748'
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: '#f8fafc',
                                borderBottom: '2px solid #edf2f7',
                                '& .MuiDataGrid-columnHeaderTitle': {
                                    fontWeight: 600,
                                    color: '#4a5568'
                                }
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '2px solid #edf2f7'
                            }
                        }}
                    />
                </Box>

                <Dialog 
                    open={openDialog} 
                    onClose={() => {
                        if (!formik.isSubmitting) {
                            setOpenDialog(false);
                            formik.resetForm();
                            setEditMode(false);
                            setCurrentRice(null);
                        }
                    }}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        borderBottom: '1px solid #edf2f7',
                        bgcolor: '#f8fafc',
                        px: 3,
                        py: 2.5
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                            {editMode ? 'Edit Rice Variety' : 'Add New Rice Variety'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>
                            {editMode ? 'Modify rice variety details' : 'Add a new rice variety to the system'}
                        </Typography>
                    </DialogTitle>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogContent dividers sx={{ px: 3, py: 2.5, bgcolor: 'white' }}>
                            {riceTypes.length === 0 ? (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    No rice types available. Please add rice types first.
                                </Alert>
                            ) : null}
                            
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Rice Variety Name *"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                                margin="normal"
                                autoFocus
                                disabled={formik.isSubmitting || riceTypesLoading}
                                inputProps={{
                                    'data-testid': 'rice-name-input'
                                }}
                            />
                            
                            <FormControl 
                                fullWidth 
                                margin="normal"
                                error={formik.touched.riceType && Boolean(formik.errors.riceType)}
                                disabled={formik.isSubmitting || riceTypesLoading || riceTypes.length === 0}
                            >
                                <InputLabel id="rice-type-label">Rice Type *</InputLabel>
                                <Select
                                    labelId="rice-type-label"
                                    id="riceType"
                                    name="riceType"
                                    value={formik.values.riceType}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    label="Rice Type *"
                                    inputProps={{
                                        'data-testid': 'rice-type-select'
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Select Rice Type</em>
                                    </MenuItem>
                                    {riceTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name} {type.description ? `- ${type.description}` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {formik.touched.riceType && formik.errors.riceType && (
                                    <FormHelperText error>{formik.errors.riceType}</FormHelperText>
                                )}
                            </FormControl>
                            
                            {/* Debug info in dialog */}
                            <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                    Form values: {JSON.stringify(formik.values)}
                                </Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button 
                                onClick={() => {
                                    if (!formik.isSubmitting) {
                                        setOpenDialog(false);
                                        formik.resetForm();
                                        setEditMode(false);
                                        setCurrentRice(null);
                                    }
                                }}
                                color="inherit"
                                disabled={formik.isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit"
                                variant="contained"
                                disabled={formik.isSubmitting || riceTypesLoading || riceTypes.length === 0}
                                onClick={(e) => {
                                    console.log('Submit button clicked');
                                    console.log('Form values:', formik.values);
                                    console.log('Form errors:', formik.errors);
                                    console.log('Form is valid:', formik.isValid);
                                    
                                    // Manually trigger validation
                                    formik.validateForm().then(errors => {
                                        console.log('Validation errors:', errors);
                                        if (Object.keys(errors).length === 0) {
                                            // Form is valid, submit it
                                            formik.handleSubmit(e);
                                        } else {
                                            enqueueSnackbar('Please fix the errors before submitting', {
                                                variant: 'error'
                                            });
                                        }
                                    });
                                }}
                                sx={{ minWidth: 120 }}
                            >
                                {formik.isSubmitting ? 'Processing...' : (editMode ? 'Update Variety' : 'Add Variety')}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default RiceManagement;