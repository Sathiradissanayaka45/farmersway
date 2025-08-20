// src/components/TypeManagementDialog.js
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  LinearProgress
} from '@mui/material';
import { useSnackbar } from 'notistack';

const TypeManagementDialog = ({
  open,
  onClose,
  title,
  typeName,
  setTypeName,
  typeDescription,
  setTypeDescription,
  onSubmit,
  loading
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async () => {
    if (!typeName.trim()) {
      enqueueSnackbar('Type name is required', { variant: 'error' });
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {loading && <LinearProgress />}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            sx={{ mb: 2 }}
            label="Type Name"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            required
          />
          <TextField
            fullWidth
            sx={{ mb: 2 }}
            label="Description"
            value={typeDescription}
            onChange={(e) => setTypeDescription(e.target.value)}
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TypeManagementDialog;