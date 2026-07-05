import React, { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Avatar,
    Tooltip,
    Collapse,
    Badge
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    People as PeopleIcon,
    Inventory as InventoryIcon,
    ShoppingCart as ShoppingCartIcon,
    LocalShipping as LocalShippingIcon,
    Settings as SettingsIcon,
    AttachMoney as AttachMoneyIcon,
    Receipt as ReceiptIcon,
    Assessment as AssessmentIcon,
    Grain as GrainIcon,
    Factory as FactoryIcon,
    PointOfSale as PointOfSaleIcon,
    MoneyOff as MoneyOffIcon,
    AccountBalance as AccountBalanceIcon,
    Warning as WarningIcon,
    MenuBook as MenuBookIcon,
    Logout as LogoutIcon,
    ExpandLess,
    ExpandMore,
    AccountCircle,
    ReceiptLong as ReceiptLongIcon,
    Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const drawerWidth = 280;

// Complete menu items with all routes organized by sections
const menuItems = [
    // Main Section
    { 
        text: 'Dashboard', 
        icon: <DashboardIcon />, 
        path: '/dashboard', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'User Management', 
        icon: <PeopleIcon />, 
        path: '/dashboard/users', 
        roles: ['super_admin'] 
    },
    { type: 'divider' },
    
    // Inventory Management Section
    { type: 'header', text: 'INVENTORY MANAGEMENT' },
    { 
        text: 'Rice Types', 
        icon: <GrainIcon />, 
        path: '/dashboard/rice-types', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'Rice Varieties', 
        icon: <MenuBookIcon />, 
        path: '/dashboard/rice', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'Inventory', 
        icon: <InventoryIcon />, 
        path: '/dashboard/inventory', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'Low Stock', 
        icon: <WarningIcon />, 
        path: '/dashboard/lowStock', 
        roles: ['admin', 'super_admin'],
        badge: '!' 
    },
    { type: 'divider' },
    
    // Processing Section
    { type: 'header', text: 'PROCESSING' },
    { 
        text: 'Purchases', 
        icon: <ShoppingCartIcon />, 
        path: '/dashboard/purchases', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'Boiling', 
        icon: <LocalShippingIcon />, 
        path: '/dashboard/boiling', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'Milling', 
        icon: <FactoryIcon />, 
        path: '/dashboard/milling', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'Sales', 
        icon: <PointOfSaleIcon />, 
        path: '/dashboard/sales', 
        roles: ['admin', 'super_admin'] 
    },
    { type: 'divider' },
    
    // Financial Section
    { type: 'header', text: 'FINANCIAL' },
    { 
        text: 'Extra Income', 
        icon: <AttachMoneyIcon />, 
        path: '/dashboard/extra-income', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'Extra Expenses', 
        icon: <MoneyOffIcon />, 
        path: '/dashboard/extra-expenses', 
        roles: ['admin', 'super_admin'] 
    },
    { 
        text: 'Financial Reports', 
        icon: <AssessmentIcon />, 
        path: '/dashboard/financial-reports', 
        roles: ['admin', 'super_admin'] 
    },
    
    // Accounting Sub-menu
    { 
        text: 'Accounting', 
        icon: <AccountBalanceIcon />, 
        children: [
            {
                text: 'Chart of Accounts',
                icon: <MenuBookIcon />,
                path: '/dashboard/accounts',
                roles: ['admin', 'super_admin']
            },
            {
                text: 'Journal Entries',
                icon: <ReceiptLongIcon />,
                path: '/dashboard/accounting',
                roles: ['admin', 'super_admin']
            },
            {
                text: 'Manual Journal Entry',
                icon: <ReceiptIcon />,
                path: '/dashboard/manual-journal-entry',
                roles: ['admin', 'super_admin']
            },
            {
                text: 'Financial Analysis',
                icon: <AnalyticsIcon />,
                path: '/dashboard/financial-reports',
                roles: ['admin', 'super_admin']
            }
        ],
        roles: ['admin', 'super_admin']
    },
    { type: 'divider' },
    
    // Settings Section
    { type: 'header', text: 'SYSTEM' },
    { 
        text: 'Settings', 
        icon: <SettingsIcon />, 
        path: '/dashboard/settings', 
        roles: ['super_admin'] 
    }
];

const DashboardLayout = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [openSubMenus, setOpenSubMenus] = useState({});
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            enqueueSnackbar('Logged out successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Logout failed', { variant: 'error' });
        }
    };

    const handleSubMenuToggle = (text) => {
        setOpenSubMenus(prev => ({
            ...prev,
            [text]: !prev[text]
        }));
    };

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const renderMenuItem = (item) => {
        if (item.type === 'divider') {
            return <Divider key={`divider-${Math.random()}`} sx={{ my: 2 }} />;
        }
        
        if (item.type === 'header') {
            return open ? (
                <Typography
                    key={`header-${item.text}`}
                    variant="caption"
                    sx={{
                        px: 3,
                        py: 1,
                        display: 'block',
                        color: 'text.secondary',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                    }}
                >
                    {item.text}
                </Typography>
            ) : null;
        }

        // Check if user has permission for this menu item
        if (!item.roles.includes(user?.role)) {
            return null;
        }

        // If item has children (submenu)
        if (item.children) {
            return (
                <Box key={item.text}>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            onClick={() => handleSubMenuToggle(item.text)}
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? 'initial' : 'center',
                                px: 2.5,
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 3 : 'auto',
                                    justifyContent: 'center',
                                    color: 'inherit',
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text} 
                                sx={{ 
                                    opacity: open ? 1 : 0,
                                    '& .MuiTypography-root': {
                                        fontWeight: 500,
                                    }
                                }}
                            />
                            {open && (openSubMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
                        </ListItemButton>
                    </ListItem>
                    <Collapse in={open && openSubMenus[item.text]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.children.map((child) => (
                                <ListItemButton
                                    key={child.text}
                                    onClick={() => navigate(child.path)}
                                    sx={{
                                        pl: 4,
                                        minHeight: 40,
                                        backgroundColor: isActiveRoute(child.path) ? 'action.selected' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 35 }}>
                                        {child.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={child.text} />
                                </ListItemButton>
                            ))}
                        </List>
                    </Collapse>
                </Box>
            );
        }

        // Regular menu item
        return (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={!open ? item.text : ''} placement="right">
                    <ListItemButton
                        onClick={() => navigate(item.path)}
                        sx={{
                            minHeight: 48,
                            justifyContent: open ? 'initial' : 'center',
                            px: 2.5,
                            backgroundColor: isActiveRoute(item.path) ? 'action.selected' : 'transparent',
                            '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.contrastText',
                                },
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: open ? 3 : 'auto',
                                justifyContent: 'center',
                                color: isActiveRoute(item.path) ? 'primary.main' : 'inherit',
                            }}
                        >
                            {item.badge ? (
                                <Badge badgeContent={item.badge} color="error">
                                    {item.icon}
                                </Badge>
                            ) : (
                                item.icon
                            )}
                        </ListItemIcon>
                        <ListItemText 
                            primary={item.text} 
                            sx={{ 
                                opacity: open ? 1 : 0,
                                '& .MuiTypography-root': {
                                    fontWeight: isActiveRoute(item.path) ? 600 : 500,
                                    color: isActiveRoute(item.path) ? 'primary.main' : 'inherit',
                                }
                            }}
                        />
                    </ListItemButton>
                </Tooltip>
            </ListItem>
        );
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar 
                position="fixed" 
                sx={{ 
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    bgcolor: 'primary.main',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="toggle drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    
                    <Typography 
                        variant="h6" 
                        noWrap 
                        component="div" 
                        sx={{ 
                            flexGrow: 1,
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                        }}
                    >
                        Rice Mill Management System
                    </Typography>
                    
                    {/* User Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                mr: 2, 
                                display: { xs: 'none', sm: 'block' },
                                fontWeight: 500
                            }}
                        >
                            {user?.full_name || user?.username}
                        </Typography>
                        <IconButton
                            size="large"
                            edge="end"
                            aria-label="account menu"
                            aria-haspopup="true"
                            onClick={handleProfileMenuOpen}
                            color="inherit"
                        >
                            <Avatar 
                                sx={{ 
                                    width: 35, 
                                    height: 35, 
                                    bgcolor: 'secondary.main',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                {user?.full_name ? getInitials(user.full_name) : user?.username?.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                open={open}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
                        transition: (theme) => theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        ...(!open && {
                            width: (theme) => theme.spacing(7),
                            overflowX: 'hidden',
                            transition: (theme) => theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.leavingScreen,
                            }),
                        }),
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ 
                    overflow: 'auto', 
                    mt: 2,
                    '&::-webkit-scrollbar': {
                        width: '5px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#888',
                        borderRadius: '5px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: '#555',
                    },
                }}>
                    <List>
                        {menuItems.map((item, index) => renderMenuItem(item))}
                    </List>
                </Box>
            </Drawer>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        minWidth: 220,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        borderRadius: 2,
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {user?.full_name || user?.username}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                        {user?.email}
                    </Typography>
                    <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>
                        Role: {user?.role?.replace('_', ' ').toUpperCase()}
                    </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => navigate('/dashboard/profile')}>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>

            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    bgcolor: '#f8f9fa', 
                    minHeight: '100vh',
                    transition: (theme) => theme.transitions.create('margin', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default DashboardLayout;