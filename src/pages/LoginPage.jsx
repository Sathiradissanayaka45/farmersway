import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    IconButton,
    InputAdornment
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            enqueueSnackbar('Login successful!', { variant: 'success' });
            navigate('/dashboard');
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
            enqueueSnackbar('Login failed', { variant: 'error' });
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100vw',
                position: 'fixed',
                top: 0,
                left: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f7fafc',
                backgroundImage: 'linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%)',
                p: 3,
                overflow: 'auto'
            }}
        >
            <Container 
                maxWidth="sm" 
                sx={{
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            width: '100%',
                            borderRadius: 2,
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                            bgcolor: 'rgba(255,255,255,0.98)',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography 
                                component="h1" 
                                variant="h4" 
                                sx={{ 
                                    fontWeight: 700,
                                    color: '#2d3748',
                                    mb: 1
                                }}
                            >
                                Welcome Back
                            </Typography>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    color: '#718096',
                                    mb: 3
                                }}
                            >
                                Rice Mill Management System
                            </Typography>
                        </Box>

                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    mb: 3,
                                    borderRadius: 1,
                                    '& .MuiAlert-icon': {
                                        color: '#e53e3e'
                                    }
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Box 
                            component="form" 
                            onSubmit={handleSubmit} 
                            noValidate 
                            sx={{ 
                                width: '100%',
                                '& .MuiTextField-root': {
                                    mb: 2
                                }
                            }}
                        >
                            <TextField
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                autoComplete="username"
                                autoFocus
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                        bgcolor: 'white',
                                        '&:hover fieldset': {
                                            borderColor: '#3182ce'
                                        }
                                    }
                                }}
                            />
                            <TextField
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                        bgcolor: 'white',
                                        '&:hover fieldset': {
                                            borderColor: '#3182ce'
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{
                                    mt: 2,
                                    py: 1.5,
                                    bgcolor: '#3182ce',
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    boxShadow: '0 4px 6px -1px rgba(49,130,206,0.3)',
                                    '&:hover': {
                                        bgcolor: '#2c5282',
                                        boxShadow: '0 6px 8px -1px rgba(49,130,206,0.4)'
                                    }
                                }}
                            >
                                Sign In
                            </Button>
                        </Box>
                    </Paper>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            mt: 3,
                            color: '#718096',
                            textAlign: 'center'
                        }}
                    >
                        © {new Date().getFullYear()} Rice Mill Management System. All rights reserved.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default LoginPage;
