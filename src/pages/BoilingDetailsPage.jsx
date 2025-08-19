import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const BoilingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [boilingRecord, setBoilingRecord] = useState(null);
  const [completionRecord, setCompletionRecord] = useState(null);
  const [missingQuantities, setMissingQuantities] = useState([]);

useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [recordRes] = await Promise.all([
          api.get(`/boiling/${id}`)
        ]);

        setBoilingRecord(recordRes.data.data);
        
        // Get completions separately
        const completionsRes = await api.get(`/boiling/${id}/completions`);
        
        if (completionsRes.data.data.length > 0) {
          setCompletionRecord(completionsRes.data.data[0]);
          
          // Get missing quantities if completion exists
          const missingRes = await api.get(
            `/boiling/${id}/missing-quantities?completion_id=${completionsRes.data.data[0].id}`
          );
          setMissingQuantities(missingRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching boiling details:', error);
        enqueueSnackbar('Failed to fetch boiling details', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
}, [id, api, enqueueSnackbar]);

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/dashboard/boiling')}
        sx={{ mb: 2 }}
      >
        Back to Boiling Records
      </Button>

      {loading && <LinearProgress />}

      {!loading && !boilingRecord && (
        <Alert severity="error">Boiling record not found</Alert>
      )}

      {boilingRecord && (
        <>
          <Typography variant="h4" gutterBottom>
            Boiling Record Details
          </Typography>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Rice Variety
                </Typography>
                <Typography variant="body1">
                  {boilingRecord.rice_variety_name || 'Unknown'}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Quantity Sent
                </Typography>
                <Typography variant="body1">
                  {boilingRecord.quantity_kg} kg
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  <Chip 
                    label={boilingRecord.status} 
                    color={
                      boilingRecord.status === 'completed' ? 'success' : 
                      boilingRecord.status === 'pending' ? 'warning' : 'error'
                    } 
                    size="small" 
                  />
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Recorded By
                </Typography>
                <Typography variant="body1">
                  {boilingRecord.created_by_name}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Boiling Date
                </Typography>
                <Typography variant="body1">
                  {new Date(boilingRecord.boiling_date).toLocaleString()}
                </Typography>
              </div>
            </Box>
          </Paper>

          {completionRecord && (
            <>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Completion Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Returned Quantity
                    </Typography>
                    <Typography variant="body1">
                      {completionRecord.returned_quantity_kg} kg
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Missing Quantity
                    </Typography>
                    <Typography variant="body1">
                      {completionRecord.missing_quantity_kg} kg
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Completed By
                    </Typography>
                    <Typography variant="body1">
                      {completionRecord.completed_by_name}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Completion Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(completionRecord.completion_date).toLocaleString()}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {completionRecord.notes || 'N/A'}
                    </Typography>

                    
                  </div>
                  <div>
                                                          <Typography variant="body2" color="textSecondary">
                      Cost
                    </Typography>
                                        <Typography variant="body1">
                      {completionRecord.cost_amount || 'N/A'}
                    </Typography>
                  </div>
                </Box>
              </Paper>

              {missingQuantities.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Missing Quantity Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Quantity (kg)</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {missingQuantities.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.quantity_kg}</TableCell>
                            <TableCell>
                              {item.reason.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell>{item.description || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default BoilingDetailsPage;