import { useState } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import axios from 'axios';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3001/api/upload', formData);
      setRequestId(response.data.requestId);
      checkStatus(response.data.requestId);
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setLoading(false);
    }
  };

  const checkStatus = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/status/${id}`);
      setStatus(response.data.status);

      if (response.data.status === 'completed') {
        getResults(id);
      } else if (response.data.status === 'failed') {
        setError('Processing failed');
        setLoading(false);
      } else {
        // Check again in 2 seconds
        setTimeout(() => checkStatus(id), 2000);
      }
    } catch (err) {
      setError('Status check failed: ' + err.message);
      setLoading(false);
    }
  };

  const getResults = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/results/${id}`);
      setResults(response.data.products);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch results: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Image Processing System
      </Typography>

      <Box sx={{ mb: 3 }}>
        <input
          accept=".csv"
          style={{ display: 'none' }}
          id="raised-button-file"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="raised-button-file">
          <Button variant="contained" component="span" sx={{ mr: 2 }}>
            Select CSV File
          </Button>
        </label>
        {file && (
          <Typography component="span">
            Selected: {file.name}
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || loading}
        sx={{ mb: 3 }}
      >
        Upload and Process
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography>
            {status ? `Status: ${status}` : 'Uploading...'}
          </Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {results && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sl No</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Input URLs</TableCell>
                <TableCell>Output URLs</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((product) => (
                <TableRow key={product['Sl No']}>
                  <TableCell>{product['Sl No']}</TableCell>
                  <TableCell>{product['Product Name']}</TableCell>
                  <TableCell>
                    {product['Input Image Urls'].map((url, i) => (
                      <div key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          Image {i + 1}
                        </a>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {product['Output Image Urls'].map((url, i) => (
                      <div key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          Processed Image {i + 1}
                        </a>
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default FileUpload; 