const express = require('express');
const multer = require('multer');
const cors = require('cors');
const csv = require('csv-parse');
const sharp = require('sharp');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const processImage = async (imageUrl) => {
  try {
    console.log('Downloading image:', imageUrl);
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxContentLength: 50 * 1024 * 1024 // 50MB max
    });

    const originalBuffer = Buffer.from(response.data);
    const originalSize = originalBuffer.length;

    console.log('Compressing image...');
    const compressedBuffer = await sharp(originalBuffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        mozjpeg: true
      })
      .toBuffer();

    const compressedSize = compressedBuffer.length;
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
    const base64Data = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

    console.log('Image processed successfully', {
      originalSize,
      compressedSize,
      compressionRatio
    });

    return {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio,
      compressedImageUrl: base64Data
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

app.post('/api/upload', multer().single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const webhookUrl = req.body.webhookUrl;
    const results = [];
    
    const parser = csv.parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read())) {
        if (record['Input image Urls']) {
          results.push({
            'Sl No': record['Sl No'],
            'Product Name': record['Product Name'],
            'Input image Urls': record['Input image Urls'].trim()
          });
        }
      }
    });

    parser.on('end', async () => {
      try {
        console.log('Processing', results.length, 'records');
        
        const processedResults = await Promise.all(
          results.map(async (record) => {
            try {
              const imageUrl = record['Input image Urls'];
              console.log('Processing:', record['Product Name'], imageUrl);

              const processedImage = await processImage(imageUrl);

              if (processedImage.success) {
                return {
                  'Sl No': record['Sl No'],
                  'Product Name': record['Product Name'],
                  'Input Image Urls': [imageUrl],
                  'Output Image Urls': [processedImage.compressedImageUrl],
                  'originalSizes': [processedImage.originalSize],
                  'compressedSizes': [processedImage.compressedSize],
                  'compressionRatios': [processedImage.compressionRatio]
                };
              } else {
                console.error('Failed to process image:', imageUrl, processedImage.error);
                return {
                  'Sl No': record['Sl No'],
                  'Product Name': record['Product Name'],
                  'Input Image Urls': [imageUrl],
                  'Output Image Urls': [],
                  'originalSizes': [0],
                  'compressedSizes': [0],
                  'compressionRatios': [0]
                };
              }
            } catch (error) {
              console.error('Error processing record:', error);
              return {
                'Sl No': record['Sl No'],
                'Product Name': record['Product Name'],
                'Input Image Urls': [record['Input image Urls']],
                'Output Image Urls': [],
                'originalSizes': [0],
                'compressedSizes': [0],
                'compressionRatios': [0]
              };
            }
          })
        );

        // Send webhook notification if URL provided
        if (webhookUrl) {
          try {
            await axios.post(webhookUrl, {
              status: 'completed',
              results: processedResults
            });
            console.log('Webhook notification sent successfully');
          } catch (webhookError) {
            console.error('Webhook notification failed:', webhookError);
          }
        }

        res.json({
          message: 'File processed successfully',
          data: processedResults
        });
      } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ error: 'Failed to process images' });
      }
    });

    parser.write(req.file.buffer);
    parser.end();

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error processing upload' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
//................................................

// const express = require('express');
// const multer = require('multer');
// const cors = require('cors');
// const csv = require('csv-parse');
// const sharp = require('sharp');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Updated CORS configuration for production
// app.use(cors({
//   origin: [
//     'https://frontend-imagecompression1-git-main-swastiks-projects-4c1663a0.vercel.app',
//     'http://localhost:3000',
//     'https://frontend-imagecompression1.vercel.app'
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));

// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({ status: 'OK' });
// });

// const processImage = async (imageUrl) => {
//   try {
//     console.log('Downloading image:', imageUrl);
//     const response = await axios({
//       method: 'get',
//       url: imageUrl,
//       responseType: 'arraybuffer',
//       timeout: 60000, // Increased timeout for production
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
//       },
//       maxContentLength: 50 * 1024 * 1024 // 50MB max
//     });

//     const originalBuffer = Buffer.from(response.data);
//     const originalSize = originalBuffer.length;

//     // Optimized sharp configuration for production
//     const compressedBuffer = await sharp(originalBuffer)
//       .resize(800, 800, {
//         fit: 'inside',
//         withoutEnlargement: true,
//         fastShrinkOnLoad: true
//       })
//       .jpeg({
//         quality: 80,
//         mozjpeg: true,
//         force: true
//       })
//       .toBuffer();

//     const compressedSize = compressedBuffer.length;
//     const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
//     const base64Data = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

//     return {
//       success: true,
//       originalSize,
//       compressedSize,
//       compressionRatio,
//       compressedImageUrl: base64Data
//     };
//   } catch (error) {
//     console.error('Image processing failed:', error);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// };

// // Main upload endpoint
// app.post('/api/upload', multer().single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const webhookUrl = req.body.webhookUrl;
//     const results = [];
    
//     const parser = csv.parse({
//       columns: true,
//       skip_empty_lines: true,
//       trim: true,
//       skipEmptyLines: true
//     });

//     parser.on('readable', () => {
//       let record;
//       while ((record = parser.read())) {
//         if (record['Input image Urls']) {
//           results.push({
//             'Sl No': record['Sl No'],
//             'Product Name': record['Product Name'],
//             'Input image Urls': record['Input image Urls'].trim()
//           });
//         }
//       }
//     });

//     parser.on('end', async () => {
//       try {
//         const processedResults = await Promise.all(
//           results.map(async (record) => {
//             try {
//               const imageUrl = record['Input image Urls'];
//               const processedImage = await processImage(imageUrl);

//               if (processedImage.success) {
//                 return {
//                   'Sl No': record['Sl No'],
//                   'Product Name': record['Product Name'],
//                   'Input Image Urls': [imageUrl],
//                   'Output Image Urls': [processedImage.compressedImageUrl],
//                   'originalSizes': [processedImage.originalSize],
//                   'compressedSizes': [processedImage.compressedSize],
//                   'compressionRatios': [processedImage.compressionRatio]
//                 };
//               } else {
//                 return {
//                   'Sl No': record['Sl No'],
//                   'Product Name': record['Product Name'],
//                   'Input Image Urls': [imageUrl],
//                   'Output Image Urls': [],
//                   'originalSizes': [0],
//                   'compressedSizes': [0],
//                   'compressionRatios': [0]
//                 };
//               }
//             } catch (error) {
//               console.error('Error processing record:', error);
//               return {
//                 'Sl No': record['Sl No'],
//                 'Product Name': record['Product Name'],
//                 'Input Image Urls': [record['Input image Urls']],
//                 'Output Image Urls': [],
//                 'originalSizes': [0],
//                 'compressedSizes': [0],
//                 'compressionRatios': [0]
//               };
//             }
//           })
//         );

//         if (webhookUrl) {
//           try {
//             await axios.post(webhookUrl, {
//               status: 'completed',
//               results: processedResults
//             });
//           } catch (webhookError) {
//             console.error('Webhook notification failed:', webhookError);
//           }
//         }

//         res.json({
//           message: 'File processed successfully',
//           data: processedResults
//         });
//       } catch (error) {
//         console.error('Processing error:', error);
//         res.status(500).json({ error: 'Failed to process images' });
//       }
//     });

//     parser.write(req.file.buffer);
//     parser.end();

//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({ error: 'Error processing upload' });
//   }
// });

// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on port ${PORT}`);
// });

// module.exports = app;