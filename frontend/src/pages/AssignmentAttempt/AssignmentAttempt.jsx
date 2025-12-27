import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import MonacoEditor from '../../components/MonacoEditor/MonacoEditor';
import './AssignmentAttempt.scss';

function AssignmentAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [hint, setHint] = useState(null);
  const [hintError, setHintError] = useState(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assignments/${id}`);
      if (response.data.success) {
        setAssignment(response.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteQuery = async () => {
    const trimmedQuery = sqlQuery.trim();
    if (!trimmedQuery) {
      setQueryError('Please enter a SQL query');
      setQueryResult(null);
      return;
    }

    try {
      setExecuting(true);
      setQueryError(null);
      setQueryResult(null);
      setHint(null);

      const response = await api.post('/queries/execute', {
        sql: trimmedQuery,
        schema: `workspace_${id}`,
      });

      if (response.data && response.data.success) {
        setQueryResult(response.data.data);
      } else {
        setQueryError('Unexpected response from server');
      }
    } catch (err) {
      let errorMessage = 'Query execution failed';
      
      if (err.response) {
        const errorData = err.response.data || err.response;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setQueryError(errorMessage);
      setQueryResult(null);
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!executing && sqlQuery.trim()) {
        handleExecuteQuery();
      }
    }
  };

  const sanitizeHint = (hintText) => {
    if (!hintText) return hintText;
    
    const sqlCodeBlockPattern = /```[\s\S]*?```/gi;
    const sqlInlineCodePattern = /`[^`]+`/gi;
    const sqlKeywords = /\b(SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|HAVING|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|AS|ON|INNER|OUTER|LEFT|RIGHT|FULL|UNION|INTERSECT|EXCEPT)\b/gi;
    
    let sanitized = hintText;
    
    sanitized = sanitized.replace(sqlCodeBlockPattern, '[SQL code removed]');
    sanitized = sanitized.replace(sqlInlineCodePattern, '[code removed]');
    
    const lines = sanitized.split('\n');
    const filtered = lines.filter(line => {
      const upperLine = line.toUpperCase().trim();
      const hasSqlKeywords = sqlKeywords.test(upperLine);
      
      if (hasSqlKeywords) {
        return false;
      }
      
      if (upperLine.startsWith('SELECT') || 
          upperLine.startsWith('WITH') ||
          upperLine.startsWith('FROM') ||
          upperLine.startsWith('WHERE') ||
          upperLine.startsWith('JOIN')) {
        return false;
      }
      
      return true;
    });
    
    sanitized = filtered.join('\n').trim();
    
    sanitized = sanitized.replace(sqlKeywords, '');
    sanitized = sanitized.replace(/\s+/g, ' ');
    sanitized = sanitized.replace(/\s*,\s*/g, ', ');
    
    if (!sanitized || sanitized.length < 10) {
      return 'Think about the structure of your query. Consider what tables you need and how to filter or join them.';
    }
    
    return sanitized.trim();
  };

  const handleGetHint = async () => {
    const trimmedQuery = sqlQuery.trim();
    if (!trimmedQuery) {
      setHintError('Please enter a SQL query first');
      setHint(null);
      return;
    }

    try {
      setLoadingHint(true);
      setHint(null);
      setHintError(null);

      const response = await api.post('/hint', {
        assignmentId: id,
        userQuery: trimmedQuery,
        error: queryError || null,
      });

      if (response.data && response.data.success) {
        const hintText = response.data.data.hint;
        const sanitizedHint = sanitizeHint(hintText);
        setHint(sanitizedHint);
      } else {
        setHintError('Failed to get hint. Please try again.');
      }
    } catch (err) {
      let errorMessage = 'Failed to get hint';
      
      if (err.response) {
        const errorData = err.response.data || err.response;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setHintError(errorMessage);
      setHint(null);
    } finally {
      setLoadingHint(false);
    }
  };

  if (loading) {
    return (
      <div className="assignment-attempt">
        <div className="assignment-attempt__loading">
          <div className="loading-spinner"></div>
          <p className="loading-spinner__text">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="assignment-attempt">
        <button
          className="assignment-attempt__back"
          onClick={() => navigate('/')}
        >
          ← Back to Assignments
        </button>
        <div className="assignment-attempt__error-state">
          <div className="error-state">
            <div className="error-state__icon">⚠️</div>
            <h3 className="error-state__title">Failed to Load Assignment</h3>
            <p className="error-state__message">
              {error ? (error.length > 200 ? `${error.substring(0, 200)}...` : error) : 'Assignment not found. Please check the URL and try again.'}
            </p>
            <div className="error-state__actions">
              <button
                className="error-state__retry button-primary"
                onClick={fetchAssignment}
              >
                Try Again
              </button>
              <button
                className="error-state__back button-secondary"
                onClick={() => navigate('/')}
              >
                Back to Assignments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-attempt">
      <button
        className="assignment-attempt__back"
        onClick={() => navigate('/')}
      >
        ← Back to Assignments
      </button>

      <div className="assignment-attempt__header">
        <h2 className="assignment-attempt__title">{assignment.title}</h2>
        <p className="assignment-attempt__description">{assignment.description}</p>
      </div>

      <div className="assignment-attempt__question">
        <h3 className="assignment-attempt__question-title">Question</h3>
        <p className="assignment-attempt__question-text">{assignment.question}</p>
      </div>

      <div className="assignment-attempt__sample-data">
        <h3 className="assignment-attempt__section-title">Sample Data</h3>
        {assignment.sampleTables.map((table, index) => (
          <div key={index} className="sample-table">
            <h4 className="sample-table__name">{table.tableName}</h4>
            <div className="sample-table__schema">
              <div className="sample-table__columns-header">Columns:</div>
              <div className="sample-table__columns">
                {table.columns.map((col, colIndex) => (
                  <span key={colIndex} className="sample-table__column">
                    {col.columnName} <span className="sample-table__type">({col.dataType})</span>
                  </span>
                ))}
              </div>
            </div>
            {table.rows && table.rows.length > 0 && (
              <div className="sample-table__data">
                <div className="sample-table__data-header">Sample Rows:</div>
                <div className="sample-table__table-wrapper">
                  <table className="sample-table__table">
                    <thead>
                      <tr>
                        {table.columns.map((col, colIndex) => (
                          <th key={colIndex} className="sample-table__table-header">
                            {col.columnName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {table.columns.map((col, colIndex) => (
                            <td key={colIndex} className="sample-table__table-cell">
                              {row[col.columnName] !== null && row[col.columnName] !== undefined
                                ? String(row[col.columnName])
                                : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {table.rows.length > 5 && (
                    <p className="sample-table__more">
                      ... and {table.rows.length - 5} more row(s)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="assignment-attempt__editor">
        <div className="assignment-attempt__editor-header">
          <h3 className="assignment-attempt__section-title">SQL Editor</h3>
          <span className="assignment-attempt__editor-hint">
            Press Ctrl+Enter to execute
          </span>
        </div>
        <div 
          className="assignment-attempt__editor-wrapper"
          onKeyDown={handleKeyDown}
        >
          <MonacoEditor
            value={sqlQuery}
            onChange={(value) => {
              setSqlQuery(value || '');
              if (queryError) {
                setQueryError(null);
              }
            }}
            placeholder="Write your SQL query here..."
          />
        </div>
        <div className="assignment-attempt__actions">
          <button
            className="assignment-attempt__button assignment-attempt__button--primary"
            onClick={handleExecuteQuery}
            disabled={executing || !sqlQuery.trim()}
            type="button"
          >
            {executing ? (
              <>
                <span className="assignment-attempt__button-spinner"></span>
                Executing...
              </>
            ) : (
              'Execute Query'
            )}
          </button>
          <button
            className="assignment-attempt__button assignment-attempt__button--secondary"
            onClick={handleGetHint}
            disabled={loadingHint || executing || !sqlQuery.trim()}
            type="button"
          >
            {loadingHint ? (
              <>
                <span className="assignment-attempt__button-spinner"></span>
                Getting Hint...
              </>
            ) : (
              'Get Hint'
            )}
          </button>
        </div>
      </div>

      {hintError && (
        <div className="assignment-attempt__hint-error">
          <div className="assignment-attempt__hint-error-header">
            <h3 className="assignment-attempt__hint-error-title">Hint Error</h3>
            <button
              className="assignment-attempt__hint-error-close"
              onClick={() => setHintError(null)}
            >
              ×
            </button>
          </div>
          <p className="assignment-attempt__hint-error-text">{hintError}</p>
        </div>
      )}

      {hint && (
        <div className="assignment-attempt__hint">
          <div className="assignment-attempt__hint-header">
            <h3 className="assignment-attempt__section-title">Hint</h3>
            <button
              className="assignment-attempt__hint-close"
              onClick={() => setHint(null)}
            >
              ×
            </button>
          </div>
          <div className="assignment-attempt__hint-content">
            <p className="assignment-attempt__hint-text">{hint}</p>
          </div>
        </div>
      )}

      {queryError && (
        <div className="assignment-attempt__error-panel">
          <div className="assignment-attempt__error-header">
            <h3 className="assignment-attempt__error-title">Error</h3>
            <button
              className="assignment-attempt__error-close"
              onClick={() => setQueryError(null)}
            >
              ×
            </button>
          </div>
          <p className="assignment-attempt__error-text">
            {queryError && queryError.length > 300 ? `${queryError.substring(0, 300)}...` : queryError}
          </p>
        </div>
      )}

      {queryResult && (
        <div className="assignment-attempt__results">
          <div className="assignment-attempt__results-header">
            <h3 className="assignment-attempt__section-title">Results</h3>
            <span className="assignment-attempt__results-count">
              {queryResult.rowCount} row(s) returned
            </span>
          </div>
          <div className="results-table">
            {queryResult.rows.length === 0 ? (
              <div className="results-table__empty">
                <div className="empty-state">
                  <div className="empty-state__icon">📊</div>
                  <p className="empty-state__message">
                    Query executed successfully but returned no rows.
                  </p>
                </div>
              </div>
            ) : (
              <div className="results-table__wrapper">
                <table className="results-table__table">
                  <thead>
                    <tr>
                      {queryResult.columns.map((col, index) => (
                        <th key={index} className="results-table__header">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="results-table__row">
                        {queryResult.columns.map((col, colIndex) => (
                          <td key={colIndex} className="results-table__cell">
                            {row[col.name] !== null && row[col.name] !== undefined
                              ? String(row[col.name])
                              : <span className="results-table__null">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentAttempt;

