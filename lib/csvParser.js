// Email data parser utilities
export function parseCSV(csvText) {
  // Handle spaced encoding (characters separated by spaces like "V i n i c i u s")
  const cleanText = csvText.replace(/(\s)([a-zA-Z0-9@._\-:\/\\#])\s/g, '$2');
  
  const lines = cleanText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function extractEmployeeFromEmail(email) {
  const match = email.match(/([^@]+)@wolthers\.com/);
  return match ? match[1] : null;
}

export function processEmailData(rawData) {
  return rawData.map(row => {
    const timestamp = new Date(row.origin_timestamp_utc);
    const sender = extractEmployeeFromEmail(row.sender_address);
    
    if (!sender) return null;
    
    return {
      timestamp,
      sender,
      hour: timestamp.getHours(),
      day: timestamp.getDay(),
      date: timestamp.toISOString().split('T')[0],
      subject: row.message_subject,
      bytes: parseInt(row.total_bytes) || 0,
      recipients: (row.recipient_status || '').split(';').length
    };
  }).filter(Boolean);
}

export function createHeatmapData(emailData) {
  const employees = [...new Set(emailData.map(e => e.sender))];
  const heatmapData = {};
  
  employees.forEach(emp => {
    heatmapData[emp] = {};
    for (let day = 0; day < 7; day++) {
      heatmapData[emp][day] = {};
      for (let hour = 0; hour < 24; hour++) {
        heatmapData[emp][day][hour] = 0;
      }
    }
  });
  
  emailData.forEach(email => {
    if (heatmapData[email.sender]) {
      heatmapData[email.sender][email.day][email.hour]++;
    }
  });
  
  return heatmapData;
}

export function getEmployeeStats(emailData) {
  const stats = {};
  
  emailData.forEach(email => {
    if (!stats[email.sender]) {
      stats[email.sender] = {
        totalEmails: 0,
        totalBytes: 0,
        peakHour: null,
        peakDay: null,
        firstEmail: email.timestamp,
        lastEmail: email.timestamp,
        hourlyDistribution: new Array(24).fill(0),
        dailyDistribution: new Array(7).fill(0)
      };
    }
    
    const emp = stats[email.sender];
    emp.totalEmails++;
    emp.totalBytes += email.bytes;
    emp.hourlyDistribution[email.hour]++;
    emp.dailyDistribution[email.day]++;
    
    if (email.timestamp < emp.firstEmail) emp.firstEmail = email.timestamp;
    if (email.timestamp > emp.lastEmail) emp.lastEmail = email.timestamp;
  });
  
  // Calculate peak times
  Object.keys(stats).forEach(emp => {
    const hourlyPeak = stats[emp].hourlyDistribution.indexOf(Math.max(...stats[emp].hourlyDistribution));
    const dailyPeak = stats[emp].dailyDistribution.indexOf(Math.max(...stats[emp].dailyDistribution));
    stats[emp].peakHour = hourlyPeak;
    stats[emp].peakDay = dailyPeak;
  });
  
  return stats;
}