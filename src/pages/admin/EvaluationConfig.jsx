import React, { useState, useMemo, useEffect } from 'react';
import { 
  Settings2, 
  BookOpen, 
  Target, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle,
  Search
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import api from '../../services/api';
import './EvaluationConfig.css';

const EvaluationConfig = () => {
  const classes = useClasses();
  const [subjectId, setSubjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Evaluation Rules State
  const [expectedPages, setExpectedPages] = useState(28);
  const [minPages, setMinPages] = useState(26);
  const [maxPages, setMaxPages] = useState(30);
  const [negativeMarking, setNegativeMarking] = useState(0);
  const [hasInternalChoices, setHasInternalChoices] = useState(false);
  const [hasCompulsoryQuestions, setHasCompulsoryQuestions] = useState(true);
  
  const [sections, setSections] = useState([]);

  const addSection = () => {
    const nextChar = String.fromCharCode(65 + sections.length);
    setSections([...sections, {
      id: `sec-${Date.now()}`,
      name: `Section ${nextChar}`,
      totalQuestions: 0,
      questionsToAttempt: 0,
      marksPerQuestion: 0,
      isCompulsory: true
    }]);
  };

  const updateSection = (id, updates) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    if (!classes.currentClass || !subjectId) {
      alert('Please select Class and Subject first.');
      return;
    }

    setIsSaving(true);
    try {
      const configData = {
        className: classes.currentClass,
        subjectCode: subjectId,
        expectedPages,
        minPages,
        maxPages,
        negativeMarking,
        hasInternalChoices,
        hasCompulsoryQuestions,
        sections
      };
      
      console.log('Saving Evaluation Config:', configData);
      await new Promise(resolve => setTimeout(resolve, 800));
      alert('Evaluation configuration updated successfully.');
    } catch (error) {
      alert('Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="eval-config-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Evaluation Configuration</h1>
          <p>Advanced rule engine for automated checking and integrity validation.</p>
        </div>
        
        <div className="paper-selector">
          <Search size={16} />
          <select 
            value={subjectId} 
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">Select Paper to Configure</option>
            {classes.availableSubjects.map(s => (
              <option key={s.subjectCode} value={s.subjectCode}>{s.subjectCode} - {s.subjectName}</option>
            ))}
          </select>
        </div>
      </header>

      {!subjectId ? (
        <div className="empty-selection-card">
          <div className="icon-wrapper">
            <Settings2 size={48} />
          </div>
          <h2>No Paper Selected</h2>
          <p>Please select a question paper from the dropdown above to start configuring evaluation rules.</p>
        </div>
      ) : (
        <div className="config-layout">
          <div className="main-content">
            {/* Section Details */}
            <section className="config-card blue-top">
              <div className="card-header">
                <div>
                  <h3><BookOpen size={18} /> Section Details</h3>
                  <p>Define hierarchical paper structure for granular reporting.</p>
                </div>
                <button className="btn-add-sm" onClick={addSection}>
                  <Plus size={14} /> Add Section
                </button>
              </div>

              <div className="sections-list mt-6">
                {sections.length === 0 ? (
                  <div className="empty-list-placeholder">
                    No sections defined yet. Add Section A to begin.
                  </div>
                ) : (
                  sections.map((sec, idx) => (
                    <div key={sec.id} className="section-config-row">
                      <div className="input-field name">
                        <label>Name</label>
                        <input type="text" value={sec.name} onChange={(e) => updateSection(sec.id, { name: e.target.value })} />
                      </div>
                      <div className="input-field">
                        <label>Total Qs</label>
                        <input type="number" value={sec.totalQuestions} onChange={(e) => updateSection(sec.id, { totalQuestions: e.target.value })} />
                      </div>
                      <div className="input-field">
                        <label>Attempt</label>
                        <input type="number" value={sec.questionsToAttempt} onChange={(e) => updateSection(sec.id, { questionsToAttempt: e.target.value })} />
                      </div>
                      <div className="input-field">
                        <label>Marks/Q</label>
                        <input type="number" value={sec.marksPerQuestion} onChange={(e) => updateSection(sec.id, { marksPerQuestion: e.target.value })} />
                      </div>
                      <div className="check-field">
                        <input 
                          type="checkbox" 
                          id={`comp-${sec.id}`}
                          checked={sec.isCompulsory} 
                          onChange={(e) => updateSection(sec.id, { isCompulsory: e.target.checked })} 
                        />
                        <label htmlFor={`comp-${sec.id}`}>Compulsory</label>
                      </div>
                      <button className="btn-remove" onClick={() => removeSection(sec.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Special Instructions */}
            <section className="config-card amber-top">
              <div className="card-header">
                <h3><ShieldAlert size={18} /> Special Instructions</h3>
              </div>
              
              <div className="instructions-grid mt-4">
                <div className="toggle-item">
                  <div className="info">
                    <strong>Internal Choices</strong>
                    <span>Enable alternative question selection</span>
                  </div>
                  <input type="checkbox" checked={hasInternalChoices} onChange={(e) => setHasInternalChoices(e.target.checked)} />
                </div>
                <div className="toggle-item">
                  <div className="info">
                    <strong>Compulsory Questions</strong>
                    <span>Manual override for attempted logic</span>
                  </div>
                  <input type="checkbox" checked={hasCompulsoryQuestions} onChange={(e) => setHasCompulsoryQuestions(e.target.checked)} />
                </div>
              </div>

              <div className="negative-marking-box mt-6">
                <div className="input-field">
                  <label>Negative Marking Per Question</label>
                  <input 
                    type="number" 
                    step="0.25" 
                    value={negativeMarking} 
                    onChange={(e) => setNegativeMarking(e.target.value)} 
                    placeholder="0.25"
                  />
                </div>
                <div className="info-tip">
                  <AlertCircle size={14} />
                  <p>Set negative marks as a positive value (e.g. 0.25). The system will subtract this from total for each incorrect answer.</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="side-content">
            {/* Answer Sheet Validation */}
            <section className="config-card emerald-top sticky">
              <div className="card-header">
                <h3><Target size={18} /> Answer Sheet Validation</h3>
              </div>
              <div className="tip-box">
                <p>Used for automated Missing/Extra page detection during processing.</p>
              </div>
              
              <div className="vertical-inputs mt-4">
                <div className="input-field">
                  <label>Expected Pages</label>
                  <input type="number" value={expectedPages} onChange={(e) => setExpectedPages(e.target.value)} />
                </div>
                <div className="input-field">
                  <label>Min Pages</label>
                  <input type="number" value={minPages} onChange={(e) => setMinPages(e.target.value)} />
                </div>
                <div className="input-field">
                  <label>Max Pages</label>
                  <input type="number" value={maxPages} onChange={(e) => setMaxPages(e.target.value)} />
                </div>
              </div>

              <div className="action-zone mt-8">
                <button 
                  className="btn-primary-large" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Updating...' : 'Save Config'}
                </button>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};

export default EvaluationConfig;
