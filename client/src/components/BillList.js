import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Box,
  TextField,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Check as CheckIcon, Edit as EditIcon } from '@mui/icons-material';
import BillForm from './BillForm';
import { useBillContext } from '../context/BillContext';

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [tabValue, setTabValue] = useState('upcoming');
  const [openForm, setOpenForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [sortField, setSortField] = useState('due_date');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { billsUpdated } = useBillContext();

  // Test backend connection
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/bills`)
      .then(res => console.log('Backend connection successful:', res.data))
      .catch(err => console.error('Backend connection failed:', err));
  }, []);

  // Fetch bills based on tab selection or updates
  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/bills?status=${tabValue}`);
      setBills(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch bills', {
        position: "bottom-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [tabValue, billsUpdated]);

  // Sort and filter bills
  const sortedBills = [...bills].sort((a, b) => {
    if (sortField === 'amount') return a.amount - b.amount;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  const filteredBills = sortedBills.filter(bill => 
    bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CRUD Operations
  const addBill = async (billData) => {
    try {
      await axios.post('http://localhost:5000/api/bills', billData);
      toast.success('Bill added successfully!', {
        position: "bottom-right",
        autoClose: 3000,
      });
      await fetchBills();
    } catch (err) {
      toast.error(`Failed to add bill: ${err.response?.data?.message || err.message}`, {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  };

  const updateBill = async (id, billData) => {
    try {
      await axios.put(`http://localhost:5000/api/bills/${id}`, billData);
      toast.success('Bill updated successfully!', {
        position: "bottom-right",
        autoClose: 3000,
      });
      await fetchBills();
    } catch (err) {
      toast.error(`Failed to update bill: ${err.response?.data?.message || err.message}`, {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  };

  const deleteBill = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/bills/${id}`);
      toast.success('Bill deleted successfully!', {
        position: "bottom-right",
        autoClose: 3000,
      });
      await fetchBills();
    } catch (err) {
      toast.error(`Failed to delete bill: ${err.response?.data?.message || err.message}`, {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  };

  const markAsPaid = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/bills/${id}/pay`);
      toast.success('Bill marked as paid!', {
        position: "bottom-right",
        autoClose: 3000,
      });
      await fetchBills();
    } catch (err) {
      toast.error(`Failed to mark bill as paid: ${err.response?.data?.message || err.message}`, {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  };

  const handleFormSubmit = async (billData) => {
    if (editingBill) {
      await updateBill(editingBill._id, billData);
    } else {
      await addBill(billData);
    }
    setOpenForm(false);
    setEditingBill(null);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Amount', 'Due Date', 'Category', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredBills.map(bill => [
        `"${bill.name}"`,
        bill.amount,
        new Date(bill.due_date).toLocaleDateString(),
        bill.category,
        bill.paid ? 'Paid' : 'Pending'
      ].join(','))
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bills_export.csv';
    link.click();
  };

  return (
    <Paper elevation={3} style={{ padding: '20px', margin: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Bill Management
      </Typography>
      
      {/* Search and Sort Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Search bills"
          variant="outlined"
          fullWidth
          sx={{ width: '60%' }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ mr: 1 }}>Sort by:</Typography>
          <Button 
            variant={sortField === 'due_date' ? 'contained' : 'outlined'} 
            onClick={() => setSortField('due_date')}
            sx={{ mr: 1 }}
          >
            Due Date
          </Button>
          <Button 
            variant={sortField === 'amount' ? 'contained' : 'outlined'} 
            onClick={() => setSortField('amount')}
            sx={{ mr: 1 }}
          >
            Amount
          </Button>
          <Button 
            variant="outlined" 
            onClick={exportToCSV}
          >
            Export CSV
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Upcoming" value="upcoming" />
          <Tab label="Overdue" value="overdue" />
          <Tab label="Paid" value="paid" />
        </Tabs>
      </Box>
      
      <Button 
        variant="contained" 
        startIcon={<AddIcon />} 
        onClick={() => setOpenForm(true)}
        style={{ margin: '20px 0' }}
      >
        Add Bill
      </Button>

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {filteredBills.length === 0 ? (
            <ListItem>
              <ListItemText primary="No bills found" />
            </ListItem>
          ) : (
            filteredBills.map((bill) => (
              <ListItem key={bill._id} divider>
                <ListItemText
                  primary={bill.name}
                  secondary={`Amount: $${bill.amount} | Due: ${new Date(bill.due_date).toLocaleDateString()} | ${bill.category}`}
                />
                {tabValue !== 'paid' && (
                  <Button 
                    variant="outlined" 
                    startIcon={<CheckIcon />} 
                    onClick={() => markAsPaid(bill._id)}
                    style={{ marginRight: '10px' }}
                  >
                    Mark Paid
                  </Button>
                )}
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />} 
                  onClick={() => {
                    setEditingBill(bill);
                    setOpenForm(true);
                  }}
                  style={{ marginRight: '10px' }}
                >
                  Edit
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />} 
                  onClick={() => deleteBill(bill._id)}
                >
                  Delete
                </Button>
              </ListItem>
            ))
          )}
        </List>
      )}
      
      <BillForm 
        open={openForm} 
        onClose={() => {
          setOpenForm(false);
          setEditingBill(null);
        }} 
        onSubmit={handleFormSubmit}
        initialData={editingBill}
      />
    </Paper>
  );
};

export default BillList;