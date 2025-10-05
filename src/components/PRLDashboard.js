import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const PRLDashboard = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedback, setFeedback] = useState('');
  const { API_BASE_URL } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await axios.get(`${API_BASE_URL}/prl/reports`, { params });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(searchTerm);
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/prl/reports/${selectedReport.id}/feedback`, {
        feedback
      });
      alert('Feedback added successfully!');
      setSelectedReport(null);
      setFeedback('');
      fetchReports();
    } catch (error) {
      alert('Error adding feedback: ' + (error.response?.data?.error || 'Unknown error'));
    }
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
        <h1 className="h2">Principal Lecturer Dashboard</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Reports for Review</h5>
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
                      <th>Topic</th>
                      <th>Status</th>
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
                        <td>
                          <small>{report.topic_taught.substring(0, 50)}...</small>
                        </td>
                        <td>{getStatusBadge(report.status)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setSelectedReport(report)}
                          >
                            Add Feedback
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No reports available for review
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

      {selectedReport && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Feedback for {selectedReport.lecturer_name}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setSelectedReport(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Report Details</label>
                  <div className="border p-2 bg-light rounded">
                    <strong>Topic:</strong> {selectedReport.topic_taught}<br/>
                    <strong>Learning Outcomes:</strong> {selectedReport.learning_outcomes}<br/>
                    <strong>Recommendations:</strong> {selectedReport.lecturer_recommendations}
                  </div>
                </div>
                <form onSubmit={handleAddFeedback}>
                  <div className="mb-3">
                    <label className="form-label">Your Feedback</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      required
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Submit Feedback
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setSelectedReport(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PRLDashboard;