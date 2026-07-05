// pages/RiceTypeManagement.js
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
    IconButton,
    Alert
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
        .required('Rice type name is required')
        .min(2, 'Name must be at least 2 characters'),
    description: yup.string()
        .max(500, 'Description must be less than 500 characters')
});

const RiceTypeManagement = () => {
    const { api } = useAuth();
    const [riceTypes, setRiceTypes] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [currentType, setCurrentType] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const fetchRiceTypes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/rice-types');

            if (response.data && response.data.success) {
                const types = response.data.data.map(item => ({
                    ...item,
                    id: item.id
                }));
                setRiceTypes(types);
            }
        } catch (error) {
            console.error('Error fetching rice types:', error);
            enqueueSnackbar('Failed to fetch rice types', { 
                variant: 'error',
                autoHideDuration: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiceTypes();
    }, []);

    const handleEditType = (type) => {
        setCurrentType(type);
        formik.setValues({
            name: type.name,
            description: type.description || ''
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDeleteType = async (typeId) => {
        if (!window.confirm('Are you sure you want to delete this rice type?')) {
            return;
        }

        try {
            await api.delete(`/rice-types/${typeId}`);
            enqueueSnackbar('Rice type deleted successfully', { 
                variant: 'success',
                autoHideDuration: 2000
            });
            fetchRiceTypes();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete rice type';
            enqueueSnackbar(errorMessage, { 
                variant: 'error',
                autoHideDuration: 3000
            });
        }
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            description: ''
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                if (editMode && currentType) {
                    await api.put(`/rice-types/${currentType.id}`, values);
                    enqueueSnackbar('Rice type updated successfully', { 
                        variant: 'success',
                        autoHideDuration: 2000
                    });
                } else {
                    await api.post('/rice-types', values);
                    enqueueSnackbar('Rice type added successfully', { 
                        variant: 'success',
                        autoHideDuration: 2000
                    });
                }
                setOpenDialog(false);
                resetForm();
                fetchRiceTypes();
                setEditMode(false);
                setCurrentType(null);
            } catch (error) {
                const errorMessage = error.response?.data?.message || 
                    (editMode ? 'Failed to update rice type' : 'Failed to add rice type');
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
            headerName: 'Rice Type', 
            flex: 1,
            minWidth: 200
        },
        { 
            field: 'description', 
            headerName: 'Description', 
            flex: 2,
            minWidth: 300
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
                    onClick={() => handleEditType(params.row)}
                    showInMenu
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon color="error" />}
                    label="Delete"
                    onClick={() => handleDeleteType(params.row.id)}
                    showInMenu
                />
            ],
        }
    ];

    return (
        <Box sx={{ height: '100vh', p: 3, bgcolor: '#f5f7fa' }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: '#2d3748', mb: 1 }}>
                            Rice Types Management
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096' }}>
                            Manage rice types (categories) used in the system
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setOpenDialog(true);
                            setEditMode(false);
                            setCurrentType(null);
                        }}
                        sx={{ textTransform: 'none' }}
                    >
                        Add New Type
                    </Button>
                </Box>

                <Box sx={{ height: 'calc(100vh - 240px)', width: '100%' }}>
                    <DataGrid
                        loading={loading}
                        rows={riceTypes}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10 }
                            }
                        }}
                        pageSizeOptions={[5, 10, 20]}
                        slots={{
                            toolbar: GridToolbar,
                            loadingOverlay: LinearProgress,
                        }}
                        disableRowSelectionOnClick
                    />
                </Box>

                <Dialog 
                    open={openDialog} 
                    onClose={() => {
                        setOpenDialog(false);
                        formik.resetForm();
                        setEditMode(false);
                        setCurrentType(null);
                    }}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {editMode ? 'Edit Rice Type' : 'Add New Rice Type'}
                    </DialogTitle>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogContent>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Rice Type Name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                                margin="normal"
                                autoFocus
                            />
                            
                            <TextField
                                fullWidth
                                id="description"
                                name="description"
                                label="Description"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.description && Boolean(formik.errors.description)}
                                helperText={formik.touched.description && formik.errors.description}
                                margin="normal"
                                multiline
                                rows={3}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button 
                                onClick={() => {
                                    setOpenDialog(false);
                                    formik.resetForm();
                                    setEditMode(false);
                                    setCurrentType(null);
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
                                {editMode ? 'Update Type' : 'Add Type'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default RiceTypeManagement;