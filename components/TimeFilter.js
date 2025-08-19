import { useState } from 'react';

export default function TimeFilter({ emailData, onFilteredDataChange, selectedTimeRange, onTimeRangeChange }) {
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const timeRanges = [
    { id: 'all', label: '📅 All Time', days: null },
    { id: 'lastWeek', label: '📅 Last Week', days: 7 },
    { id: 'thisMonth', label: '📅 This Month', days: 'thisMonth' },
    { id: 'lastMonth', label: '📅 Last Month', days: 30 },
    { id: 'last3Months', label: '📅 Last 3 Months', days: 90 },
    { id: 'lastYear', label: '📅 Last Year', days: 365 },
    { id: 'custom', label: '📅 Custom Range', days: 'custom' }
  ];

  const filterDataByTimeRange = (range) => {
    if (!emailData || emailData.length === 0) return [];
    
    const now = new Date();
    let filtered = [...emailData];

    switch (range) {
      case 'lastWeek':
        const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        filtered = emailData.filter(email => email.timestamp >= weekAgo);
        break;
      
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = emailData.filter(email => email.timestamp >= startOfMonth);
        break;
      
      case 'lastMonth':
        const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        filtered = emailData.filter(email => email.timestamp >= monthAgo);
        break;
      
      case 'last3Months':
        const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        filtered = emailData.filter(email => email.timestamp >= threeMonthsAgo);
        break;
      
      case 'lastYear':
        const yearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        filtered = emailData.filter(email => email.timestamp >= yearAgo);
        break;
      
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59); // Include the entire end day
          filtered = emailData.filter(email => 
            email.timestamp >= start && email.timestamp <= end
          );
        }
        break;
      
      case 'all':
      default:
        filtered = emailData;
        break;
    }

    return filtered;
  };

  const handleTimeRangeChange = (range) => {
    onTimeRangeChange(range);
    const filteredData = filterDataByTimeRange(range);
    onFilteredDataChange(filteredData);
  };

  const handleCustomDateChange = () => {
    if (selectedTimeRange === 'custom') {
      const filteredData = filterDataByTimeRange('custom');
      onFilteredDataChange(filteredData);
    }
  };

  // Get date range info for display
  const getDateRangeInfo = () => {
    if (!emailData || emailData.length === 0) return null;
    
    const filtered = filterDataByTimeRange(selectedTimeRange);
    if (filtered.length === 0) return null;

    const dates = filtered.map(e => e.timestamp).sort((a, b) => a - b);
    const start = dates[0];
    const end = dates[dates.length - 1];
    
    return {
      start: start.toLocaleDateString(),
      end: end.toLocaleDateString(),
      count: filtered.length,
      totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    };
  };

  const dateRangeInfo = getDateRangeInfo();

  return (
    <div className="time-filter">
      <h3>⏰ Time Range Filter</h3>
      
      <div className="time-range-buttons">
        {timeRanges.map(range => (
          <button
            key={range.id}
            className={`time-range-btn ${selectedTimeRange === range.id ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange(range.id)}
          >
            {range.label}
          </button>
        ))}
      </div>

      {selectedTimeRange === 'custom' && (
        <div className="custom-date-range">
          <div className="date-inputs">
            <div className="date-input-group">
              <label>From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  if (e.target.value && customEndDate) {
                    setTimeout(handleCustomDateChange, 100);
                  }
                }}
              />
            </div>
            <div className="date-input-group">
              <label>To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  if (customStartDate && e.target.value) {
                    setTimeout(handleCustomDateChange, 100);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {dateRangeInfo && (
        <div className="date-range-info">
          <div className="info-card">
            <div className="info-item">
              <span className="info-label">📅 Date Range:</span>
              <span className="info-value">{dateRangeInfo.start} - {dateRangeInfo.end}</span>
            </div>
            <div className="info-item">
              <span className="info-label">📊 Emails in Range:</span>
              <span className="info-value">{dateRangeInfo.count.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">📈 Days Covered:</span>
              <span className="info-value">{dateRangeInfo.totalDays}</span>
            </div>
          </div>
        </div>
      )}

      <div className="quick-insights">
        <h4>📊 Quick Insights</h4>
        {dateRangeInfo && (
          <div className="insights-grid">
            <div className="insight-item">
              <span className="insight-label">Avg per Day:</span>
              <span className="insight-value">
                {Math.round(dateRangeInfo.count / dateRangeInfo.totalDays)}
              </span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Peak Activity:</span>
              <span className="insight-value">
                {selectedTimeRange === 'lastWeek' ? 'This Week' : 
                 selectedTimeRange === 'lastMonth' ? 'This Month' : 
                 'Selected Period'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}