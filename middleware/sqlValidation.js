const validateSQL = (req, res, next) => {
  const { sql, query } = req.body;
  const sqlQuery = sql || query;

  if (!sqlQuery || typeof sqlQuery !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'SQL query is required and must be a string. Use "sql" or "query" field in request body.',
    });
  }

  const trimmedSql = sqlQuery.trim();
  if (trimmedSql.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'SQL query cannot be empty',
    });
  }

  const semicolonCount = (trimmedSql.match(/;/g) || []).length;
  const lastSemicolonIndex = trimmedSql.lastIndexOf(';');
  const hasMultipleStatements = semicolonCount > 1 || (semicolonCount === 1 && lastSemicolonIndex < trimmedSql.length - 1);
  
  if (hasMultipleStatements) {
    return res.status(400).json({
      success: false,
      message: 'Multiple SQL statements are not allowed. Please execute one query at a time.',
    });
  }

  const upperSql = trimmedSql.toUpperCase();
  const normalizedSql = upperSql.replace(/\s+/g, ' ');

  const pgCatalogPattern = /\bpg_catalog\b/i;
  const informationSchemaPattern = /\binformation_schema\b/i;
  
  if (pgCatalogPattern.test(trimmedSql)) {
    return res.status(400).json({
      success: false,
      message: 'Access to pg_catalog system schema is not allowed. Please use only the tables provided in the assignment.',
    });
  }
  
  if (informationSchemaPattern.test(trimmedSql)) {
    return res.status(400).json({
      success: false,
      message: 'Access to information_schema system schema is not allowed. Please use only the tables provided in the assignment.',
    });
  }

  const forbiddenKeywords = [
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE',
    'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL',
    'MERGE', 'COPY', 'VACUUM', 'ANALYZE', 'REINDEX', 'CLUSTER'
  ];

  for (const keyword of forbiddenKeywords) {
    const keywordPattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (keywordPattern.test(trimmedSql)) {
      return res.status(400).json({
        success: false,
        message: `Query contains forbidden operation: ${keyword}. Only SELECT and WITH (CTE) queries are allowed.`,
      });
    }
  }

  const selectPattern = /^\s*SELECT/i;
  const withPattern = /^\s*WITH\s+/i;

  if (!selectPattern.test(trimmedSql) && !withPattern.test(trimmedSql)) {
    return res.status(400).json({
      success: false,
      message: 'Only SELECT and WITH (Common Table Expression) queries are allowed.',
    });
  }

  const schemaEscapePattern = /\./;
  const hasSchemaEscape = schemaEscapePattern.test(trimmedSql);
  
  if (hasSchemaEscape) {
    const tablePattern = /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*\.)+[a-zA-Z_][a-zA-Z0-9_]*/i;
    const joinPattern = /JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*\.)+[a-zA-Z_][a-zA-Z0-9_]*/i;
    
    if (tablePattern.test(trimmedSql) || joinPattern.test(trimmedSql)) {
      return res.status(400).json({
        success: false,
        message: 'Schema-qualified table names are not allowed. Use table names without schema prefix.',
      });
    }
  }

  const pgSystemTablePattern = /\bpg_[a-z_]+/i;
  if (pgSystemTablePattern.test(trimmedSql)) {
    return res.status(400).json({
      success: false,
      message: 'Access to PostgreSQL system tables (pg_*) is not allowed. Please use only the tables provided in the assignment.',
    });
  }

  const dangerousPatterns = [
    { pattern: /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE)/i, message: 'Query contains multiple statements with forbidden operations. Only single SELECT queries are allowed.' },
    { pattern: /UNION\s+ALL\s+SELECT/i, message: 'UNION ALL SELECT pattern is not allowed. Please use standard SELECT queries only.' },
  ];

  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(trimmedSql)) {
      return res.status(400).json({
        success: false,
        message: message,
      });
    }
  }

  next();
};

module.exports = validateSQL;

