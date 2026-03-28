import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './UniversitySelection.css';

const UniversitySelection = () => {
  const [universities, setUniversities] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedUni, setSelectedUni] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Universities on Mount
  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const res = await api.getUniversities();
      if (res.success) {
        setUniversities(res.data || []);
      }
    } catch (err) {
      setError('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  // Mock fetching classes when university changes
  useEffect(() => {
    if (selectedUni) {
      setClasses([
        { id: 'c1', name: 'Class A' },
        { id: 'c2', name: 'Class B' },
        { id: 'c3', name: 'Class C' }
      ]);
      setSelectedClass('');
      setSelectedSubject('');
    } else {
      setClasses([]);
    }
  }, [selectedUni]);

  // Mock fetching subjects when class changes
  useEffect(() => {
    if (selectedClass) {
      setSubjects([
        { id: 's1', name: 'Mathematics' },
        { id: 's2', name: 'Science' },
        { id: 's3', name: 'History' }
      ]);
      setSelectedSubject('');
    } else {
      setSubjects([]);
    }
  }, [selectedClass]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUni || !selectedClass || !selectedSubject) {
      alert('Please complete all selections');
      return;
    }
    console.log('Final Selection:', { selectedUni, selectedClass, selectedSubject });
    alert(`Selection Confirmed: ${selectedUni} - ${selectedClass} - ${selectedSubject}`);
  };

  return (
    <div className="selection-container">
      <div className="selection-card">
        <h2 className="selection-title">System Configuration</h2>
        <p className="selection-subtitle">Please select the university and parameters to proceed.</p>

        {error && <div className="selection-error">{error}</div>}

        <form onSubmit={handleSubmit} className="selection-form">
          <div className="form-group">
            <label>University</label>
            <select 
              value={selectedUni} 
              onChange={(e) => setSelectedUni(e.target.value)}
              className="custom-select"
              disabled={loading}
            >
              <option value="">-- Choose University --</option>
              {universities.map(uni => (
                <option key={uni.universityCode} value={uni.universityCode}>
                  {uni.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Class Code</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="custom-select"
              disabled={!selectedUni}
            >
              <option value="">-- Choose Class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject Code</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="custom-select"
              disabled={!selectedClass}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={!selectedSubject}
          >
            {loading ? 'Processing...' : 'Confirm Selection'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UniversitySelection;
