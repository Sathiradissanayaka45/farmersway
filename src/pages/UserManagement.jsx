import { useState, useEffect } from 'react';
import {
    Box,
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
    Typography,
    Paper,
    Chip,
    Avatar,
    IconButton,
    Tooltip,
    LinearProgress
} from '@mui/material';
import { 
    DataGrid, 
    GridToolbar,
    GridActionsCellItem 
} from '@mui/x-data-grid';
import { 
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LockReset as ResetPasswordIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { format } from 'date-fns';

const validationSchema = yup.object({
    username: yup.string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters'),
    email: yup.string()
        .email('Enter a valid email')
        .required('Email is required'),
    password: yup.string()
        .min(8, 'Password should be of minimum 8 characters length')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
            'Password must contain at least one uppercase letter, one lowercase letter, and one number')
        .required('Password is required'),
    full_name: yup.string()
        .required('Full name is required')
        .min(3, 'Full name must be at least 3 characters'),
    role: yup.string()
        .required('Role is required'),
});

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                enqueueSnackbar('No authentication token found. Please log in again.', { 
                    variant: 'error',
                    autoHideDuration: 3000
                });
                return;
            }

            const response = await axios.get('http://localhost:5000/api/auth/users', {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && Array.isArray(response.data)) {
                setUsers(response.data.map(user => ({
                    ...user,
                    id: user.id || user._id // Ensure we have an id field
                })));
            } else {
                enqueueSnackbar('No user data received', { 
                    variant: 'warning',
                    autoHideDuration: 2000
                });
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch users';
            enqueueSnackbar(errorMessage, { 
                variant: 'error',
                autoHideDuration: 3000
            });
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditUser = (user) => {
        setCurrentUser(user);
        formik.setValues({
            username: user.username,
            email: user.email,
            password: '', // Don't pre-fill password
            full_name: user.full_name,
            role: user.role
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleDeleteUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/auth/users/${userId}`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            enqueueSnackbar('User deleted successfully', { 
                variant: 'success',
                autoHideDuration: 2000
            });
            fetchUsers();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete user';
            enqueueSnackbar(errorMessage, { 
                variant: 'error',
                autoHideDuration: 3000
            });
        }
    };

    const handleResetPassword = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/auth/reset-password/${userId}`, {}, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            enqueueSnackbar('Password reset initiated', { 
                variant: 'success',
                autoHideDuration: 2000
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to reset password';
            enqueueSnackbar(errorMessage, { 
                variant: 'error',
                autoHideDuration: 3000
            });
        }
    };

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            full_name: '',
            role: 'admin',
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                const token = localStorage.getItem('token');
                if (editMode && currentUser) {
                    // Update existing user
                    await axios.put(`http://localhost:5000/api/auth/users/${currentUser.id}`, values, {
                        withCredentials: true,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    enqueueSnackbar('User updated successfully', { 
                        variant: 'success',
                        autoHideDuration: 2000
                    });
                } else {
                    // Create new user
                    await axios.post('http://localhost:5000/api/auth/create-admin', values, {
                        withCredentials: true,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    enqueueSnackbar('User created successfully', { 
                        variant: 'success',
                        autoHideDuration: 2000
                    });
                }
                setOpenDialog(false);
                resetForm();
                fetchUsers();
                setEditMode(false);
                setCurrentUser(null);
            } catch (error) {
                const errorMessage = error.response?.data?.message || 
                    (editMode ? 'Failed to update user' : 'Failed to create user');
                enqueueSnackbar(errorMessage, { 
                    variant: 'error',
                    autoHideDuration: 3000
                });
            }
        },
    });

    const columns = [
        { 
            field: 'username', 
            headerName: 'Username', 
            flex: 1,
            minWidth: 130,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                        {params.value.charAt(0).toUpperCase()}
                    </Avatar>
                    {params.value}
                </Box>
            )
        },
        { 
            field: 'email', 
            headerName: 'Email', 
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Tooltip title={params.value}>
                    <span>{params.value}</span>
                </Tooltip>
            )
        },
        { 
            field: 'full_name', 
            headerName: 'Full Name', 
            flex: 1,
            minWidth: 150 
        },
        { 
            field: 'role', 
            headerName: 'Role', 
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                const role = params.value || '';
                const formattedRole = role.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                const color = role === 'super_admin' ? 'primary' : 'default';
                
                return (
                    <Chip 
                        label={formattedRole} 
                        color={color}
                        variant="outlined"
                        size="small"
                    />
                );
            }
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            flex: 1,
            minWidth: 160,
            valueFormatter: (params) => {
                if (!params.value) return 'N/A';
                return format(new Date(params.value), 'MMM dd, yyyy hh:mm a');
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleEditUser(params.row)}
                    showInMenu
                />,
                <GridActionsCellItem
                    icon={<ResetPasswordIcon />}
                    label="Reset Password"
                    onClick={() => handleResetPassword(params.row.id)}
                    showInMenu
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon color="error" />}
                    label="Delete"
                    onClick={() => handleDeleteUser(params.row.id)}
                    showInMenu
                    disabled={params.row.role === 'super_admin'} // Prevent deleting super admin
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
                            User Management
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#718096',
                                fontSize: '0.95rem'
                            }}
                        >
                            Manage system users and their roles
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setOpenDialog(true);
                            setEditMode(false);
                            setCurrentUser(null);
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
                        Add New User
                    </Button>
                </Box>

            <Box sx={{ 
                height: 'calc(100vh - 200px)', 
                width: '100%',
                mt: 2,
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
                    rows={users}
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
                            showQuickFilter: true,
                            quickFilterProps: { 
                                debounceMs: 500,
                                sx: { mb: 2 }
                            },
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
                    setCurrentUser(null);
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
                        {editMode ? 'Edit User' : 'Create New User'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>
                        {editMode ? 'Modify user details and permissions' : 'Add a new user to the system'}
                    </Typography>
                </DialogTitle>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent 
                        dividers 
                        sx={{ 
                            px: 3, 
                            py: 2.5,
                            bgcolor: 'white'
                        }}
                    >
                        <Box 
                            sx={{ 
                                display: 'grid', 
                                gap: 2 
                            }}
                        >
                            <TextField
                            fullWidth
                            id="username"
                            name="username"
                            label="Username"
                            value={formik.values.username}
                            onChange={formik.handleChange}
                            error={formik.touched.username && Boolean(formik.errors.username)}
                            helperText={formik.touched.username && formik.errors.username}
                            margin="normal"
                            disabled={editMode}
                        />
                        <TextField
                            fullWidth
                            id="email"
                            name="email"
                            label="Email"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                            margin="normal"
                            type="email"
                        />
                        {!editMode && (
                            <TextField
                                fullWidth
                                id="password"
                                name="password"
                                label="Password"
                                type="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                helperText={formik.touched.password && formik.errors.password}
                                margin="normal"
                            />
                        )}
                        <TextField
                            fullWidth
                            id="full_name"
                            name="full_name"
                            label="Full Name"
                            value={formik.values.full_name}
                            onChange={formik.handleChange}
                            error={formik.touched.full_name && Boolean(formik.errors.full_name)}
                            helperText={formik.touched.full_name && formik.errors.full_name}
                            margin="normal"
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="role-label">Role</InputLabel>
                            <Select
                                labelId="role-label"
                                id="role"
                                name="role"
                                value={formik.values.role}
                                onChange={formik.handleChange}
                                label="Role"
                                disabled={currentUser?.role === 'super_admin' && editMode}
                            >
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="super_admin">Super Admin</MenuItem>
                            </Select>
                        </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => {
                                setOpenDialog(false);
                                formik.resetForm();
                                setEditMode(false);
                                setCurrentUser(null);
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
                            {editMode ? 'Update User' : 'Create User'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Paper>
        </Box>
    );
};

export default UserManagement;