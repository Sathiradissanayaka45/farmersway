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
    FormHelperText
} from '@mui/material';
import { 
    DataGrid, 
    GridToolbar,
    GridActionsCellItem 
} from '@mui/x-data-grid';
import { 
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { useAuth } from '../contexts/AuthContext';

const validationSchema = yup.object({
    name: yup.string()
        .required('Rice variety name is required')
        .min(3, 'Name must be at least 3 characters'),
    riceType: yup.string()
        .required('Rice type is required')
        .oneOf(['paddy', 'selling'], 'Invalid rice type')
});

const RiceManagement = () => {
    const { api } = useAuth();
    const [riceVarieties, setRiceVarieties] = useState([]);
    const [filteredRiceVarieties, setFilteredRiceVarieties] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [currentRice, setCurrentRice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const { enqueueSnackbar } = useSnackbar();

    const fetchRiceVarieties = async () => {
        try {
            setLoading(true);
            const response = await api.get('/rice');

            if (response.data && response.data.success) {
                const varieties = response.data.data.map(item => ({
                    ...item,
                    id: item.id
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
                (rice.rice_type || rice.type) === typeFilter
            );
        }
        
        setFilteredRiceVarieties(filtered);
    }, [searchTerm, typeFilter, riceVarieties]);

    const handleEditRice = (rice) => {
        setCurrentRice(rice);
        formik.setValues({
            name: rice.name,
            riceType: rice.rice_type || rice.type || 'paddy'
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDeleteRice = async (riceId) => {
        try {
            await api.delete(`/rice/${riceId}`);
            enqueueSnackbar('Rice variety deleted successfully', { 
                variant: 'success',
                autoHideDuration: 2000
            });
            fetchRiceVarieties();
        } catch (error) {
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
            riceType: 'paddy'
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                if (editMode && currentRice) {
                    await api.put(`/rice/${currentRice.id}`, values);
                    enqueueSnackbar('Rice variety updated successfully', { 
                        variant: 'success',
                        autoHideDuration: 2000
                    });
                } else {
                    await api.post('/rice', values);
                    enqueueSnackbar('Rice variety added successfully', { 
                        variant: 'success',
                        autoHideDuration: 2000
                    });
                }
                setOpenDialog(false);
                resetForm();
                fetchRiceVarieties();
                setEditMode(false);
                setCurrentRice(null);
            } catch (error) {
                const errorMessage = error.response?.data?.message || 
                    (editMode ? 'Failed to update rice variety' : 'Failed to add rice variety');
                enqueueSnackbar(errorMessage, { 
                    variant: 'error',
                    autoHideDuration: 3000
                });
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
            field: 'riceType', 
            headerName: 'Type', 
            width: 120,
            valueGetter: (params) => params?.row?.rice_type || params?.row?.type || 'unknown',
            renderCell: (params) => (
                <Chip 
                    label={params.row.rice_type || params.row.type || 'unknown'} 
                    color={params.row.rice_type === 'paddy' || params.row.type === 'paddy' ? 'primary' : 'secondary'} 
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 120,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleEditRice(params.row)}
                    showInMenu
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon color="error" />}
                    label="Delete"
                    onClick={() => handleDeleteRice(params.row.id)}
                    showInMenu
                />
            ],
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
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setOpenDialog(true);
                            setEditMode(false);
                            setCurrentRice(null);
                        }}
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
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="paddy">Paddy</MenuItem>
                            <MenuItem value="selling">Selling</MenuItem>
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
                                sortModel: [{ field: 'created_at', sort: 'desc' }]
                            }
                        }}
                        pageSizeOptions={[5, 10, 20]}
                        slots={{
                            toolbar: GridToolbar,
                            loadingOverlay: LinearProgress,
                        }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: false, // We're using our own search
                                sx: {
                                    p: 2,
                                    '& .MuiButton-root': {
                                        color: '#4a5568'
                                    },
                                    '& .MuiFormControl-root': {
                                        minWidth: 200
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
                        setOpenDialog(false);
                        formik.resetForm();
                        setEditMode(false);
                        setCurrentRice(null);
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
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Rice Variety Name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                                margin="normal"
                                autoFocus
                            />
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="rice-type-label">Rice Type</InputLabel>
                                <Select
                                    labelId="rice-type-label"
                                    id="riceType"
                                    name="riceType"
                                    value={formik.values.riceType}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    label="Rice Type"
                                >
                                    <MenuItem value="paddy">Paddy</MenuItem>
                                    <MenuItem value="selling">Selling</MenuItem>
                                </Select>
                                {formik.touched.riceType && formik.errors.riceType && (
                                    <FormHelperText error>{formik.errors.riceType}</FormHelperText>
                                )}
                            </FormControl>
                        </DialogContent>
                        <DialogActions>
                            <Button 
                                onClick={() => {
                                    setOpenDialog(false);
                                    formik.resetForm();
                                    setEditMode(false);
                                    setCurrentRice(null);
                                }}
                                color="inherit"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                variant="contained"
                                disabled={formik.isSubmitting}
                            >
                                {editMode ? 'Update Variety' : 'Add Variety'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default RiceManagement;