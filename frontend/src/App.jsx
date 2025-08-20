import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages and Layouts
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import UserManagement from './pages/UserManagement';
import RiceManagement from './pages/RiceManagement';
import PurchaseManagement from './pages/PurchaseManagement';
import InventoryManagement from './pages/InventoryManagement';
import LowStockPage  from './pages/LowStockPage';
import BoilingManagement from './pages/BoilingManagement';
import BoilingDetailsPage from './pages/BoilingDetailsPage';
import MillingManagement from './pages/MillingManagement';
import MillingDetailsPage from './pages/MillingDetailsPage';
import SalesManagement from './pages/SalesManagement';
import SellingCustomerDetails from './pages/SellingCustomerDetails';
import ExtraIncomePage from './pages/ExtraIncomePage';
import ExtraExpensesPage from './pages/ExtraExpensesPage';
import FinancialReportsPage from './pages/FinancialReportsPage';
import Dashboard from './pages/Dashboard';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles 
        styles={{
          'html, body, #root': {
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                {/* Nested routes for dashboard */}
                <Route path="users" element={
                  <ProtectedRoute roles={['super_admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="rice" element={
                  <ProtectedRoute roles={['admin', 'super_admin']}>
                      <RiceManagement />
                  </ProtectedRoute>
                } />
                <Route path="purchases" element={
    <ProtectedRoute roles={['admin', 'super_admin']}>
        <PurchaseManagement />
    </ProtectedRoute>
} />
<Route path="inventory" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <InventoryManagement />
  </ProtectedRoute>
} />
<Route path="lowStock" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <LowStockPage  />
  </ProtectedRoute>
} />
<Route path="boiling" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <BoilingManagement />
  </ProtectedRoute>
} />
<Route path="boiling/:id" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <BoilingDetailsPage />
  </ProtectedRoute>
} />
<Route path="milling" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <MillingManagement />
  </ProtectedRoute>
} />
<Route path="milling/:id" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <MillingDetailsPage />
  </ProtectedRoute>
} />
<Route path="sales" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <SalesManagement />
  </ProtectedRoute>
} />
<Route path="selling-customers/:id" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <SellingCustomerDetails />
  </ProtectedRoute>
} />
<Route path="extra-income" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <ExtraIncomePage />
  </ProtectedRoute>
} />
<Route path="extra-expenses" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <ExtraExpensesPage />
  </ProtectedRoute>
} />
<Route path="financial-reports" element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <FinancialReportsPage />
  </ProtectedRoute>
} />
<Route index element={
  <ProtectedRoute roles={['admin', 'super_admin']}>
    <Dashboard />
  </ProtectedRoute>
} />
                {/* Add more dashboard routes here */}
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
