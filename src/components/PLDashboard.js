import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const PLDashboard = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { API_BASE_URL } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await axios.get(`${API_BASE_URL}/pl/reports`, { params });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(searchTerm);
  };

  const handleApproveReport = async (reportId) => {
    try {
      await axios.post(`${API_BASE_URL}/pl/reports/${reportId}/approve`);
      alert('Report approved successfully!');
      fetchReports();
    } catch (error) {
      alert('Error approving report: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/reports/export`, '_blank');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { class: 'bg-secondary', text: 'Submitted' },
      under_review: { class: 'bg-warning', text: 'Under Review' },
      approved: { class: 'bg-success', text: 'Approved' }
    };
    const config = statusConfig[status] || statusConfig.submitted;
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Program Leader Dashboard</h1>
        <div className="btn-toolbar mb-2 mb-md-0">
          <button 
            className="btn btn-sm btn-outline-success"
            onClick={handleExportExcel}
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">All Reports</h5>
              <form className="d-flex" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="form-control form-control-sm me-2"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-sm btn-outline-primary">
                  Search
                </button>
              </form>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Lecturer</th>
                      <th>Class</th>
                      <th>Course</th>
                      <th>Week</th>
                      <th>Date</th>
                      <th>Students</th>
                      <th>Topic</th>
                      <th>Status</th>
                      <th>PRL Feedback</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td>{report.lecturer_name}</td>
                        <td>{report.class_name}</td>
                        <td>{report.course_name}</td>
                        <td>Week {report.week_of_reporting}</td>
                        <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                        <td>{report.actual_students_present}</td>
                        <td>
                          <small>{report.topic_taught.substring(0, 50)}...</small>
                        </td>
                        <td>{getStatusBadge(report.status)}</td>
                        <td>
                          {report.prl_feedback ? (
                            <small>{report.prl_feedback.substring(0, 50)}...</small>
                          ) : (
                            <span className="text-muted">No feedback</span>
                          )}
                        </td>
                        <td>
                          {report.status !== 'approved' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleApproveReport(report.id)}
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan="10" className="text-center text-muted py-4">
                          No reports found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PLDashboard;