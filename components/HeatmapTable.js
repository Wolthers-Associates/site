import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function HeatmapTable({ heatmapData, filteredEmployees }) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'single'

  // Get max value for color scaling
  const getMaxValue = () => {
    let max = 0;
    filteredEmployees.forEach(emp => {
      if (heatmapData[emp]) {
        DAYS.forEach((_, day) => {
          HOURS.forEach((_, hour) => {
            max = Math.max(max, heatmapData[emp][day]?.[hour] || 0);
          });
        });
      }
    });
    return max;
  };

  const maxValue = getMaxValue();

  const getIntensityColor = (value) => {
    if (value === 0) return '#f8f9fa';
    const intensity = value / maxValue;
    if (intensity < 0.1) return '#e3f2fd';
    if (intensity < 0.3) return '#90caf9';
    if (intensity < 0.5) return '#42a5f5';
    if (intensity < 0.7) return '#1e88e5';
    if (intensity < 0.9) return '#1565c0';
    return '#0d47a1';
  };

  const renderSingleEmployeeView = () => {
    if (!selectedEmployee || !heatmapData[selectedEmployee]) return null;

    return (
      <div className="heatmap-single">
        <h3>{selectedEmployee.charAt(0).toUpperCase() + selectedEmployee.slice(1)}&apos;s Email Activity</h3>
        <table className="heatmap-table">
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {DAYS.map(day => (
                <th key={day} className="day-header">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, hourIndex) => (
              <tr key={hour}>
                <td className="time-cell">{hour}</td>
                {DAYS.map((_, dayIndex) => {
                  const value = heatmapData[selectedEmployee][dayIndex]?.[hourIndex] || 0;
                  return (
                    <td 
                      key={dayIndex} 
                      className="heatmap-cell"
                      style={{ backgroundColor: getIntensityColor(value) }}
                      title={`${DAYS[dayIndex]} ${hour}: ${value} emails`}
                    >
                      {value || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAllEmployeesView = () => {
    return (
      <div className="heatmap-all">
        {filteredEmployees.map(employee => {
          if (!heatmapData[employee]) return null;
          
          const totalEmails = DAYS.reduce((dayTotal, _, day) => {
            return dayTotal + HOURS.reduce((hourTotal, _, hour) => {
              return hourTotal + (heatmapData[employee][day]?.[hour] || 0);
            }, 0);
          }, 0);

          return (
            <div key={employee} className="employee-heatmap">
              <div className="employee-header">
                <h4>{employee.charAt(0).toUpperCase() + employee.slice(1)}</h4>
                <span className="email-count">{totalEmails} emails sent</span>
              </div>
              
              <table className="mini-heatmap">
                <thead>
                  <tr>
                    <th></th>
                    {DAYS.map(day => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[4, 8, 12, 16, 20].map(hour => ( // Show key hours: 4am, 8am, 12pm, 4pm, 8pm
                    <tr key={hour}>
                      <td className="hour-label">{hour.toString().padStart(2, '0')}:00</td>
                      {DAYS.map((_, dayIndex) => {
                        const value = heatmapData[employee][dayIndex]?.[hour] || 0;
                        return (
                          <td 
                            key={dayIndex}
                            className="mini-heatmap-cell"
                            style={{ backgroundColor: getIntensityColor(value) }}
                            title={`${value} emails`}
                          >
                            {value || ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="heatmap-container">
      <div className="heatmap-controls">
        <div className="view-toggle">
          <button 
            className={viewMode === 'all' ? 'active' : ''} 
            onClick={() => setViewMode('all')}
          >
            All Employees
          </button>
          <button 
            className={viewMode === 'single' ? 'active' : ''} 
            onClick={() => setViewMode('single')}
          >
            Single Employee
          </button>
        </div>
        
        {viewMode === 'single' && (
          <select 
            value={selectedEmployee} 
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select Employee</option>
            {filteredEmployees.map(emp => (
              <option key={emp} value={emp}>
                {emp.charAt(0).toUpperCase() + emp.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="legend">
        <span>Less activity</span>
        <div className="legend-colors">
          <div style={{ backgroundColor: '#f8f9fa' }}></div>
          <div style={{ backgroundColor: '#e3f2fd' }}></div>
          <div style={{ backgroundColor: '#90caf9' }}></div>
          <div style={{ backgroundColor: '#42a5f5' }}></div>
          <div style={{ backgroundColor: '#1e88e5' }}></div>
          <div style={{ backgroundColor: '#1565c0' }}></div>
          <div style={{ backgroundColor: '#0d47a1' }}></div>
        </div>
        <span>More activity</span>
      </div>

      {viewMode === 'single' ? renderSingleEmployeeView() : renderAllEmployeesView()}
    </div>
  );
}