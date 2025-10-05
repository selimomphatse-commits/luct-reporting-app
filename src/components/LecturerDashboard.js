import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const LecturerDashboard = () => {
  const [activeTab, setActiveTab] = useState('reporting');
  const [classes, setClasses] = useState([]);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { API_BASE_URL } = useAuth();

  const [reportForm, setReportForm] = useState({
    faculty_name: 'Faculty of Information Communication Technology',
    class_id: '',
    week_of_reporting: '',
    date_of_lecture: '',
    actual_students_present: '',
    scheduled_lecture_time: '',
    topic_taught: '',
    learning_outcomes: '',
    lecturer_recommendations: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchReports();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lecturer/classes`);
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchReports = async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await axios.get(`${API_BASE_URL}/lecturer/reports`, { params });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(searchTerm);
  };

  const handleInputChange = (e) => {
    setReportForm({
      ...reportForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/lecturer/reports`, reportForm);
      alert('Report submitted successfully!');
      setReportForm({
        faculty_name: 'Faculty of Information Communication Technology',
        class_id: '',
        week_of_reporting: '',
        date_of_lecture: '',
        actual_students_present: '',
        scheduled_lecture_time: '',
        topic_taught: '',
        learning_outcomes: '',
        lecturer_recommendations: ''
      });
      fetchReports();
    } catch (error) {
      alert('Error submitting report: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
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
        <h1 className="h2">Lecturer Dashboard</h1>
        <div className="btn-toolbar mb-2 mb-md-0">
          <button 
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => setActiveTab('reporting')}
          >
            Submit Report
          </button>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setActiveTab('reports')}
          >
            View My Reports
          </button>
        </div>
      </div>

      {activeTab === 'reporting' && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Submit New Report</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmitReport}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Faculty Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="faculty_name"
                          value={reportForm.faculty_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select
                          className="form-select"
                          name="class_id"
                          value={reportForm.class_id}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Class</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.class_name} - {cls.course_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Week of Reporting</label>
                        <input
                          type="number"
                          className="form-control"
                          name="week_of_reporting"
                          value={reportForm.week_of_reporting}
                          onChange={handleInputChange}
                          min="1"
                          max="52"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Date of Lecture</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date_of_lecture"
                          value={reportForm.date_of_lecture}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Scheduled Time</label>
                        <input
                          type="time"
                          className="form-control"
                          name="scheduled_lecture_time"
                          value={reportForm.scheduled_lecture_time}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Actual Students Present</label>
                        <input
                          type="number"
                          className="form-control"
                          name="actual_students_present"
                          value={reportForm.actual_students_present}
                          onChange={handleInputChange}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Topic Taught</label>
                    <textarea
                      className="form-control"
                      name="topic_taught"
                      value={reportForm.topic_taught}
                      onChange={handleInputChange}
                      rows="3"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Learning Outcomes</label>
                    <textarea
                      className="form-control"
                      name="learning_outcomes"
                      value={reportForm.learning_outcomes}
                      onChange={handleInputChange}
                      rows="3"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Lecturer's Recommendations</label>
                    <textarea
                      className="form-control"
                      name="lecturer_recommendations"
                      value={reportForm.lecturer_recommendations}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">My Reports</h5>
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
                        <th>Class</th>
                        <th>Course</th>
                        <th>Week</th>
                        <th>Date</th>
                        <th>Students</th>
                        <th>Topic</th>
                        <th>Status</th>
                        <th>PRL Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(report => (
                        <tr key={report.id}>
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
                              <span className="text-muted">No feedback yet</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {reports.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">
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
      )}
    </div>
  );
};

export default LecturerDashboard;