import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Checkbox, 
  FormControlLabel,
  MenuItem,
  Box
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [bills, setBills] = useState([]);
  const [email, setEmail] = useState('');
  const [daysBefore, setDaysBefore] = useState(3);
  const [sendEmail, setSendEmail] = useState(false);
  const [selectedBill, setSelectedBill] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReminders();
    fetchUpcomingBills();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reminders');
      setReminders(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch reminders', {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  };

  const fetchUpcomingBills = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/bills?status=upcoming');
      setBills(res.data);
      if (res.data.length > 0) {
        setSelectedBill(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch upcoming bills', {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  };

  const handleCreateReminder = async () => {
    if (!selectedBill) {
      toast.warning('Please select a bill', {
        position: "bottom-right",
        autoClose: 5000,
      });
      return;
    }

    if (sendEmail && !email) {
      toast.warning('Please enter an email address', {
        position: "bottom-right",
        autoClose: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/reminders', {
        bill_id: selectedBill,
        days_before: daysBefore,
        email: sendEmail ? email : '',
        send_email: sendEmail
      });
      toast.success('Reminder created successfully!', {
        position: "bottom-right",
        autoClose: 3000,
      });
      await fetchReminders();
      setEmail('');
      setDaysBefore(3);
      setSendEmail(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to create reminder: ${err.response?.data?.message || err.message}`, {
        position: "bottom-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/reminders/${id}`);
      toast.success('Reminder deleted successfully!', {
        position: "bottom-right",
        autoClose: 3000,
      });
      await fetchReminders();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete reminder: ${err.response?.data?.message || err.message}`, {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <Paper elevation={3} style={{ padding: '20px', margin: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Reminders
      </Typography>
      
      <Box sx={{ marginBottom: '20px' }}>
        <TextField
          select
          label="Select Bill"
          value={selectedBill}
          onChange={(e) => setSelectedBill(e.target.value)}
          fullWidth
          margin="normal"
          required
        >
          {bills.map((bill) => (
            <MenuItem key={bill._id} value={bill._id}>
              {bill.name} (Due: {new Date(bill.due_date).toLocaleDateString()})
            </MenuItem>
          ))}
        </TextField>
        
        <TextField
          label="Days Before Due Date"
          type="number"
          value={daysBefore}
          onChange={(e) => setDaysBefore(Number(e.target.value))}
          fullWidth
          margin="normal"
          inputProps={{ min: 1, max: 30 }}
        />
        
        <TextField
          label="Email for Notification"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          disabled={!sendEmail}
          required={sendEmail}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              color="primary"
            />
          }
          label="Send Email Notification"
        />
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateReminder}
          style={{ marginTop: '10px' }}
          disabled={isLoading || !selectedBill || (sendEmail && !email)}
        >
          {isLoading ? 'Creating...' : 'Create Reminder'}
        </Button>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        Your Reminders
      </Typography>
      
      <List>
        {reminders.length === 0 ? (
          <ListItem>
            <ListItemText primary="No reminders set" />
          </ListItem>
        ) : (
          reminders.map((reminder) => {
            const bill = bills.find(b => b._id === reminder.bill_id);
            return (
              <ListItem key={reminder._id} divider>
                <ListItemText
                  primary={`Reminder for ${bill?.name || 'Bill'}`}
                  secondary={
                    `${reminder.days_before} days before due date | ` +
                    `${reminder.send_email ? `Email: ${reminder.email}` : 'No email notification'} | ` +
                    `Due: ${bill ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}`
                  }
                />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteReminder(reminder._id)}
                >
                  Delete
                </Button>
              </ListItem>
            );
          })
        )}
      </List>
    </Paper>
  );
};

export default Reminders;