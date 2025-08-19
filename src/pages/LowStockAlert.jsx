import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const LowStockAlert = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const checkLowStock = async () => {
      try {
        const response = await api.get('/inventory/low-stock');
        if (response.data.data?.length > 0) {
          response.data.data.forEach(item => {
            enqueueSnackbar(
              `${item.name} is below minimum stock level (${item.current_stock_kg}/${item.min_stock_level}kg)`, 
              { 
                variant: 'warning',
                persist: true,
                preventDuplicate: true,
                action: (key) => (
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => {
                      // Navigate to inventory page or show dialog
                      window.location.href = '/dashboard/inventory';
                    }}
                  >
                    View
                  </Button>
                )
              }
            );
          });
        }
      } catch (error) {
        console.error('Error checking low stock:', error);
      }
    };

    checkLowStock();
    const interval = setInterval(checkLowStock, 3600000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default LowStockAlert;