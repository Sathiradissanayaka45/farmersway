import { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
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
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    People as PeopleIcon,
    Inventory as InventoryIcon,
    ShoppingCart as ShoppingCartIcon,
    LocalShipping as LocalShippingIcon,
    Settings as SettingsIcon,
    AccountCircle as AccountCircleIcon,
      AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const drawerWidth = 240;

// Update the menuItems array in DashboardLayout.js
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'super_admin'] },
  { text: 'User Management', icon: <PeopleIcon />, path: '/dashboard/users', roles: ['super_admin'] },
  { text: 'Rice Varieties', icon: <InventoryIcon />, path: '/dashboard/rice', roles: ['admin', 'super_admin'] },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/dashboard/inventory', roles: ['admin', 'super_admin'] },
  { text: 'Low Stock', icon: <InventoryIcon />, path: '/dashboard/lowStock', roles: ['admin', 'super_admin'] },
  { text: 'Purchases', icon: <ShoppingCartIcon />, path: '/dashboard/purchases', roles: ['admin', 'super_admin'] },
  { text: 'Boiling', icon: <LocalShippingIcon />, path: '/dashboard/boiling', roles: ['admin', 'super_admin'] },
  { text: 'Milling', icon: <LocalShippingIcon />, path: '/dashboard/milling', roles: ['admin', 'super_admin'] },
  { text: 'Sales', icon: <ShoppingCartIcon />, path: '/dashboard/sales', roles: ['admin', 'super_admin'] },
  { text: 'Selling Customers', icon: <PeopleIcon />, path: '/dashboard/selling-customers', roles: ['admin', 'super_admin'] },
  // Add these new menu items
  { text: 'Extra Income', icon: <AttachMoneyIcon />, path: '/dashboard/extra-income', roles: ['admin', 'super_admin'] },
  { text: 'Extra Expenses', icon: <ReceiptIcon />, path: '/dashboard/extra-expenses', roles: ['admin', 'super_admin'] },
  { text: 'Financial Reports', icon: <AssessmentIcon />, path: '/dashboard/financial-reports', roles: ['admin', 'super_admin'] },
  { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings', roles: ['super_admin'] },
];

const DashboardLayout = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
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

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Rice Mill Management System
                    </Typography>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="account of current user"
                        aria-haspopup="true"
                        onClick={handleProfileMenuOpen}
                        color="inherit"
                    >
                        <AccountCircleIcon />
                    </IconButton>
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
                        ...(open ? {} : {
                            width: theme => theme.spacing(7),
                            overflowX: 'hidden'
                        })
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems
                            .filter(item => item.roles.includes(user?.role))
                            .map((item) => (
                                <ListItem key={item.text} disablePadding>
                                    <ListItemButton
                                        onClick={() => navigate(item.path)}
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
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={item.text} 
                                            sx={{ opacity: open ? 1 : 0 }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                    </List>
                </Box>
            </Drawer>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
            >
                <MenuItem onClick={() => navigate('/dashboard/profile')}>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>

            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default DashboardLayout;
