import React, { useState } from 'react';
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
  Paper,
  TextField,
  Alert
} from '@mui/material';
import axios from 'axios';

const FileUpload = () => {
  const [compressionStats, setCompressionStats] = useState({});
  const [file, setFile] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookStatus, setWebhookStatus] = useState(null);
  const [webhookTriggered, setWebhookTriggered] = useState(false);

  const API_BASE_URL = 'http://localhost:3001';

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Calculating...';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
    setWebhookTriggered(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setWebhookStatus(webhookUrl ? 'Webhook configured - waiting for processing' : null);
    setWebhookTriggered(false);

    const formData = new FormData();
    formData.append('file', file);
    if (webhookUrl) {
      formData.append('webhookUrl', webhookUrl);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData);
      setRequestId(response.data.requestId);
      checkStatus(response.data.requestId);
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setLoading(false);
    }
  };

  const checkStatus = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/status/${id}`);
      setStatus(response.data.status);

      if (response.data.status === 'completed') {
        setWebhookTriggered(true);
        setWebhookStatus('Processing complete! Check webhook.site for results');
        getResults(id);
      } else if (response.data.status === 'processing') {
        setTimeout(() => checkStatus(id), 2000);
      } else if (response.data.status === 'failed') {
        setError('Processing failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Status check failed: ' + err.message);
      setLoading(false);
    }
  };

  const getResults = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/results/${id}`);
      setResults(response.data);
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

      <TextField
        label="Webhook URL (optional)"
        value={webhookUrl}
        onChange={(e) => setWebhookUrl(e.target.value)}
        fullWidth
        margin="normal"
        helperText="Enter webhook.site URL to receive processing notifications"
      />

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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {webhookUrl && webhookStatus && (
        <Alert 
          severity={webhookTriggered ? "success" : "info"} 
          sx={{ mb: 2 }}
        >
          {webhookStatus}
        </Alert>
      )}

      {results && (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sl No</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Original Image</TableCell>
                <TableCell>Compressed Image</TableCell>
                <TableCell>Original Size</TableCell>
                <TableCell>Compressed Size</TableCell>
                <TableCell>Compression Ratio</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{product['Sl No']}</TableCell>
                  <TableCell>{product['Product Name']}</TableCell>
                  <TableCell>
                    {product['Input Image Urls'] && product['Input Image Urls'].map((url, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        <img 
                          src={url} 
                          alt={`Original ${i+1}`} 
                          style={{ maxWidth: '100px', height: 'auto' }}
                        />
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>
                    {product['Output Image Urls'] && product['Output Image Urls'].map((url, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        <img 
                          src={url} 
                          alt={`Compressed ${i+1}`} 
                          style={{ maxWidth: '100px', height: 'auto' }}
                        />
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>
                    {product.originalSizes && product.originalSizes.map((size, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        {formatFileSize(size)}
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>
                    {product.compressedSizes && product.compressedSizes.map((size, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        {formatFileSize(size)}
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>
                    {product.compressionRatios && product.compressionRatios.map((ratio, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        {ratio}%
                      </Box>
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