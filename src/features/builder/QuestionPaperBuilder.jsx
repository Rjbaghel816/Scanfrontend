import React, { useState } from 'react';
import { Card } from '../../ui/Card';

export const QuestionPaperBuilder = ({ initialData = [], onSave }) => {
  const [sections, setSections] = useState(initialData);

  const addSection = () => {
    setSections([...sections, { id: Date.now(), title: 'New Section', questions: [] }]);
  };

  const addQuestion = (sectionId) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        return { 
          ...sec, 
          questions: [...sec.questions, { id: Date.now(), text: '', marks: '' }] 
        };
      }
      return sec;
    }));
  };

  const updateQuestion = (sectionId, questionId, field, value) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: sec.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
        };
      }
      return sec;
    }));
  };

  const updateSectionTitle = (sectionId, title) => {
    setSections(sections.map(sec => sec.id === sectionId ? { ...sec, title } : sec));
  };

  return (
    <Card title="Dynamic Question Paper Blueprint Builder">
      {sections.map(section => (
        <div key={section.id} className="mb-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900">
          <input 
            className="font-bold text-lg border-b mb-3 w-full focus:outline-none bg-transparent dark:text-white" 
            value={section.title} 
            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
            placeholder="Section Title (e.g., Section A)"
          />
          {section.questions.map((q, idx) => (
            <div key={q.id} className="flex gap-2 mb-2 items-center">
              <span className="text-gray-500 w-8">Q{idx + 1}.</span>
              <input 
                value={q.text}
                onChange={(e) => updateQuestion(section.id, q.id, 'text', e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-white" 
                placeholder="Question description..." 
              />
              <input 
                type="number" 
                value={q.marks}
                onChange={(e) => updateQuestion(section.id, q.id, 'marks', e.target.value)}
                className="w-20 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-white" 
                placeholder="Marks" 
              />
            </div>
          ))}
          <button onClick={() => addQuestion(section.id)} className="text-sm text-blue-500 hover:text-blue-700 mt-2 font-medium">+ Add Question</button>
        </div>
      ))}
      {sections.length === 0 && (
        <div className="text-center py-8 text-gray-500">No sections added yet. Start by creating a section.</div>
      )}
      <div className="flex justify-between mt-4 border-t pt-4">
        <button onClick={addSection} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">Add Section</button>
        <button onClick={() => onSave && onSave(sections)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow">Save Blueprint</button>
      </div>
    </Card>
  );
};
