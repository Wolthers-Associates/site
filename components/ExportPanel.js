import { useState } from 'react';

export default function ExportPanel({ emailData, employeeStats, filteredEmployees }) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportType, setExportType] = useState('summary');

  const generateSummaryReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      totalEmployees: Object.keys(employeeStats).length,
      activeEmployees: filteredEmployees.length,
      totalEmails: emailData.filter(e => filteredEmployees.includes(e.sender)).length,
      dateRange: {
        start: Math.min(...emailData.map(e => e.timestamp.getTime())),
        end: Math.max(...emailData.map(e => e.timestamp.getTime()))
      },
      topPerformers: filteredEmployees
        .map(emp => ({
          employee: emp,
          emails: employeeStats[emp]?.totalEmails || 0,
          totalBytes: employeeStats[emp]?.totalBytes || 0
        }))
        .sort((a, b) => b.emails - a.emails)
        .slice(0, 10),
      insights: {
        avgEmailsPerEmployee: Math.round(emailData.length / Object.keys(employeeStats).length),
        peakHours: getPeakHoursInsight(),
        peakDays: getPeakDaysInsight()
      }
    };
    return report;
  };

  const getPeakHoursInsight = () => {
    const hourlyTotals = new Array(24).fill(0);
    emailData.forEach(email => {
      if (filteredEmployees.includes(email.sender)) {
        hourlyTotals[email.hour]++;
      }
    });
    return hourlyTotals
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const getPeakDaysInsight = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyTotals = new Array(7).fill(0);
    emailData.forEach(email => {
      if (filteredEmployees.includes(email.sender)) {
        dailyTotals[email.day]++;
      }
    });
    return dailyTotals
      .map((count, day) => ({ day: days[day], count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const generateDetailedReport = () => {
    return emailData
      .filter(email => filteredEmployees.includes(email.sender))
      .map(email => ({
        timestamp: email.timestamp.toISOString(),
        date: email.date,
        employee: email.sender,
        hour: email.hour,
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][email.day],
        subject: email.subject,
        bytes: email.bytes,
        recipients: email.recipients
      }));
  };

  const generateEmployeeReport = () => {
    return filteredEmployees.map(employee => {
      const stats = employeeStats[employee];
      if (!stats) return null;
      
      return {
        employee,
        totalEmails: stats.totalEmails,
        totalBytes: stats.totalBytes,
        totalSizeMB: Math.round(stats.totalBytes / 1024 / 1024 * 10) / 10,
        peakHour: stats.peakHour,
        peakDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][stats.peakDay],
        firstEmail: stats.firstEmail.toISOString(),
        lastEmail: stats.lastEmail.toISOString(),
        avgEmailsPerDay: Math.round(stats.totalEmails / ((stats.lastEmail - stats.firstEmail) / (1000 * 60 * 60 * 24)) * 10) / 10
      };
    }).filter(Boolean);
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    let data;
    let filename;
    
    switch (exportType) {
      case 'summary':
        data = generateSummaryReport();
        filename = 'email-analytics-summary';
        break;
      case 'detailed':
        data = generateDetailedReport();
        filename = 'email-analytics-detailed';
        break;
      case 'employees':
        data = generateEmployeeReport();
        filename = 'employee-email-stats';
        break;
      default:
        return;
    }
    
    if (exportFormat === 'csv') {
      if (exportType === 'summary') {
        // For summary, create a flattened CSV-friendly version
        const flatData = [{
          generatedAt: data.generatedAt,
          totalEmployees: data.totalEmployees,
          activeEmployees: data.activeEmployees,
          totalEmails: data.totalEmails,
          startDate: new Date(data.dateRange.start).toISOString(),
          endDate: new Date(data.dateRange.end).toISOString(),
          avgEmailsPerEmployee: data.insights.avgEmailsPerEmployee,
          topPerformer: data.topPerformers[0]?.employee || 'N/A',
          topPerformerEmails: data.topPerformers[0]?.emails || 0
        }];
        exportToCSV(flatData, filename);
      } else {
        exportToCSV(data, filename);
      }
    } else {
      exportToJSON(data, filename);
    }
  };

  const generatePrintReport = () => {
    const summary = generateSummaryReport();
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; }
            .section { margin-bottom: 30px; }
            .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .insights { background: #f8f9fa; padding: 20px; border-radius: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📧 Email Analytics Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="section">
            <h2>📊 Overview</h2>
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">${summary.totalEmails.toLocaleString()}</div>
                <div class="stat-label">Total Emails</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${summary.totalEmployees}</div>
                <div class="stat-label">Total Employees</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${summary.activeEmployees}</div>
                <div class="stat-label">Active Employees</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${summary.insights.avgEmailsPerEmployee}</div>
                <div class="stat-label">Avg per Employee</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>🏆 Top Performers</h2>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Total Emails</th>
                  <th>Total Size (MB)</th>
                </tr>
              </thead>
              <tbody>
                ${summary.topPerformers.map(emp => `
                  <tr>
                    <td>${emp.employee.charAt(0).toUpperCase() + emp.employee.slice(1)}</td>
                    <td>${emp.emails.toLocaleString()}</td>
                    <td>${(emp.totalBytes / 1024 / 1024).toFixed(1)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>📈 Key Insights</h2>
            <div class="insights">
              <h3>Peak Hours:</h3>
              <ul>
                ${summary.insights.peakHours.map(h => `<li>${h.hour}:00 - ${h.count} emails</li>`).join('')}
              </ul>
              
              <h3>Peak Days:</h3>
              <ul>
                ${summary.insights.peakDays.map(d => `<li>${d.day} - ${d.count} emails</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="export-panel">
      <h3>📤 Export & Reports</h3>
      
      <div className="export-controls">
        <div className="export-options">
          <div className="option-group">
            <label>Report Type:</label>
            <select value={exportType} onChange={(e) => setExportType(e.target.value)}>
              <option value="summary">Executive Summary</option>
              <option value="detailed">Detailed Email Log</option>
              <option value="employees">Employee Statistics</option>
            </select>
          </div>
          
          <div className="option-group">
            <label>Format:</label>
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
        
        <div className="export-actions">
          <button onClick={handleExport} className="export-btn">
            📥 Export Data
          </button>
          <button onClick={generatePrintReport} className="print-btn">
            🖨️ Print Report
          </button>
        </div>
      </div>
      
      <div className="export-info">
        <p>
          {exportType === 'summary' && 'Executive summary with key metrics and insights'}
          {exportType === 'detailed' && 'Complete email log with all tracked data points'}
          {exportType === 'employees' && 'Individual employee statistics and performance metrics'}
        </p>
        <p className="filter-info">
          📊 Currently showing data for {filteredEmployees.length} employees
        </p>
      </div>
    </div>
  );
}