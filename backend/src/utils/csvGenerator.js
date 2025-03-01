const { stringify } = require('csv-stringify');

class CSVGenerator {
  static generateOutputCSV(data) {
    return new Promise((resolve, reject) => {
      const columns = {
        'S. No.': 'S. No.',
        'Product Name': 'Product Name',
        'Input Image Urls': 'Input Image Urls',
        'Output Image Urls': 'Output Image Urls'
      };

      stringify(data, {
        header: true,
        columns: columns
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
  }
}

module.exports = CSVGenerator; 