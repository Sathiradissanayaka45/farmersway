import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  PointOfSale,
  ShoppingCart,
  AccountBalance,
  Refresh,
  ArrowUpward,
  ArrowDownward,
  Paid,
  PendingActions
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

// Custom Bar Chart Component using SVG
const BarChart = ({ data, width = 500, height = 300, type = 'sales' }) => {
  if (!data || data.length === 0) return null;

  const padding = { top: 40, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Colors based on type
  const color = type === 'sales' ? '#4caf50' : '#f44336';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis line */}
      <line 
        x1={padding.left} 
        y1={padding.top} 
        x2={padding.left} 
        y2={height - padding.bottom} 
        stroke="#e0e0e0" 
        strokeWidth="1"
      />
      
      {/* X-axis line */}
      <line 
        x1={padding.left} 
        y1={height - padding.bottom} 
        x2={width - padding.right} 
        y2={height - padding.bottom} 
        stroke="#e0e0e0" 
        strokeWidth="1"
      />
      
      {/* Y-axis labels */}
      {[0, maxValue/2, maxValue].map((value, i) => {
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
        return (
          <g key={i}>
            <line 
              x1={padding.left - 5} 
              y1={y} 
              x2={padding.left} 
              y2={y} 
              stroke="#e0e0e0" 
              strokeWidth="1"
            />
            <text 
              x={padding.left - 10} 
              y={y + 4} 
              textAnchor="end" 
              fontSize="10" 
              fill="#666"
            >
              {value.toLocaleString('en-LK')}
            </text>
          </g>
        );
      })}
      
      {/* Bars */}
      {data.map((d, i) => {
        const barWidth = chartWidth / data.length - 10;
        const x = padding.left + i * (chartWidth / data.length) + 5;
        const barHeight = (d.value / maxValue) * chartHeight;
        const y = height - padding.bottom - barHeight;
        
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx={2}
            />
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {d.value.toLocaleString('en-LK')}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - padding.bottom + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {d.label}
            </text>
          </g>
        );
      })}
      
      {/* Chart title */}
      <text
        x={width / 2}
        y={20}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#333"
      >
        {type === 'sales' ? 'Sales Trend' : 'Purchases Trend'}
      </text>
    </svg>
  );
};

// Custom Pie Chart Component using SVG
const PieChart = ({ data, width = 250, height = 250, title = "Inventory Distribution" }) => {
  if (!data || data.length === 0) return null;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;

  // Calculate total value
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Colors
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Generate pie segments
  let currentAngle = 0;
  const segments = data.map((item, i) => {
    const angle = (item.value / total) * 360;
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const startX = centerX + radius * Math.cos(currentAngle * Math.PI / 180);
    const startY = centerY + radius * Math.sin(currentAngle * Math.PI / 180);
    
    const endX = centerX + radius * Math.cos((currentAngle + angle) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((currentAngle + angle) * Math.PI / 180);
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');
    
    const segment = (
      <path
        key={i}
        d={pathData}
        fill={colors[i % colors.length]}
        stroke="white"
        strokeWidth="2"
      />
    );
    
    currentAngle += angle;
    return segment;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {segments}
      
      {/* Center text with total */}
      <circle cx={centerX} cy={centerY} r={radius * 0.3} fill="white" />
      <text 
        x={centerX} 
        y={centerY - 5} 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold"
      >
        {total.toLocaleString('en-LK')}
      </text>
      <text 
        x={centerX} 
        y={centerY + 10} 
        textAnchor="middle" 
        fontSize="10"
      >
        kg
      </text>
      
      {/* Chart title */}
      <text
        x={width / 2}
        y={20}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#333"
      >
        {title}
      </text>
      
      {/* Legend */}
      <g transform={`translate(${20}, ${height - 60})`}>
        {data.map((item, i) => (
          <g key={i} transform={`translate(0, ${i * 15})`}>
            <rect x="0" y="0" width="10" height="10" fill={colors[i % colors.length]} rx={2} />
            <text x="15" y="9" fontSize="10">
              {item.name}: {item.value}kg
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

// Financial Summary Card Component
const FinancialCard = ({ title, value, icon, trend, subtitle, color = 'primary' }) => {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={2} 
      sx={{ 
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].light, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          opacity: 0.05,
          fontSize: 100
        }}
      >
        {icon}
      </Box>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: 2, 
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              mr: 1.5
            }}
          >
            {React.cloneElement(icon, { 
              fontSize: 'small', 
              sx: { color: theme.palette[color].main } 
            })}
          </Box>
          <Typography color="textSecondary" variant="body2" fontWeight="medium">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" component="div" fontWeight="bold" sx={{ mt: 1 }}>
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          {trend}
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [period, setPeriod] = useState('month');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/extra/dashboard?period=${period}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Prepare data for sales chart
  const prepareSalesChartData = () => {
    if (!dashboardData?.sales_trend) return [];
    
    return dashboardData.sales_trend.map(item => ({
      label: new Date(item.date).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' }),
      value: parseFloat(item.total_sales) || 0
    }));
  };

  // Prepare data for purchases chart
  const preparePurchasesChartData = () => {
    if (!dashboardData?.purchase_trend) return [];
    
    return dashboardData.purchase_trend.map(item => ({
      label: new Date(item.date).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' }),
      value: parseFloat(item.total_purchases) || 0
    }));
  };

  // Prepare data for inventory pie chart
  const prepareInventoryData = () => {
    if (!dashboardData?.inventory) return [];
    
    return dashboardData.inventory.map(item => ({
      name: item.rice_type === 'paddy' ? 'Paddy Rice' : 'Selling Rice',
      value: parseFloat(item.total_stock) || 0
    }));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3, 
        flexWrap: 'wrap', 
        gap: 2 
      }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Rice Mill Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="day">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <IconButton 
            onClick={fetchDashboardData} 
            color="primary"
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
            }}
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={isMobile ? 1.5 : 3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialCard
            title="Total Sales"
            value={`LKR ${parseFloat(dashboardData?.financial?.total_sales || 0).toLocaleString('en-LK')}`}
            icon={<PointOfSale />}
            trend={<TrendingUp fontSize="small" color="success" />}
            subtitle="+12% from last period"
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FinancialCard
            title="Total Purchases"
            value={`LKR ${parseFloat(dashboardData?.financial?.total_purchases || 0).toLocaleString('en-LK')}`}
            icon={<ShoppingCart />}
            trend={<TrendingUp fontSize="small" color="success" />}
            subtitle="+8% from last period"
            color="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FinancialCard
            title="Net Profit"
            value={`LKR ${parseFloat(dashboardData?.financial?.net_profit || 0).toLocaleString('en-LK')}`}
            icon={<AccountBalance />}
            trend={
              dashboardData?.financial?.net_profit >= 0 ? 
                <TrendingUp fontSize="small" color="success" /> : 
                <TrendingDown fontSize="small" color="error" />
            }
            subtitle={dashboardData?.financial?.net_profit >= 0 ? "Profit" : "Loss"}
            color={dashboardData?.financial?.net_profit >= 0 ? "success" : "error"}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FinancialCard
            title="Total Inventory"
            value={`${dashboardData?.inventory?.reduce((sum, item) => sum + parseFloat(item.total_stock || 0), 0).toLocaleString('en-LK')} kg`}
            icon={<Inventory />}
            trend={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {dashboardData?.inventory?.map((item, index) => (
                  item.low_stock_count > 0 && (
                    <Chip 
                      key={index}
                      label={item.low_stock_count}
                      color="error"
                      size="small"
                      sx={{ height: 20, fontSize: '10px' }}
                    />
                  )
                ))}
              </Box>
            }
            subtitle="Low stock items"
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={isMobile ? 1.5 : 3} sx={{ mb: 4 }}>
        {/* Sales Trend */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                <BarChart 
                  data={prepareSalesChartData()} 
                  width={isMobile ? 400 : 500} 
                  height={300} 
                  type="sales" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Purchases Trend */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                <BarChart 
                  data={preparePurchasesChartData()} 
                  width={isMobile ? 400 : 500} 
                  height={300} 
                  type="purchases" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Distribution */}
        <Grid item xs={12} md={4}>
          <Card elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart 
                data={prepareInventoryData()} 
                width={300} 
                height={300} 
                title="Inventory Distribution" 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={8}>
          <Card elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Paid sx={{ mr: 1, fontSize: 20 }} /> Recent Transactions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Recent Sales
                  </Typography>
                  <TableContainer sx={{ maxHeight: 250, borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell align="right">Amount (₹)</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData?.recent_transactions?.sales?.slice(0, 4).map((sale) => (
                          <TableRow key={sale.id} hover>
                            <TableCell>
                              {new Date(sale.sale_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{sale.customer_name}</TableCell>
                            <TableCell align="right">
                              {parseFloat(sale.total_price).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell align="center">
                              {parseFloat(sale.pending_amount) > 0 ? (
                                <Chip 
                                  label="Pending" 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                  icon={<PendingActions fontSize="small" />}
                                />
                              ) : (
                                <Chip 
                                  label="Paid" 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  icon={<Paid fontSize="small" />}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="secondary" gutterBottom>
                    Recent Purchases
                  </Typography>
                  <TableContainer sx={{ maxHeight: 250, borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Supplier</TableCell>
                          <TableCell align="right">Amount (₹)</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData?.recent_transactions?.purchases?.slice(0, 4).map((purchase) => (
                          <TableRow key={purchase.id} hover>
                            <TableCell>
                              {new Date(purchase.purchase_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{purchase.customer_name}</TableCell>
                            <TableCell align="right">
                              {parseFloat(purchase.total_price).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell align="center">
                              {parseFloat(purchase.pending_amount) > 0 ? (
                                <Chip 
                                  label="Pending" 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                  icon={<PendingActions fontSize="small" />}
                                />
                              ) : (
                                <Chip 
                                  label="Paid" 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  icon={<Paid fontSize="small" />}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Section */}
      <Grid container spacing={isMobile ? 1.5 : 3}>
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ borderRadius: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Financial Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Total Sales:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ₹{parseFloat(dashboardData?.financial?.total_sales || 0).toLocaleString('en-IN')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Total Purchases:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ₹{parseFloat(dashboardData?.financial?.total_purchases || 0).toLocaleString('en-IN')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Extra Income:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ₹{parseFloat(dashboardData?.financial?.extra_income || 0).toLocaleString('en-IN')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Extra Expenses:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ₹{parseFloat(dashboardData?.financial?.extra_expenses || 0).toLocaleString('en-IN')}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="body1" fontWeight="bold">Net Profit/Loss:</Typography>
                <Typography 
                  variant="body1" 
                  fontWeight="bold"
                  color={dashboardData?.financial?.net_profit >= 0 ? 'success.main' : 'error.main'}
                >
                  ₹{parseFloat(dashboardData?.financial?.net_profit || 0).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ borderRadius: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Inventory Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {dashboardData?.inventory?.map((item, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" textTransform="capitalize">
                      {item.rice_type} Rice:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {parseFloat(item.total_stock || 0).toLocaleString('en-IN')} kg
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Varieties:</Typography>
                    <Chip 
                      label={item.variety_count} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Low Stock Items:</Typography>
                    <Chip 
                      label={item.low_stock_count} 
                      size="small" 
                      color={item.low_stock_count > 0 ? "error" : "success"} 
                      variant={item.low_stock_count > 0 ? "filled" : "outlined"}
                    />
                  </Box>
                  {index < dashboardData.inventory.length - 1 && (
                    <Box sx={{ my: 1, borderBottom: '1px dashed', borderColor: 'divider' }} />
                  )}
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;