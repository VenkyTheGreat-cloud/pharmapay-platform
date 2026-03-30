# Frontend Excel Export Integration Guide

## Overview

All report endpoints now support Excel export by adding `format=excel` as a query parameter. The response will be a binary Excel file that needs to be handled as a blob download.

## API Endpoints

### 1. Orders Export (Dedicated Endpoint)
**Endpoint:** `GET /api/orders/export/excel`  
**No format parameter needed** - this is a dedicated Excel export endpoint

### 2. Reports Export (Add format parameter)
All report endpoints support Excel export by adding `format=excel`:

- **Delivery Boy Report:** `GET /api/reports/delivery-boy?format=excel&...`
- **Customer Report:** `GET /api/reports/customer?format=excel&...`
- **Return Items Report:** `GET /api/reports/return-items?format=excel&...`
- **Sales Report:** `GET /api/reports/sales?format=excel&...`

## Frontend Implementation

### Generic Excel Download Function

```javascript
/**
 * Generic function to download Excel file from API
 * @param {string} url - Full API URL with query parameters
 * @param {string} defaultFilename - Default filename if not provided by server
 * @param {string} token - Authentication token
 */
const downloadExcelFile = async (url, defaultFilename = 'report.xlsx', token) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    if (!response.ok) {
      // Handle error response (might be JSON)
      if (response.headers.get('content-type')?.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to download Excel file');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is Excel file
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('spreadsheetml')) {
      // Might be JSON error response
      const error = await response.json();
      throw new Error(error.error?.message || 'Invalid response format');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = defaultFilename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
        // Decode URI if needed
        try {
          filename = decodeURIComponent(filename);
        } catch (e) {
          // Keep original if decode fails
        }
      }
    }

    // Convert response to blob
    const blob = await response.blob();

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);

    return { success: true, filename };
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    throw error;
  }
};
```

### React Example

```jsx
import { useState } from 'react';

const ReportsComponent = () => {
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token'); // or from your auth context

  const exportDeliveryBoyReport = async (fromDate, fromTime, toDate, toTime) => {
    setLoading(true);
    try {
      const url = `/api/reports/delivery-boy?format=excel&from_date=${fromDate}&from_time=${fromTime}&to_date=${toDate}&to_time=${toTime}`;
      await downloadExcelFile(url, 'delivery_boy_report.xlsx', token);
      // Show success message
      alert('Report downloaded successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportCustomerReport = async (fromDate, fromTime, toDate, toTime) => {
    setLoading(true);
    try {
      const url = `/api/reports/customer?format=excel&from_date=${fromDate}&from_time=${fromTime}&to_date=${toDate}&to_time=${toTime}`;
      await downloadExcelFile(url, 'customer_report.xlsx', token);
      alert('Report downloaded successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportReturnItemsReport = async (fromDate, fromTime, toDate, toTime) => {
    setLoading(true);
    try {
      const url = `/api/reports/return-items?format=excel&from_date=${fromDate}&from_time=${fromTime}&to_date=${toDate}&to_time=${toTime}`;
      await downloadExcelFile(url, 'return_items_report.xlsx', token);
      alert('Report downloaded successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportSalesReport = async (fromDate, fromTime, toDate, toTime) => {
    setLoading(true);
    try {
      const url = `/api/reports/sales?format=excel&from_date=${fromDate}&from_time=${fromTime}&to_date=${toDate}&to_time=${toTime}`;
      await downloadExcelFile(url, 'sales_report.xlsx', token);
      alert('Report downloaded successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Orders export (dedicated endpoint, no format parameter)
  const exportOrders = async (dateFrom, dateTo) => {
    setLoading(true);
    try {
      const url = `/api/orders/export/excel?date_from=${dateFrom}&date_to=${dateTo}`;
      await downloadExcelFile(url, 'orders.xlsx', token);
      alert('Orders exported successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => exportDeliveryBoyReport('2026-01-10', '00:00:00', '2026-02-10', '23:59:59')}
        disabled={loading}
      >
        {loading ? 'Downloading...' : 'Export Delivery Boy Report'}
      </button>
      
      <button 
        onClick={() => exportCustomerReport('2026-01-10', '00:00:00', '2026-02-10', '23:59:59')}
        disabled={loading}
      >
        {loading ? 'Downloading...' : 'Export Customer Report'}
      </button>
      
      <button 
        onClick={() => exportReturnItemsReport('2026-01-10', '00:00:00', '2026-02-10', '23:59:59')}
        disabled={loading}
      >
        {loading ? 'Downloading...' : 'Export Return Items Report'}
      </button>
      
      <button 
        onClick={() => exportSalesReport('2026-01-10', '00:00:00', '2026-02-10', '23:59:59')}
        disabled={loading}
      >
        {loading ? 'Downloading...' : 'Export Sales Report'}
      </button>
      
      <button 
        onClick={() => exportOrders('2026-01-10', '2026-02-10')}
        disabled={loading}
      >
        {loading ? 'Downloading...' : 'Export Orders'}
      </button>
    </div>
  );
};
```

### Vue.js Example

```vue
<template>
  <div>
    <button 
      @click="exportDeliveryBoyReport" 
      :disabled="loading"
    >
      {{ loading ? 'Downloading...' : 'Export Delivery Boy Report' }}
    </button>
    
    <button 
      @click="exportCustomerReport" 
      :disabled="loading"
    >
      {{ loading ? 'Downloading...' : 'Export Customer Report' }}
    </button>
    
    <button 
      @click="exportReturnItemsReport" 
      :disabled="loading"
    >
      {{ loading ? 'Downloading...' : 'Export Return Items Report' }}
    </button>
    
    <button 
      @click="exportSalesReport" 
      :disabled="loading"
    >
      {{ loading ? 'Downloading...' : 'Export Sales Report' }}
    </button>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const loading = ref(false);
    const token = localStorage.getItem('token');

    const downloadExcelFile = async (url, defaultFilename, token) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        });

        if (!response.ok) {
          if (response.headers.get('content-type')?.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to download Excel file');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('spreadsheetml')) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Invalid response format');
        }

        const contentDisposition = response.headers.get('content-disposition');
        let filename = defaultFilename;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
            try {
              filename = decodeURIComponent(filename);
            } catch (e) {
              // Keep original
            }
          }
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(link);

        return { success: true, filename };
      } catch (error) {
        console.error('Error downloading Excel file:', error);
        throw error;
      }
    };

    const exportDeliveryBoyReport = async () => {
      loading.value = true;
      try {
        const url = `/api/reports/delivery-boy?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59`;
        await downloadExcelFile(url, 'delivery_boy_report.xlsx', token);
        alert('Report downloaded successfully!');
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        loading.value = false;
      }
    };

    const exportCustomerReport = async () => {
      loading.value = true;
      try {
        const url = `/api/reports/customer?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59`;
        await downloadExcelFile(url, 'customer_report.xlsx', token);
        alert('Report downloaded successfully!');
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        loading.value = false;
      }
    };

    const exportReturnItemsReport = async () => {
      loading.value = true;
      try {
        const url = `/api/reports/return-items?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59`;
        await downloadExcelFile(url, 'return_items_report.xlsx', token);
        alert('Report downloaded successfully!');
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        loading.value = false;
      }
    };

    const exportSalesReport = async () => {
      loading.value = true;
      try {
        const url = `/api/reports/sales?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59`;
        await downloadExcelFile(url, 'sales_report.xlsx', token);
        alert('Report downloaded successfully!');
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        loading.value = false;
      }
    };

    return {
      loading,
      exportDeliveryBoyReport,
      exportCustomerReport,
      exportReturnItemsReport,
      exportSalesReport
    };
  }
};
</script>
```

### Axios Example

```javascript
import axios from 'axios';

const downloadExcelWithAxios = async (url, defaultFilename, token) => {
  try {
    const response = await axios({
      url: url,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'blob' // Important: set responseType to 'blob'
    });

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
        try {
          filename = decodeURIComponent(filename);
        } catch (e) {
          // Keep original
        }
      }
    }

    // Create blob URL and download
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);

    return { success: true, filename };
  } catch (error) {
    // Handle error response (might be JSON)
    if (error.response?.data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorData = JSON.parse(reader.result);
          throw new Error(errorData.error?.message || 'Failed to download Excel file');
        } catch (e) {
          throw new Error('Failed to download Excel file');
        }
      };
      reader.readAsText(error.response.data);
    } else {
      throw error;
    }
  }
};

// Usage
const exportReport = async () => {
  try {
    const url = '/api/reports/sales?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59';
    await downloadExcelWithAxios(url, 'sales_report.xlsx', token);
    console.log('Download successful!');
  } catch (error) {
    console.error('Download failed:', error.message);
  }
};
```

## Important Notes

1. **Always use `format=excel` parameter** for reports endpoints to get Excel file
2. **Without `format=excel`**, reports endpoints return JSON data
3. **Orders export** uses dedicated endpoint `/api/orders/export/excel` (no format parameter)
4. **Response type**: Excel files are binary, must be handled as `blob`
5. **Error handling**: If export fails, server returns JSON error (check `content-type` header)
6. **Filename**: Server provides filename in `Content-Disposition` header, but you can use a default

## URL Examples

```
# Delivery Boy Report
/api/reports/delivery-boy?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59

# Customer Report
/api/reports/customer?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59

# Return Items Report
/api/reports/return-items?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59

# Sales Report
/api/reports/sales?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59

# Orders Export (no format parameter)
/api/orders/export/excel?date_from=2026-01-10&date_to=2026-02-10
```

## Testing

You can test the endpoints directly in browser or using curl:

```bash
# Test with curl
curl -X GET "https://pharmapay-api.onrender.com/api/reports/sales?format=excel&from_date=2026-01-10&from_time=00:00:00&to_date=2026-02-10&to_time=23:59:59" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output sales_report.xlsx
```

## Troubleshooting

1. **File is corrupted**: Make sure you're handling the response as `blob`, not `json`
2. **Download doesn't start**: Check that you're creating and clicking the `<a>` element
3. **Error response**: Check `content-type` header - if it's JSON, parse it for error message
4. **CORS issues**: Ensure your API allows the origin and includes proper headers
