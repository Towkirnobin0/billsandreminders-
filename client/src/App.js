import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BillProvider } from './context/BillContext';
import ErrorBoundary from './components/ErrorBoundary';
import BillList from './components/BillList';
import Reminders from './components/Reminders';

function App() {
  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.on('bill-updated', (updatedBill) => {
      toast.info(`Bill updated: ${updatedBill.name}`, {
        position: "bottom-right",
        autoClose: 3000,
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      toast.error('Realtime updates disconnected', {
        position: "bottom-right",
        autoClose: 5000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BillProvider>
      <Router>
        <ErrorBoundary>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Bills & Reminders
              </Typography>
              <Button color="inherit" component={Link} to="/">Bills</Button>
              <Button color="inherit" component={Link} to="/reminders">Reminders</Button>
            </Toolbar>
          </AppBar>

          <Container maxWidth="md" style={{ marginTop: '20px' }}>
            <Routes>
              <Route path="/" element={<BillList />} />
              <Route path="/reminders" element={<Reminders />} />
            </Routes>
          </Container>
        </ErrorBoundary>

        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Router>
    </BillProvider>
  );
}

export default App;