import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SystemLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuth();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure logs is always an array
      const logsData = Array.isArray(response.data) ? response.data : [];
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Set empty array on error to avoid .filter errors
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Make sure logs is an array before filtering
  const filteredLogs = Array.isArray(logs) ? logs.filter(log =>
    (log.message?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.level?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.timestamp?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Logs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLogs}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>User</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((log, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(log.timestamp || '').toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color:
                          log.level === 'error'
                            ? 'error.main'
                            : log.level === 'warning'
                            ? 'warning.main'
                            : 'success.main',
                      }}
                    >
                      {(log.level || '').toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>{log.message || ''}</TableCell>
                  <TableCell>{log.user || 'System'}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default SystemLogsPage; 