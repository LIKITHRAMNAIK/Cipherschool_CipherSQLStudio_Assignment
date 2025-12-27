const Assignment = require('../models/Assignment');
const { getHint } = require('../services/llmHintService');

const generateHint = async (req, res) => {
  try {
    const { assignmentId, userQuery, error } = req.body;

    if (!assignmentId || !userQuery) {
      return res.status(400).json({
        success: false,
        message: 'assignmentId and userQuery are required',
      });
    }

    if (!assignmentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format',
      });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    const schemaParts = assignment.sampleTables.map(table => {
      const columns = table.columns.map(col => `${col.columnName} (${col.dataType})`).join(', ');
      return `${table.tableName}: ${columns}`;
    });

    const schema = schemaParts.join('\n');

    const difficulty = assignment.description.includes('Easy') ? 'Easy' :
                      assignment.description.includes('Hard') ? 'Hard' : 'Medium';

    const hint = await getHint(
      assignment.question,
      schema,
      userQuery,
      error || null,
      difficulty
    );

    res.status(200).json({
      success: true,
      data: {
        hint,
      },
    });
  } catch (error) {
    if (error.message.includes('OpenAI API')) {
      return res.status(503).json({
        success: false,
        message: 'Hint service temporarily unavailable',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error generating hint',
      error: error.message,
    });
  }
};

module.exports = {
  generateHint,
};

