const { parse } = require('csv-parse');

class CSVParser {
  static parse(buffer) {
    return new Promise((resolve, reject) => {
      const records = [];
      const parser = parse({
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true // This helps with multiline cells
      });

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          // Clean up the input URLs (remove any newlines and extra spaces)
          const inputUrls = record['Input Image Urls']
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 0)
            .join(',');

          records.push({
            serialNumber: record['S. No.'],
            productName: record['Product Name'],
            inputImageUrls: inputUrls
          });
        }
      });

      parser.on('error', function(err) {
        reject(err);
      });

      parser.on('end', function() {
        resolve(records);
      });

      parser.write(buffer);
      parser.end();
    });
  }
}

module.exports = CSVParser; 