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
  Alert,
  CircularProgress
} from '@mui/material';
import { Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SystemLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const { token, currentUser } = useAuth();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching system logs...');
      
      const response = await adminService.getSystemLogs();
      console.log('Logs response:', response);
      
      // Ensure logs is always an array
      let logsData = [];
      
      if (response.data?.logs && Array.isArray(response.data.logs)) {
        logsData = response.data.logs;
      } else if (Array.isArray(response.data)) {
        logsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract logs from various possible response formats
        const possibleLogsArrays = ['logs', 'data', 'items', 'records', 'results'];
        
        for (const key of possibleLogsArrays) {
          if (Array.isArray(response.data[key])) {
            logsData = response.data[key];
            break;
          }
        }
      }
      
      console.log(`Processed ${logsData.length} logs`);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError(`Failed to fetch logs: ${error.message}`);
      // Set empty array on error to avoid .filter errors
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchLogs();
    } else {
      setError('You must be an admin to view system logs');
      setLoading(false);
    }
  }, [currentUser]);

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
    (log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.resourceType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.user?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (new Date(log.timestamp || '').toLocaleString().toLowerCase()).includes(searchTerm.toLowerCase())
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log, index) => (
                    <TableRow key={log.id || index}>
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
                      <TableCell>{log.action || '-'}</TableCell>
                      <TableCell>{log.resourceType || '-'}</TableCell>
                      <TableCell>{log.message || ''}</TableCell>
                      <TableCell>{log.user || 'System'}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: log.userRole === 'admin' 
                              ? 'primary.main' 
                              : log.userRole === 'investigator'
                              ? 'secondary.main'
                              : 'text.primary',
                            fontWeight: 'medium'
                          }}
                        >
                          {log.userRole || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{log.userEmail || '-'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default SystemLogsPage; 