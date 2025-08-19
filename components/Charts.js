import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function Charts({ emailData, employeeStats, filteredEmployees }) {
  
  // Hourly distribution data
  const getHourlyData = () => {
    const hourlyData = new Array(24).fill(0).map((_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      emails: 0
    }));
    
    emailData.forEach(email => {
      if (filteredEmployees.includes(email.sender)) {
        hourlyData[email.hour].emails++;
      }
    });
    
    return hourlyData;
  };

  // Daily distribution data
  const getDailyData = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData = days.map((day, index) => ({
      day,
      emails: 0
    }));
    
    emailData.forEach(email => {
      if (filteredEmployees.includes(email.sender)) {
        dailyData[email.day].emails++;
      }
    });
    
    return dailyData;
  };

  // Employee volume data
  const getEmployeeVolumeData = () => {
    return filteredEmployees.map(employee => ({
      name: employee.charAt(0).toUpperCase() + employee.slice(1),
      emails: employeeStats[employee]?.totalEmails || 0,
      size: Math.round((employeeStats[employee]?.totalBytes || 0) / 1024 / 1024 * 10) / 10
    })).sort((a, b) => b.emails - a.emails).slice(0, 10);
  };

  // Time series data (emails per day)
  const getTimeSeriesData = () => {
    const dateMap = {};
    
    emailData.forEach(email => {
      if (filteredEmployees.includes(email.sender)) {
        const date = email.date;
        if (!dateMap[date]) {
          dateMap[date] = 0;
        }
        dateMap[date]++;
      }
    });
    
    return Object.keys(dateMap)
      .sort()
      .slice(-30) // Last 30 days
      .map(date => ({
        date: new Date(date).toLocaleDateString(),
        emails: dateMap[date]
      }));
  };

  // Peak hours distribution
  const getPeakHoursData = () => {
    const peakHours = {};
    
    filteredEmployees.forEach(employee => {
      const peakHour = employeeStats[employee]?.peakHour;
      if (peakHour !== undefined) {
        const hourLabel = `${peakHour.toString().padStart(2, '0')}:00`;
        peakHours[hourLabel] = (peakHours[hourLabel] || 0) + 1;
      }
    });
    
    return Object.keys(peakHours).map(hour => ({
      hour,
      employees: peakHours[hour]
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  };

  const hourlyData = getHourlyData();
  const dailyData = getDailyData();
  const employeeVolumeData = getEmployeeVolumeData();
  const timeSeriesData = getTimeSeriesData();
  const peakHoursData = getPeakHoursData();

  return (
    <div className="charts-container">
      
      <div className="chart-section">
        <h3>📊 Hourly Email Distribution</h3>
        <div className="chart-wrapper">
          <BarChart width={800} height={300} data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" interval={1} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="emails" fill="#8884d8" />
          </BarChart>
        </div>
      </div>

      <div className="chart-section">
        <h3>📅 Daily Email Distribution</h3>
        <div className="chart-wrapper">
          <BarChart width={800} height={300} data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="emails" fill="#82ca9d" />
          </BarChart>
        </div>
      </div>

      <div className="chart-section">
        <h3>👥 Top Email Senders</h3>
        <div className="chart-wrapper">
          <BarChart width={800} height={300} data={employeeVolumeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value, name) => [value, name === 'emails' ? 'Emails' : 'Size (MB)']} />
            <Legend />
            <Bar dataKey="emails" fill="#ffc658" name="Emails" />
            <Bar dataKey="size" fill="#ff7c7c" name="Size (MB)" />
          </BarChart>
        </div>
      </div>

      <div className="chart-section">
        <h3>📈 Email Volume Trend (Last 30 Days)</h3>
        <div className="chart-wrapper">
          <LineChart width={800} height={300} data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="emails" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </div>
      </div>

      <div className="chart-section">
        <h3>⏰ Employee Peak Hours Distribution</h3>
        <div className="chart-wrapper">
          <PieChart width={400} height={300}>
            <Pie
              data={peakHoursData}
              cx={200}
              cy={150}
              labelLine={false}
              label={({ hour, employees, percent }) => `${hour} (${employees})`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="employees"
            >
              {peakHoursData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Employees']} />
          </PieChart>
        </div>
      </div>

    </div>
  );
}