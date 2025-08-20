import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Tabs,
  Tab,
  Chip,
  Stack
} from '@mui/material';
import {
  AttachMoney as IncomeIcon,
  Receipt as ExpenseIcon,
  Assessment as ReportIcon,
  DateRange as DateRangeIcon,
  TrendingUp as ProfitIcon,
  TrendingDown as LossIcon,
  Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon,
  People as CustomersIcon,
  AttachMoney as OperationsIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  PictureAsPdf as PdfIcon,
  TrendingUp as TrendingUp,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const FinancialReportsPage = () => {
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState({
    date_range: {
      start_date: '',
      end_date: ''
    },
    summary: {
      total_revenue: 0,
      total_cost: 0,
      gross_profit: 0,
      profit_margin: '0%'
    },
    sales: {
      total_sales: 0,
      total_paid: 0,
      total_pending: 0,
      total_transactions: 0,
      by_variety: []
    },
    purchases: {
      total_purchases: 0,
      total_paid: 0,
      total_pending: 0,
      total_transactions: 0,
      by_variety: []
    },
    milling: {
      total_input_kg: 0,
      total_output_kg: 0,
      milling_loss_kg: 0,
      milling_yield: '0%'
    },
    boiling: {
      total_input_kg: 0,
      total_output_kg: 0,
      boiling_loss_kg: 0,
      total_cost: 0,
      boiling_yield: '0%'
    },
    extra_transactions: {
      total_income: 0,
      total_expenses: 0,
      total_income_count: 0,
      total_expenses_count: 0,
      net_extra: 0
    },
    inventory_changes: []
  });

  // Set default date range to current day
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start_date: today,
    end_date: today
  });

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: dateRange.start_date.toISOString().split('T')[0],
        end_date: dateRange.end_date.toISOString().split('T')[0]
      }).toString();

      const response = await api.get(`/extra/financial-report?${params}`);
      setReportData(response.data.data || {
        // Default empty structure if no data
        ...reportData,
        date_range: {
          start_date: dateRange.start_date.toISOString().split('T')[0],
          end_date: dateRange.end_date.toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Error fetching financial report:', error);
      enqueueSnackbar('Failed to fetch financial report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleDateChange = (name, date) => {
    setDateRange(prev => ({ ...prev, [name]: date }));
  };

  const handleGenerateReport = () => {
    fetchReportData();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-LK').format(num);
  };

  // Function to generate PDF report
  const generatePDF = async () => {
    try {
      setLoading(true);
      enqueueSnackbar('Generating PDF report...', { variant: 'info' });
      
      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;
      
      // Add company header
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('RICE MILL ENTERPRISE', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text('Jaffna Road, Puiyankulama', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text('Mobile: 703002260', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Add report title and date range
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('FINANCIAL REPORT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      const dateRangeText = `Date Range: ${dateRange.start_date.toLocaleDateString()} to ${dateRange.end_date.toLocaleDateString()}`;
      pdf.text(dateRangeText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Add summary section
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('FINANCIAL SUMMARY', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Total Revenue: ${formatCurrency(reportData.summary.total_revenue)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Total Cost: ${formatCurrency(reportData.summary.total_cost)}`, margin, yPosition);
      yPosition += 6;
      
      const profitColor = reportData.summary.gross_profit >= 0 ? [0, 128, 0] : [255, 0, 0];
      pdf.setTextColor(...profitColor);
      pdf.text(`Gross Profit: ${formatCurrency(Math.abs(reportData.summary.gross_profit))} ${reportData.summary.gross_profit < 0 ? '(Loss)' : ''}`, margin, yPosition);
      yPosition += 6;
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Profit Margin: ${reportData.summary.profit_margin}`, margin, yPosition);
      yPosition += 10;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Add sales summary
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('SALES SUMMARY', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Total Sales: ${formatCurrency(reportData.sales.total_sales)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Paid Amount: ${formatCurrency(reportData.sales.total_paid)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Pending Amount: ${formatCurrency(reportData.sales.total_pending)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Transactions: ${reportData.sales.total_transactions}`, margin, yPosition);
      yPosition += 10;
      
      // Add sales by variety table if data exists
      if (reportData.sales.by_variety.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Sales by Rice Variety:', margin, yPosition);
        yPosition += 8;
        
        // Table headers
        pdf.setFillColor(200, 200, 200);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text('Variety', margin + 2, yPosition + 5);
        pdf.text('Quantity (kg)', margin + 50, yPosition + 5);
        pdf.text('Amount', margin + 90, yPosition + 5);
        pdf.text('Avg. Price/kg', pageWidth - margin - 40, yPosition + 5);
        yPosition += 8;
        
        // Table rows
        pdf.setFont(undefined, 'normal');
        reportData.sales.by_variety.forEach(item => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(item.rice_variety || 'N/A', margin + 2, yPosition + 5);
          pdf.text(formatNumber(item.total_kg_sold), margin + 50, yPosition + 5);
          pdf.text(formatCurrency(item.total_sales_amount), margin + 90, yPosition + 5);
          pdf.text(formatCurrency(item.avg_price_per_kg), pageWidth - margin - 40, yPosition + 5);
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Add purchases summary
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('PURCHASES SUMMARY', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Total Purchases: ${formatCurrency(reportData.purchases.total_purchases)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Paid Amount: ${formatCurrency(reportData.purchases.total_paid)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Pending Amount: ${formatCurrency(reportData.purchases.total_pending)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Transactions: ${reportData.purchases.total_transactions}`, margin, yPosition);
      yPosition += 10;
      
      // Add purchases by variety table if data exists
      if (reportData.purchases.by_variety.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Purchases by Rice Variety:', margin, yPosition);
        yPosition += 8;
        
        // Table headers
        pdf.setFillColor(200, 200, 200);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text('Variety', margin + 2, yPosition + 5);
        pdf.text('Quantity (kg)', margin + 50, yPosition + 5);
        pdf.text('Amount', margin + 90, yPosition + 5);
        pdf.text('Avg. Price/kg', pageWidth - margin - 40, yPosition + 5);
        yPosition += 8;
        
        // Table rows
        pdf.setFont(undefined, 'normal');
        reportData.purchases.by_variety.forEach(item => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(item.rice_variety || 'N/A', margin + 2, yPosition + 5);
          pdf.text(formatNumber(item.total_kg_purchased), margin + 50, yPosition + 5);
          pdf.text(formatCurrency(item.total_purchase_amount), margin + 90, yPosition + 5);
          pdf.text(formatCurrency(item.avg_price_per_kg), pageWidth - margin - 40, yPosition + 5);
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Add operations data
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('OPERATIONS SUMMARY', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Milling Input: ${formatNumber(reportData.milling.total_input_kg)} kg`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Milling Output: ${formatNumber(reportData.milling.total_output_kg)} kg`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Milling Loss: ${formatNumber(reportData.milling.milling_loss_kg)} kg`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Milling Yield: ${reportData.milling.milling_yield}`, margin, yPosition);
      yPosition += 8;
      
      pdf.text(`Boiling Input: ${formatNumber(reportData.boiling.total_input_kg)} kg`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Boiling Output: ${formatNumber(reportData.boiling.total_output_kg)} kg`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Boiling Loss: ${formatNumber(reportData.boiling.boiling_loss_kg)} kg`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Boiling Cost: ${formatCurrency(reportData.boiling.total_cost)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Boiling Yield: ${reportData.boiling.boiling_yield}`, margin, yPosition);
      yPosition += 10;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Add extra transactions
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('EXTRA TRANSACTIONS', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Total Income: ${formatCurrency(reportData.extra_transactions.total_income)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Total Expenses: ${formatCurrency(reportData.extra_transactions.total_expenses)}`, margin, yPosition);
      yPosition += 6;
      
      const netExtraColor = reportData.extra_transactions.net_extra >= 0 ? [0, 128, 0] : [255, 0, 0];
      pdf.setTextColor(...netExtraColor);
      pdf.text(`Net Extra: ${formatCurrency(Math.abs(reportData.extra_transactions.net_extra))} ${reportData.extra_transactions.net_extra < 0 ? '(Net Loss)' : '(Net Gain)'}`, margin, yPosition);
      yPosition += 6;
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Income Transactions: ${reportData.extra_transactions.total_income_count}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Expense Transactions: ${reportData.extra_transactions.total_expenses_count}`, margin, yPosition);
      yPosition += 10;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Add inventory changes if available
      if (reportData.inventory_changes && reportData.inventory_changes.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('INVENTORY CHANGES', margin, yPosition);
        yPosition += 8;
        
        // Table headers
        pdf.setFillColor(200, 200, 200);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text('Variety', margin + 2, yPosition + 5);
        pdf.text('Increase (kg)', margin + 50, yPosition + 5);
        pdf.text('Decrease (kg)', margin + 80, yPosition + 5);
        pdf.text('Current Stock', margin + 110, yPosition + 5);
        pdf.text('Net Change', pageWidth - margin - 30, yPosition + 5);
        yPosition += 8;
        
        // Table rows
        pdf.setFont(undefined, 'normal');
        reportData.inventory_changes.forEach(item => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          
          const netChange = item.total_increase_kg - item.total_decrease_kg;
          
          pdf.text(item.rice_variety || 'N/A', margin + 2, yPosition + 5);
          pdf.text(formatNumber(item.total_increase_kg), margin + 50, yPosition + 5);
          pdf.text(formatNumber(item.total_decrease_kg), margin + 80, yPosition + 5);
          pdf.text(formatNumber(item.current_stock), margin + 110, yPosition + 5);
          
          // Color code net change
          if (netChange >= 0) {
            pdf.setTextColor(0, 128, 0);
          } else {
            pdf.setTextColor(255, 0, 0);
          }
          pdf.text(formatNumber(netChange), pageWidth - margin - 30, yPosition + 5);
          pdf.setTextColor(0, 0, 0);
          
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      // Add report generation date and signature area
      const currentDate = new Date().toLocaleDateString();
      
      // Check if we need a new page for signature
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Report Generated On: ${currentDate}`, margin, yPosition);
      yPosition += 15;
      
      pdf.text('_________________________', margin, yPosition);
      yPosition += 5;
      pdf.text('Authorized Signature', margin, yPosition);
      
      // Save the PDF
      const fileName = `Financial_Report_${dateRange.start_date.toISOString().split('T')[0]}_to_${dateRange.end_date.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      enqueueSnackbar('PDF report generated successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      enqueueSnackbar('Failed to generate PDF report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Financial Reports
        </Typography>

        {/* Date Range Selector */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <DatePicker
              label="Start Date"
              value={dateRange.start_date}
              onChange={(date) => handleDateChange('start_date', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            <DatePicker
              label="End Date"
              value={dateRange.end_date}
              onChange={(date) => handleDateChange('end_date', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            <Button
              variant="contained"
              startIcon={<ReportIcon />}
              onClick={handleGenerateReport}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              Generate Report
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PdfIcon />}
              onClick={generatePDF}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              Download PDF Report
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Showing data from {dateRange.start_date.toLocaleDateString()} to {dateRange.end_date.toLocaleDateString()}
          </Typography>
        </Paper>

        {loading && <LinearProgress />}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <IncomeIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Revenue</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(reportData.summary.total_revenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reportData.sales.total_transactions} sales transactions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ExpenseIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Cost</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {formatCurrency(reportData.summary.total_cost)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reportData.purchases.total_transactions} purchase transactions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {reportData.summary.gross_profit >= 0 ? (
                    <ProfitIcon color="success" sx={{ mr: 1 }} />
                  ) : (
                    <LossIcon color="error" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="h6">Gross Profit</Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  color={reportData.summary.gross_profit >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(Math.abs(reportData.summary.gross_profit))}
                  {reportData.summary.gross_profit < 0 && ' (Loss)'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Margin: {reportData.summary.profit_margin}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for Detailed Sections */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Sales & Purchases" icon={<ShoppingCartIcon />} />
          <Tab label="Operations" icon={<OperationsIcon />} />
          <Tab label="Extra Transactions" icon={<ReceiptIcon />} />
          <Tab label="Inventory" icon={<InventoryIcon />} />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ mt: 2 }}>
          {/* Sales & Purchases Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Sales Details */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Sales Summary</Typography>
                  </Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Sales</Typography>
                      <Typography variant="h6">{formatCurrency(reportData.sales.total_sales)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(reportData.sales.total_paid)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Pending Amount</Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(reportData.sales.total_pending)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Transactions</Typography>
                      <Typography variant="h6">{reportData.sales.total_transactions}</Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Sales by Rice Variety
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Variety</TableCell>
                          <TableCell align="right">Quantity (kg)</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Avg. Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.sales.by_variety.map((item) => (
                          <TableRow key={item.rice_variety}>
                            <TableCell>{item.rice_variety}</TableCell>
                            <TableCell align="right">{formatNumber(item.total_kg_sold)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.total_sales_amount)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.avg_price_per_kg)}/kg</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Purchases Details */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShoppingCartIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Purchases Summary</Typography>
                  </Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Purchases</Typography>
                      <Typography variant="h6">{formatCurrency(reportData.purchases.total_purchases)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(reportData.purchases.total_paid)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Pending Amount</Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(reportData.purchases.total_pending)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Transactions</Typography>
                      <Typography variant="h6">{reportData.purchases.total_transactions}</Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Purchases by Rice Variety
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Variety</TableCell>
                          <TableCell align="right">Quantity (kg)</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Avg. Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.purchases.by_variety.map((item) => (
                          <TableRow key={item.rice_variety}>
                            <TableCell>{item.rice_variety}</TableCell>
                            <TableCell align="right">{formatNumber(item.total_kg_purchased)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.total_purchase_amount)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.avg_price_per_kg)}/kg</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Operations Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              {/* Milling Operations */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocalShippingIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Milling Operations</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Input Quantity</Typography>
                      <Typography variant="h6">
                        {formatNumber(reportData.milling.total_input_kg)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Output Quantity</Typography>
                      <Typography variant="h6">
                        {formatNumber(reportData.milling.total_output_kg)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Milling Loss</Typography>
                      <Typography variant="h6" color="error.main">
                        {formatNumber(reportData.milling.milling_loss_kg)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Yield</Typography>
                      <Typography variant="h6">
                        {reportData.milling.milling_yield}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Boiling Operations */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocalShippingIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Boiling Operations</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Input Quantity</Typography>
                      <Typography variant="h6">
                        {formatNumber(reportData.boiling.total_input_kg)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Output Quantity</Typography>
                      <Typography variant="h6">
                        {formatNumber(reportData.boiling.total_output_kg)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Boiling Loss</Typography>
                      <Typography variant="h6" color="error.main">
                        {formatNumber(reportData.boiling.boiling_loss_kg)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Boiling Cost</Typography>
                      <Typography variant="h6">
                        {formatCurrency(reportData.boiling.total_cost)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Yield</Typography>
                      <Typography variant="h6">
                        {reportData.boiling.boiling_yield}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Extra Transactions Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IncomeIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Extra Income</Typography>
                  </Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Income</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(reportData.extra_transactions.total_income)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Transactions</Typography>
                      <Typography variant="h6">
                        {reportData.extra_transactions.total_income_count}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Income by Type
                  </Typography>
                  {reportData.income_by_type?.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Income Type</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.income_by_type.map((item) => (
                            <TableRow key={item.type_name}>
                              <TableCell>{item.type_name}</TableCell>
                              <TableCell align="right">{formatCurrency(item.total_amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No income data available
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ExpenseIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6">Extra Expenses</Typography>
                  </Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                                            <Typography variant="h6" color="error.main">
                        {formatCurrency(reportData.extra_transactions.total_expenses)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Transactions</Typography>
                      <Typography variant="h6">
                        {reportData.extra_transactions.total_expenses_count}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Expenses by Type
                  </Typography>
                  {reportData.expenses_by_type?.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Expense Type</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.expenses_by_type.map((item) => (
                            <TableRow key={item.type_name}>
                              <TableCell>{item.type_name}</TableCell>
                              <TableCell align="right">{formatCurrency(item.total_amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No expense data available
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Net Extra Summary */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {reportData.extra_transactions.net_extra >= 0 ? (
                      <ProfitIcon color="success" sx={{ mr: 1 }} />
                    ) : (
                      <LossIcon color="error" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h6">Net Extra Transactions</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Total Income</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(reportData.extra_transactions.total_income)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(reportData.extra_transactions.total_expenses)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Net Amount</Typography>
                      <Typography 
                        variant="h6" 
                        color={reportData.extra_transactions.net_extra >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(Math.abs(reportData.extra_transactions.net_extra))}
                        {reportData.extra_transactions.net_extra < 0 && ' (Net Loss)'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Inventory Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InventoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Inventory Changes</Typography>
                  </Box>
                  
                  {reportData.inventory_changes && reportData.inventory_changes.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Rice Variety</TableCell>
                            <TableCell align="right">Increase (kg)</TableCell>
                            <TableCell align="right">Decrease (kg)</TableCell>
                            <TableCell align="right">Current Stock</TableCell>
                            <TableCell align="right">Net Change</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.inventory_changes.map((item) => {
                            const netChange = item.total_increase_kg - item.total_decrease_kg;
                            return (
                              <TableRow key={item.rice_variety}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Chip 
                                      label={item.rice_variety || 'N/A'} 
                                      size="small" 
                                      color={netChange >= 0 ? 'success' : 'error'}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography color="success.main">
                                    {formatNumber(item.total_increase_kg)} kg
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography color="error.main">
                                    {formatNumber(item.total_decrease_kg)} kg
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body1" fontWeight="bold">
                                    {formatNumber(item.current_stock)} kg
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography 
                                    color={netChange >= 0 ? 'success.main' : 'error.main'}
                                    fontWeight="bold"
                                  >
                                    {netChange >= 0 ? '+' : ''}{formatNumber(netChange)} kg
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No inventory changes recorded for this period
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Inventory Summary */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Inventory Summary</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Increase</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatNumber(reportData.inventory_changes?.reduce((sum, item) => sum + item.total_increase_kg, 0) || 0)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Decrease</Typography>
                      <Typography variant="h6" color="error.main">
                        {formatNumber(reportData.inventory_changes?.reduce((sum, item) => sum + item.total_decrease_kg, 0) || 0)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Net Change</Typography>
                      <Typography variant="h6">
                        {formatNumber(
                          (reportData.inventory_changes?.reduce((sum, item) => sum + item.total_increase_kg, 0) || 0) -
                          (reportData.inventory_changes?.reduce((sum, item) => sum + item.total_decrease_kg, 0) || 0)
                        )} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Varieties</Typography>
                      <Typography variant="h6">
                        {reportData.inventory_changes?.length || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Stock Status */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InventoryIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Current Stock Status</Typography>
                  </Box>
                  <Stack spacing={1}>
                    {reportData.inventory_changes?.map((item) => (
                      <Box key={item.rice_variety} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{item.rice_variety}</Typography>
                        <Chip 
                          label={`${formatNumber(item.current_stock)} kg`}
                          size="small"
                          color={item.current_stock > 0 ? 'success' : 'error'}
                          variant={item.current_stock > 0 ? 'filled' : 'outlined'}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default FinancialReportsPage;