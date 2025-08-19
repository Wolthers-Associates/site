import { useState } from 'react';

export default function StatsPanel({ stats, emailData, filteredEmployees, onEmployeeFilter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalEmails');
  const [sortOrder, setSortOrder] = useState('desc');

  const allEmployees = Object.keys(stats);
  
  const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const getHourDisplay = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  const sortedEmployees = allEmployees
    .filter(emp => emp.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aVal = stats[a][sortBy];
      let bVal = stats[b][sortBy];
      
      if (sortBy === 'firstEmail' || sortBy === 'lastEmail') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      const result = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'desc' ? -result : result;
    });

  const toggleEmployeeFilter = (employee) => {
    const newFiltered = filteredEmployees.includes(employee) 
      ? filteredEmployees.filter(e => e !== employee)
      : [...filteredEmployees, employee];
    onEmployeeFilter(newFiltered);
  };

  const toggleSelectAll = () => {
    const newFiltered = filteredEmployees.length === allEmployees.length ? [] : allEmployees;
    onEmployeeFilter(newFiltered);
  };

  // Calculate totals
  const totalEmails = emailData.length;
  const totalEmployees = allEmployees.length;
  const activeEmployees = filteredEmployees.length;
  const avgEmailsPerEmployee = totalEmails / totalEmployees;

  // Find most/least active periods
  const hourlyTotals = new Array(24).fill(0);
  emailData.forEach(email => {
    hourlyTotals[email.hour]++;
  });
  const peakHour = hourlyTotals.indexOf(Math.max(...hourlyTotals));
  const quietHour = hourlyTotals.indexOf(Math.min(...hourlyTotals.filter(h => h > 0)));

  return (
    <div className="stats-panel">
      <div className="overview-stats">
        <div className="stat-card">
          <h3>📊 Total Emails</h3>
          <div className="stat-value">{totalEmails.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>👥 Total Employees</h3>
          <div className="stat-value">{totalEmployees}</div>
        </div>
        <div className="stat-card">
          <h3>📈 Avg per Employee</h3>
          <div className="stat-value">{Math.round(avgEmailsPerEmployee)}</div>
        </div>
        <div className="stat-card">
          <h3>⏰ Peak Hour</h3>
          <div className="stat-value">{getHourDisplay(peakHour)}</div>
        </div>
        <div className="stat-card">
          <h3>😴 Quiet Hour</h3>
          <div className="stat-value">{getHourDisplay(quietHour)}</div>
        </div>
      </div>

      <div className="employee-controls">
        <div className="search-filter">
          <input 
            type="text" 
            placeholder="🔍 Search employees..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="totalEmails">Total Emails</option>
            <option value="totalBytes">Total Bytes</option>
            <option value="peakHour">Peak Hour</option>
            <option value="firstEmail">First Email</option>
            <option value="lastEmail">Last Email</option>
          </select>
          
          <button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        <div className="bulk-actions">
          <button onClick={toggleSelectAll} className="select-all-btn">
            {filteredEmployees.length === allEmployees.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="filter-info">
            {activeEmployees} of {totalEmployees} employees shown
          </span>
        </div>
      </div>

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Active</th>
              <th>Employee</th>
              <th>Total Emails</th>
              <th>Total Size</th>
              <th>Peak Day</th>
              <th>Peak Hour</th>
              <th>Date Range</th>
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map(employee => {
              const empStats = stats[employee];
              const isActive = filteredEmployees.includes(employee);
              
              return (
                <tr key={employee} className={isActive ? 'active-employee' : 'inactive-employee'}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={() => toggleEmployeeFilter(employee)}
                    />
                  </td>
                  <td className="employee-name">
                    {employee.charAt(0).toUpperCase() + employee.slice(1)}
                  </td>
                  <td className="email-count">
                    {empStats.totalEmails.toLocaleString()}
                  </td>
                  <td className="bytes-count">
                    {(empStats.totalBytes / 1024 / 1024).toFixed(1)}MB
                  </td>
                  <td>
                    {getDayName(empStats.peakDay)}
                  </td>
                  <td>
                    {getHourDisplay(empStats.peakHour)}
                  </td>
                  <td className="date-range">
                    {empStats.firstEmail.toLocaleDateString()} - {empStats.lastEmail.toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}