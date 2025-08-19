import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Divider,
  Chip
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const MillingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [millingRecord, setMillingRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMillingDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/milling/${id}`);
        setMillingRecord(response.data.data);
      } catch (error) {
        console.error('Error fetching milling details:', error);
        enqueueSnackbar('Failed to fetch milling details', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchMillingDetails();
  }, [id, api, enqueueSnackbar]);

  if (loading) {
    return <LinearProgress />;
  }

  if (!millingRecord) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Milling record not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/dashboard/milling')}
        sx={{ mb: 2 }}
      >
        Back to Milling
      </Button>

      <Typography variant="h4" gutterBottom>
        Milling Record Details
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            ID: {millingRecord.id}
          </Typography>
          <Chip 
            label={millingRecord.status} 
            color={
              millingRecord.status === 'completed' ? 'success' : 
              millingRecord.status === 'pending' ? 'warning' : 'error'
            } 
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Box>
            <Typography variant="subtitle1">Input Rice Variety</Typography>
            <Typography>{millingRecord.rice_variety_name}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">Quantity Sent</Typography>
            <Typography>{millingRecord.quantity_kg} kg</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">Milling Date</Typography>
            <Typography>
              {new Date(millingRecord.milling_date).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">Recorded By</Typography>
            <Typography>{millingRecord.created_by_name}</Typography>
          </Box>
        </Box>

        {millingRecord.completions.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Completion Details
            </Typography>
            
            {millingRecord.completions.map((completion, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1">Output Rice Variety</Typography>
                    <Typography>{completion.output_rice_variety_name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">Returned Quantity</Typography>
                    <Typography>{completion.returned_quantity_kg} kg</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">Completion Date</Typography>
                    <Typography>
                      {new Date(completion.completion_date).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">Completed By</Typography>
                    <Typography>{completion.completed_by_name}</Typography>
                  </Box>
                </Box>
                
                {completion.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">Notes</Typography>
                    <Typography>{completion.notes}</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default MillingDetailsPage;