const { getClient } = require('../config/postgres');

const sanitizeSchemaName = (schemaName) => {
  return schemaName.replace(/[^a-zA-Z0-9_]/g, '');
};

const executeQuery = async (req, res) => {
  const { sql, query, schema } = req.body;
  const sqlQuery = sql || query;

  if (!sqlQuery) {
    return res.status(400).json({
      success: false,
      message: 'SQL query is required. Use "sql" or "query" field in request body.',
    });
  }

  if (!schema) {
    return res.status(400).json({
      success: false,
      message: 'Schema is required',
    });
  }

  const sanitizedSchema = sanitizeSchemaName(schema);
  const client = await getClient();

  try {
    await client.query(`SET search_path TO ${sanitizedSchema}`);

    const result = await client.query(sqlQuery);

    const columns = result.fields.map(field => ({
      name: field.name,
      dataType: field.dataTypeID,
    }));

    const rows = result.rows;

    res.status(200).json({
      success: true,
      data: {
        columns,
        rows,
        rowCount: result.rowCount,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Query execution error',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  executeQuery,
};

