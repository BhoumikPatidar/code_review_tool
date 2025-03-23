import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const StaticAnalysisReport = ({ prId }) => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await api.get(`/prs/${prId}/static-analysis`);
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, [prId]);

  return (
    <div>
      <h3>Static Analysis Report</h3>
      {reports.length > 0 ? (
        reports.map((report, index) => (
          <div key={index}>
            <strong>{report.tool}</strong>
            <pre>{report.result}</pre>
          </div>
        ))
      ) : (
        <p>No analysis reports yet</p>
      )}
    </div>
  );
};

export default StaticAnalysisReport;
