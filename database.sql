CREATE DATABASE IF NOT EXISTS luct_reporting_db;
USE luct_reporting_db;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'lecturer', 'prl', 'pl') NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    total_registered_students INT NOT NULL,
    lecturer_id INT,
    venue VARCHAR(100),
    FOREIGN KEY (lecturer_id) REFERENCES users(id)
);

CREATE TABLE reports (
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
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (lecturer_id) REFERENCES users(id)
);

INSERT INTO users (username, password, role, name, email) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pl', 'System Admin', 'admin@luct.ac.ls'),
('lecturer1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lecturer', 'John Lecturer', 'john@luct.ac.ls'),
('prl1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'prl', 'Jane PRL', 'jane@luct.ac.ls'),
('student1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Bob Student', 'bob@student.luct.ac.ls');

INSERT INTO classes (class_name, course_name, course_code, total_registered_students, lecturer_id, venue) VALUES
('IT-1A', 'Web Application Development', 'DIWA2110', 45, 2, 'Lab 101'),
('IT-1B', 'Database Systems', 'DBSY2101', 40, 2, 'Lab 102'),
('BIT-1A', 'Business Systems', 'BUSS2101', 35, 2, 'Room 201');