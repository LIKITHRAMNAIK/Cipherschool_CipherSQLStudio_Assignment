import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import './AssignmentList.scss';

function AssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assignments');
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentClick = (id) => {
    navigate(`/assignment/${id}`);
  };

  if (loading) {
    return (
      <div className="assignment-list">
        <div className="assignment-list__header">
          <h2 className="assignment-list__heading">SQL Assignments</h2>
          <p className="assignment-list__subtitle">Select an assignment to begin practicing SQL queries</p>
        </div>
        <div className="assignment-list__loading">
          <div className="loading-spinner"></div>
          <p className="loading-spinner__text">Loading assignments...</p>
        </div>
        <div className="assignment-list__grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="assignment-card assignment-card--skeleton">
              <div className="assignment-card__header">
                <div className="assignment-card__title-skeleton"></div>
                <div className="assignment-card__difficulty-skeleton"></div>
              </div>
              <div className="assignment-card__description-skeleton"></div>
              <div className="assignment-card__description-skeleton"></div>
              <div className="assignment-card__footer">
                <div className="assignment-card__action-skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignment-list">
        <div className="assignment-list__header">
          <h2 className="assignment-list__heading">SQL Assignments</h2>
          <p className="assignment-list__subtitle">Select an assignment to begin practicing SQL queries</p>
        </div>
        <div className="assignment-list__error-state">
          <div className="error-state">
            <div className="error-state__icon">⚠️</div>
            <h3 className="error-state__title">Failed to Load Assignments</h3>
            <p className="error-state__message">
              {error && error.length > 200 ? `${error.substring(0, 200)}...` : error}
            </p>
            <button
              className="error-state__retry button-primary"
              onClick={fetchAssignments}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getDifficulty = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('easy')) return 'Easy';
    if (desc.includes('hard')) return 'Hard';
    if (desc.includes('medium')) return 'Medium';
    return 'Medium';
  };

  const getDifficultyClass = (difficulty) => {
    const diff = difficulty.toLowerCase();
    if (diff === 'easy') return 'assignment-card__difficulty--easy';
    if (diff === 'hard') return 'assignment-card__difficulty--hard';
    return 'assignment-card__difficulty--medium';
  };

  return (
    <div className="assignment-list">
      <div className="assignment-list__header">
        <h2 className="assignment-list__heading">SQL Assignments</h2>
        <p className="assignment-list__subtitle">Select an assignment to begin practicing SQL queries</p>
      </div>
      {assignments.length === 0 ? (
        <div className="assignment-list__empty-state">
          <div className="empty-state">
            <div className="empty-state__icon">📝</div>
            <h3 className="empty-state__title">No Assignments Available</h3>
            <p className="empty-state__message">
              There are no assignments available at the moment. Please check back later.
            </p>
          </div>
        </div>
      ) : (
        <div className="assignment-list__grid">
          {assignments.map((assignment) => {
            const difficulty = getDifficulty(assignment.description);
            return (
              <div
                key={assignment._id}
                className="assignment-card"
                onClick={() => handleAssignmentClick(assignment._id)}
              >
                <div className="assignment-card__header">
                  <h3 className="assignment-card__title">{assignment.title}</h3>
                  <span className={`assignment-card__difficulty ${getDifficultyClass(difficulty)}`}>
                    {difficulty}
                  </span>
                </div>
                <p className="assignment-card__description">{assignment.description}</p>
                <div className="assignment-card__footer">
                  <span className="assignment-card__action">Click to attempt →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AssignmentList;

