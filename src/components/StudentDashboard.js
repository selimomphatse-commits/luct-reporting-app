import React from 'react';

const StudentDashboard = () => {
  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Student Dashboard</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center py-5">
              <h3 className="text-muted">Student Portal</h3>
              <p className="text-muted">
                This section is for student monitoring and rating features.
                <br />
                Additional student-specific functionality can be implemented here.
              </p>
              <div className="mt-4">
                <button className="btn btn-primary me-2">View My Classes</button>
                <button className="btn btn-outline-primary">Rate Lectures</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;