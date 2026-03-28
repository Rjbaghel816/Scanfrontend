import React, { useState, useMemo, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Info, 
  AlertCircle,
  Plus,
  Layout,
  CheckCircle,
  Save,
  FileUp
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import api from '../../services/api';
import './PaperUploadPage.css';

const PaperUploadPage = () => {
  const classes = useClasses();
  const fileInputRefPaper = React.useRef(null);
  const fileInputRefTemplate = React.useRef(null);
  
  const [subjectId, setSubjectId] = useState('');
  const [examType, setExamType] = useState('Regular');
  const [totalMarks, setTotalMarks] = useState(100);
  const [minPassingMarks, setMinPassingMarks] = useState(33);
  
  const [totalQuestions, setTotalQuestions] = useState('');
  const [questionsToAttempt, setQuestionsToAttempt] = useState('');
  const [isEqualMarks, setIsEqualMarks] = useState(true);
  const [marksPerQuestion, setMarksPerQuestion] = useState('');
  const [isSectionalMode, setIsSectionalMode] = useState(false);
  const [sections, setSections] = useState([]);
  
  const [status, setStatus] = useState('draft');
  const [isSaving, setIsSaving] = useState(false);

  // New File States
  const [questionPaperFile, setQuestionPaperFile] = useState(null);
  const [answerTemplateFile, setAnswerTemplateFile] = useState(null);

  // Auto-calculation
  const passingPercentage = useMemo(() => {
    const total = Number(totalMarks);
    const min = Number(minPassingMarks);
    if (total <= 0) return 0;
    return Math.round((min / total) * 100);
  }, [minPassingMarks, totalMarks]);

  // Load existing config when subject changes
  useEffect(() => {
    if (classes.currentClass && subjectId) {
      const fetchConfig = async () => {
        try {
          const response = await api.getPaperConfig(classes.currentClass, subjectId);
          if (response.success && response.config) {
            const c = response.config;
            setExamType(c.examType || 'Regular');
            setTotalMarks(c.totalMarks || 100);
            setMinPassingMarks(c.minPassingMarks || 33);
            setIsSectionalMode(c.isSectionalMode || false);
            setSections(c.sections || []);
            setTotalQuestions(c.totalQuestions || '');
            setQuestionsToAttempt(c.questionsToAttempt || '');
            setIsEqualMarks(c.isEqualMarks !== undefined ? c.isEqualMarks : true);
            setMarksPerQuestion(c.marksPerQuestion || '');
            setStatus(c.status || 'draft');
          } else {
            // Reset to defaults if no config found
            setStatus('draft');
          }
        } catch (error) {
          console.error('Error fetching paper config:', error);
        }
      };
      fetchConfig();
    }
  }, [classes.currentClass, subjectId]);

  const addSection = () => {
    const nextChar = String.fromCharCode(65 + sections.length);
    const newSection = {
      id: `sec-${Date.now()}`,
      name: `Section ${nextChar}`,
      totalQuestions: 0,
      questionsToAttempt: 0,
      totalMarks: 0,
      marksPerQuestion: 0,
      isEqualMarks: true
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id, updates) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleSave = async (shouldUpload = false) => {
    if (!classes.currentClass || !subjectId) {
      alert('Please select Class and Subject');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('className', classes.currentClass);
      formData.append('subjectCode', subjectId);
      formData.append('examType', examType);
      formData.append('totalMarks', totalMarks);
      formData.append('minPassingMarks', minPassingMarks);
      formData.append('isSectionalMode', isSectionalMode);
      formData.append('sections', JSON.stringify(sections));
      formData.append('totalQuestions', totalQuestions);
      formData.append('questionsToAttempt', questionsToAttempt);
      formData.append('isEqualMarks', isEqualMarks);
      formData.append('marksPerQuestion', marksPerQuestion);
      formData.append('status', shouldUpload ? 'completed' : 'scheme_saved');

      // Append files if they exist
      if (questionPaperFile) {
        formData.append('questionPaper', questionPaperFile);
      }
      if (answerTemplateFile) {
        formData.append('answerTemplate', answerTemplateFile);
      }

      console.log('📤 Sending Paper Config FormData');
      
      const response = await api.savePaperConfig(formData);
      
      if (response.success) {
        setStatus(shouldUpload ? 'completed' : 'scheme_saved');
        alert(shouldUpload ? 'Paper configuration and files saved successfully.' : 'Marking scheme saved as draft.');
        // Clean up file state after successful upload
        setQuestionPaperFile(null);
        setAnswerTemplateFile(null);
      } else {
        throw new Error(response.message || 'Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(error.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="paper-upload-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Question Paper Configuration</h1>
          <p>Define paper structure, marks distribution and passing criteria.</p>
        </div>
        <div className={`status-badge ${status}`}>
          <div className="pulse-dot"></div>
          <span>{status === 'completed' ? 'Completed' : status === 'scheme_saved' ? 'Scheme Saved' : 'Draft'}</span>
        </div>
      </header>

      <div className="config-grid">
        <div className="main-config">
          {/* Basic Info */}
          <section className="config-card">
            <div className="card-header">
              <div className="accent blue"></div>
              <h3>Basic Information</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Class / Course</label>
                <select 
                  value={classes.currentClass} 
                  onChange={(e) => classes.changeClass(e.target.value)}
                >
                  <option value="">Select Class</option>
                  {classes.availableClasses.map(c => (
                    <option key={c.className} value={c.className}>{c.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select 
                  value={subjectId} 
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={!classes.currentClass || classes.currentClass === 'default'}
                >
                  <option value="">{classes.currentClass === 'default' ? 'Select Class First' : 'Select Subject'}</option>
                  {classes.availableSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row mt-4">
              <div className="form-group">
                <label>Exam Type</label>
                <select value={examType} onChange={(e) => setExamType(e.target.value)}>
                  {['Regular', 'Supplementary', 'Midterm', 'Final', 'Back'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Total Marks</label>
                <input 
                  type="number" 
                  value={totalMarks} 
                  onChange={(e) => setTotalMarks(e.target.value)} 
                />
              </div>
            </div>
          </section>

          {/* Passing Criteria */}
          <section className="config-card">
            <div className="card-header">
              <div className="accent green"></div>
              <h3>Passing Criteria</h3>
            </div>
            <div className="form-row align-end">
              <div className="form-group">
                <label>Minimum Passing Marks</label>
                <input 
                  type="number" 
                  value={minPassingMarks} 
                  onChange={(e) => setMinPassingMarks(e.target.value)} 
                />
              </div>
              <div className="stats-box green">
                <div className="stats-info">
                  <span className="label">Passing Percentage</span>
                  <span className="value">{passingPercentage}%</span>
                </div>
                <div className="progress-circle">
                  {passingPercentage}
                </div>
              </div>
            </div>
          </section>

          {/* Structure & Marking */}
          <section className="config-card">
            <div className="card-header">
              <div className="accent blue"></div>
              <h3>Structure & Marking Scheme</h3>
            </div>
            
            <div className="mode-toggle">
              <div className="toggle-info">
                <h4>Marking Structure Mode</h4>
                <p>Single flat list or multiple sections.</p>
              </div>
              <div className="toggle-buttons">
                <button 
                  className={!isSectionalMode ? 'active' : ''} 
                  onClick={() => setIsSectionalMode(false)}
                >
                  Single Section
                </button>
                <button 
                  className={isSectionalMode ? 'active' : ''} 
                  onClick={() => {
                    setIsSectionalMode(true);
                    if (sections.length === 0) addSection();
                  }}
                >
                  Multi-Section
                </button>
              </div>
            </div>

            {!isSectionalMode ? (
              <div className="single-section-config mt-6">
                <div className="form-row mb-4">
                  <div className="form-group">
                    <label>Total Questions</label>
                    <input type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Questions to Attempt</label>
                    <input type="number" value={questionsToAttempt} onChange={(e) => setQuestionsToAttempt(e.target.value)} />
                  </div>
                </div>
                <div className="equal-marks-check">
                  <p>Are all questions of equal marks?</p>
                  <div className="radio-group">
                    <label>
                      <input type="radio" checked={isEqualMarks} onChange={() => setIsEqualMarks(true)} />
                      <span>Yes, all equal</span>
                    </label>
                    <label>
                      <input type="radio" checked={!isEqualMarks} onChange={() => setIsEqualMarks(false)} />
                      <span>No, custom marks</span>
                    </label>
                  </div>
                </div>
                {isEqualMarks && (
                  <div className="form-group mt-4 animate-fade-in">
                    <label>Marks per Question</label>
                    <input type="number" value={marksPerQuestion} onChange={(e) => setMarksPerQuestion(e.target.value)} />
                    <small>Auto-calculated: {(totalMarks / (questionsToAttempt || 1)).toFixed(2)}</small>
                  </div>
                )}
              </div>
            ) : (
              <div className="multi-section-config mt-6">
                <div className="section-header">
                  <h4>Paper Sections</h4>
                  <button className="btn-add" onClick={addSection}>
                    <Plus size={16} /> Add Section
                  </button>
                </div>
                <div className="sections-list">
                  {sections.map((sec, idx) => (
                    <div key={sec.id} className="section-item">
                      <div className="section-item-header">
                        <input 
                          type="text" 
                          value={sec.name} 
                          onChange={(e) => updateSection(sec.id, { name: e.target.value })} 
                        />
                        <button className="btn-delete" onClick={() => removeSection(sec.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="form-row mt-2">
                        <div className="form-group">
                          <label>Questions</label>
                          <input 
                            type="number" 
                            value={sec.totalQuestions} 
                            onChange={(e) => updateSection(sec.id, { totalQuestions: e.target.value })} 
                          />
                        </div>
                        <div className="form-group">
                          <label>Attempt</label>
                          <input 
                            type="number" 
                            value={sec.questionsToAttempt} 
                            onChange={(e) => updateSection(sec.id, { questionsToAttempt: e.target.value })} 
                          />
                        </div>
                        <div className="form-group">
                          <label>Section Marks</label>
                          <input 
                            type="number" 
                            value={sec.totalMarks} 
                            onChange={(e) => updateSection(sec.id, { totalMarks: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="side-config">
          <section className="config-card sticky">
            <div className="card-header">
              <div className="accent blue"></div>
              <h3>Actions & Files</h3>
            </div>
            
            <div className="file-upload-zone">
              {/* Question Paper Input */}
              <input 
                type="file" 
                ref={fileInputRefPaper} 
                className="hidden" 
                style={{ display: 'none' }}
                accept=".pdf"
                onChange={(e) => setQuestionPaperFile(e.target.files[0])}
              />
              <div className={`upload-item ${questionPaperFile ? 'has-file' : ''}`}>
                <div className="upload-icon">
                  <FileUp size={20} />
                </div>
                <div className="upload-info">
                  <span>Question Paper PDF</span>
                  <button 
                    className="btn-link" 
                    onClick={() => fileInputRefPaper.current.click()}
                  >
                    {questionPaperFile ? questionPaperFile.name : 'Click to upload'}
                  </button>
                </div>
                {questionPaperFile && (
                  <button className="btn-clear" onClick={() => setQuestionPaperFile(null)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Answer Template Input */}
              <input 
                type="file" 
                ref={fileInputRefTemplate} 
                className="hidden" 
                style={{ display: 'none' }}
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setAnswerTemplateFile(e.target.files[0])}
              />
              <div className={`upload-item ${answerTemplateFile ? 'has-file' : ''}`}>
                <div className="upload-icon gray">
                  <Upload size={20} />
                </div>
                <div className="upload-info">
                  <span>Answer Template (Official Model Sheet)</span>
                  <button 
                    className="btn-link" 
                    onClick={() => fileInputRefTemplate.current.click()}
                  >
                    {answerTemplateFile ? answerTemplateFile.name : 'Click to upload'}
                  </button>
                </div>
                {answerTemplateFile && (
                  <button className="btn-clear" onClick={() => setAnswerTemplateFile(null)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="action-buttons mt-8">
              <button 
                className="btn-secondary" 
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                Save Scheme Only
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Upload Paper & Save'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};


export default PaperUploadPage;
