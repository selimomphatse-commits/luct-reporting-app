-- Create Database
CREATE DATABASE IF NOT EXISTS luct_reporting_db;
USE luct_reporting_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'lecturer', 'prl', 'pl') NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    total_registered_students INT NOT NULL,
    lecturer_id INT,
    venue VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_name VARCHAR(100) NOT NULL,
    class_id INT NOT NULL,
    week_of_reporting INT NOT NULL,
    date_of_lecture DATE NOT NULL,
    lecturer_id INT NOT NULL,
    actual_students_present INT NOT NULL,
    scheduled_lecture_time TIME NOT NULL,
    topic_taught TEXT NOT NULL,
    learning_outcomes TEXT NOT NULL,
    lecturer_recommendations TEXT,
    prl_feedback TEXT,
    status ENUM('submitted', 'under_review', 'approved') DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Demo Users (All passwords are 'password')
INSERT INTO users (username, password, role, name, email) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pl', 'System Administrator', 'admin@luct.ac.ls'),
('lecturer1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lecturer', 'Dr. John Smith', 'john.smith@luct.ac.ls'),
('lecturer2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lecturer', 'Prof. Sarah Johnson', 'sarah.j@luct.ac.ls'),
('prl1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'prl', 'Mr. David Brown', 'david.brown@luct.ac.ls'),
('prl2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'prl', 'Ms. Emily Wilson', 'emily.wilson@luct.ac.ls'),
('student1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Alice Johnson', 'alice.johnson@student.luct.ac.ls'),
('student2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Bob Miller', 'bob.miller@student.luct.ac.ls');

-- Insert Classes
INSERT INTO classes (class_name, course_name, course_code, total_registered_students, lecturer_id, venue) VALUES
('IT-1A', 'Web Application Development', 'DIWA2110', 45, 2, 'Computer Lab 101'),
('IT-1B', 'Database Systems', 'DBSY2101', 40, 2, 'Computer Lab 102'),
('IT-2A', 'Software Engineering', 'SFEN2201', 35, 2, 'Room 201'),
('BIT-1A', 'Business Information Systems', 'BUSS2101', 30, 3, 'Business Lab 1'),
('BIT-1B', 'Principles of Management', 'PMGT2102', 28, 3, 'Room 305'),
('BIT-2A', 'E-Commerce Systems', 'ECOM2201', 32, 3, 'Computer Lab 103'),
('DIT-1A', 'Networking Fundamentals', 'NETW2101', 25, 2, 'Network Lab'),
('DIT-1B', 'System Analysis & Design', 'SAND2102', 22, 3, 'Room 204');

-- Insert Sample Reports
INSERT INTO reports (faculty_name, class_id, week_of_reporting, date_of_lecture, lecturer_id, actual_students_present, scheduled_lecture_time, topic_taught, learning_outcomes, lecturer_recommendations, status) VALUES
('Faculty of Information Communication Technology', 1, 1, '2024-10-01', 2, 42, '08:00:00', 'Introduction to React and Components', 'Students should understand React components, JSX syntax, and basic state management', 'Need more practical examples for better understanding', 'submitted'),
('Faculty of Information Communication Technology', 2, 1, '2024-10-02', 2, 38, '10:00:00', 'Database Normalization and SQL Queries', 'Students should be able to normalize databases to 3NF and write complex SQL queries', 'Provide more exercises on JOIN operations', 'under_review'),
('Faculty of Information Communication Technology', 4, 1, '2024-10-03', 3, 28, '14:00:00', 'Business Process Modeling', 'Students should understand BPMN notation and create business process diagrams', 'Group projects helped students grasp concepts better', 'approved'),
('Faculty of Information Communication Technology', 1, 2, '2024-10-08', 2, 40, '08:00:00', 'React Hooks and State Management', 'Students should master useState, useEffect hooks and component lifecycle', 'Some students struggling with useEffect dependencies', 'submitted'),
('Faculty of Information Communication Technology', 5, 1, '2024-10-04', 3, 25, '16:00:00', 'Strategic Management Principles', 'Students should understand SWOT analysis and strategic planning frameworks', 'Case studies were very effective for learning', 'submitted');

-- Update some reports with PRL feedback
UPDATE reports SET prl_feedback = 'Good coverage of fundamentals. Consider adding more real-world examples in next session.', status = 'under_review' WHERE id = 1;
UPDATE reports SET prl_feedback = 'Excellent practical approach. Students engaged well with the material.', status = 'approved' WHERE id = 3;