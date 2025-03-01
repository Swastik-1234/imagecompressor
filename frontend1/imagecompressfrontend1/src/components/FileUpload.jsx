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

const API_BASE_URL = 'http://localhost:3001'; // Updated port

const FileUpload = () => {
    const [compressionStats, setCompressionStats] = useState({});

  const [file, setFile] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const response = await axios.get(`${API_BASE_URL}/api/results/${id}`);
      console.log('Results received:', response.data); // Debug log
      setResults(response.data.products);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch results: ' + err.message);
      setLoading(false);
    }
  };

  const processImages = async (requestId, products) => {
    try {
      // ... existing code ...

      const outputUrls = inputUrls.map(url => {
        // Create a new URL object
        const urlObj = new URL(url);
        // Add 'processed-' prefix to the hostname
        return url.replace(urlObj.hostname, 'processed-' + urlObj.hostname);
      });

      // ... rest of the code ...
    } catch (error) {
      console.error('Error processing images:', error);
      throw error;
    }
  };

  const getProcessedImageUrl = (inputUrl) => {
    try {
      const urlObj = new URL(inputUrl);
      // Add 'processed-' prefix to the hostname
      return inputUrl.replace(urlObj.hostname, 'processed-' + urlObj.hostname);
    } catch (error) {
      console.error('Error processing URL:', error);
      return inputUrl;
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
                <TableCell>Original Image</TableCell>
                <TableCell>Compressed Image</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((product) => (
                <TableRow key={product['Sl No']}>
                  <TableCell>{product['Sl No']}</TableCell>
                  <TableCell>{product['Product Name']}</TableCell>
                  <TableCell>
                    {product['Input Image Urls'].map((url, i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Original Image {i + 1}</Typography>
                        <img 
                          src={url} 
                          alt={`Original ${i + 1}`}
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '200px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '4px'
                          }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          Size: {formatFileSize(product.originalSizes?.[i])}
                        </Typography>
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>
                    {product['Output Image Urls'] && product['Output Image Urls'].map((url, i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">
                          Compressed Image {i + 1}
                        </Typography>
                        <img 
                          src={url} 
                          alt={`Compressed ${i + 1}`}
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '200px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '4px'
                          }}
                        />
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Original Size: {formatFileSize(product.originalSizes?.[i])}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Compressed Size: {formatFileSize(product.compressedSizes?.[i])}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'success.main',
                              fontWeight: 'bold',
                              display: 'block',
                              mt: 0.5
                            }}
                          >
                            {product.compressionRatios?.[i] 
                              ? `Reduced by ${product.compressionRatios[i]}%` 
                              : 'Calculating compression ratio...'}
                          </Typography>
                        </Box>
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