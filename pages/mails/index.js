import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { parseCSV, processEmailData, createHeatmapData, getEmployeeStats } from '../../lib/csvParser';
import HeatmapTable from '../../components/HeatmapTable';
import StatsPanel from '../../components/StatsPanel';
import Charts from '../../components/Charts';
import ExportPanel from '../../components/ExportPanel';
import TimeFilter from '../../components/TimeFilter';
import CsvUpload from '../../components/CsvUpload';

export default function MailsDashboard() {
  const { data: session, status } = useSession();
  const [allEmailData, setAllEmailData] = useState([]);
  const [emailData, setEmailData] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [employeeStats, setEmployeeStats] = useState({});
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('lastMonth');

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    setLoading(true);
    try {
      // Get list of available CSV files
      const listResponse = await fetch('/api/list-csv-files');
      if (!listResponse.ok) {
        throw new Error('Failed to get file list');
      }
      
      const { files: csvFiles } = await listResponse.json();
      let allData = [];
      
      // Load each CSV file
      for (const fileInfo of csvFiles) {
        try {
          const response = await fetch(`/mails/${fileInfo.name}`);
          if (response.ok) {
            const csvText = await response.text();
            const parsed = parseCSV(csvText);
            const processed = processEmailData(parsed);
            allData = [...allData, ...processed];
          }
        } catch (error) {
          console.warn(`Failed to load ${fileInfo.name}:`, error);
        }
      }
      
      // Remove duplicates and sort by timestamp
      const uniqueData = allData
        .filter((email, index, arr) => 
          arr.findIndex(e => 
            e.timestamp.getTime() === email.timestamp.getTime() && 
            e.sender === email.sender
          ) === index
        )
        .sort((a, b) => a.timestamp - b.timestamp);
      
      setAllEmailData(uniqueData);
      applyTimeFilter(uniqueData, 'lastMonth');
      
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTimeFilter = (data, timeRange) => {
    let filteredData = data;
    const now = new Date();

    switch (timeRange) {
      case 'lastWeek':
        const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        filteredData = data.filter(email => email.timestamp >= weekAgo);
        break;
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredData = data.filter(email => email.timestamp >= startOfMonth);
        break;
      case 'lastMonth':
        const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        filteredData = data.filter(email => email.timestamp >= monthAgo);
        break;
      case 'last3Months':
        const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        filteredData = data.filter(email => email.timestamp >= threeMonthsAgo);
        break;
      case 'lastYear':
        const yearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        filteredData = data.filter(email => email.timestamp >= yearAgo);
        break;
      case 'all':
      default:
        filteredData = data;
        break;
    }

    setEmailData(filteredData);
    setHeatmapData(createHeatmapData(filteredData));
    setEmployeeStats(getEmployeeStats(filteredData));
    setFilteredEmployees([...new Set(filteredData.map(e => e.sender))]);
  };

  const handleTimeRangeChange = (timeRange) => {
    setSelectedTimeRange(timeRange);
    applyTimeFilter(allEmailData, timeRange);
  };

  const handleFilteredDataChange = (filteredData) => {
    setEmailData(filteredData);
    setHeatmapData(createHeatmapData(filteredData));
    setEmployeeStats(getEmployeeStats(filteredData));
    const availableEmployees = [...new Set(filteredData.map(e => e.sender))];
    setFilteredEmployees(prev => prev.filter(emp => availableEmployees.includes(emp)));
  };

  const handleEmployeeFilter = (employees) => {
    setFilteredEmployees(employees);
  };

  const handleUploadSuccess = (uploadResult) => {
    console.log('File uploaded successfully:', uploadResult.filename);
    loadEmailData();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <h2>Loading Email Analytics...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📧 Email Analytics Dashboard - CEO View</h1>
            <p>Track employee email patterns and productivity insights</p>
          </div>
          {session && (
            <div className="user-info">
              <span className="user-email">{session.user.email}</span>
              <button 
                onClick={() => signOut({ callbackUrl: '/mails/auth/signin' })}
                className="logout-btn"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="upload-section">
        <CsvUpload onUploadSuccess={handleUploadSuccess} />
      </div>

      <div className="filters-section">
        <TimeFilter 
          emailData={allEmailData}
          onFilteredDataChange={handleFilteredDataChange}
          selectedTimeRange={selectedTimeRange}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>

      <StatsPanel 
        stats={employeeStats} 
        emailData={emailData}
        filteredEmployees={filteredEmployees}
        onEmployeeFilter={handleEmployeeFilter}
      />

      <div className="main-content">
        <div className="heatmap-section">
          <h2>📊 Employee Email Activity Heatmap</h2>
          <HeatmapTable 
            heatmapData={heatmapData} 
            filteredEmployees={filteredEmployees}
          />
        </div>

        <Charts 
          emailData={emailData}
          employeeStats={employeeStats}
          filteredEmployees={filteredEmployees}
        />

        <div className="export-section">
          <ExportPanel 
            emailData={emailData}
            employeeStats={employeeStats}
            filteredEmployees={filteredEmployees}
          />
        </div>
      </div>
    </div>
  );
}