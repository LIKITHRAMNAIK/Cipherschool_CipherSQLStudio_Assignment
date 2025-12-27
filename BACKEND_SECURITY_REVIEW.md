# Backend Security & Stability Review

## 🔴 CRITICAL ISSUES

### 1. SQL Injection Risk in Schema Name
**Location**: `controllers/queryController.js:21`
**Issue**: Using string interpolation for `SET search_path` instead of parameterized query
```javascript
await client.query(`SET search_path TO ${sanitizedSchema}`);
```
**Risk**: Even though schema is sanitized, PostgreSQL identifiers cannot be parameterized in the same way. However, the current sanitization may not be sufficient.
**Impact**: Potential SQL injection if sanitization is bypassed
**Recommendation**: 
- Add stricter schema name validation (alphanumeric + underscore only, length limits)
- Consider using `quote_ident()` PostgreSQL function
- Validate schema exists before use

### 2. Resource Leak on getClient() Failure
**Location**: `controllers/queryController.js:18`
**Issue**: If `getClient()` throws an error, the client is never acquired, but if it's acquired and then an error occurs before try block, client won't be released
**Current Code**:
```javascript
const client = await getClient(); // If this throws, no issue
try {
  // If error here, client is released in finally
} finally {
  client.release(); // If getClient() threw, client is undefined
}
```
**Impact**: Potential resource leak if getClient() succeeds but subsequent code fails
**Recommendation**: Wrap getClient() in try-catch or ensure client is always defined before release

### 3. Aggressive Process Exit on Pool Error
**Location**: `config/postgres.js:16`
**Issue**: `process.exit(-1)` on pool error kills entire application
**Impact**: Application crashes on any pool error, no graceful degradation
**Recommendation**: Log error and attempt reconnection instead of exiting

## 🟡 MEDIUM ISSUES

### 4. Inconsistent Error Response Format
**Location**: All controllers
**Issue**: Some error responses include `error.message`, others don't
- `assignmentController`: Includes `error.message` in 500 errors
- `hintController`: Includes `error.message` in 500/503 errors  
- `queryController`: Includes `error.message` in 400 errors
**Impact**: Inconsistent API responses make frontend error handling difficult
**Recommendation**: Standardize error response format across all controllers

### 5. Schema Name Validation Insufficient
**Location**: `controllers/queryController.js:3-5`
**Issue**: Only removes invalid characters, doesn't validate:
- Empty string after sanitization
- Maximum length
- Reserved PostgreSQL keywords
- Format validation (starts with letter/underscore)
**Impact**: Could allow invalid schema names or edge cases
**Recommendation**: Add comprehensive schema name validation

### 6. No Query Timeout
**Location**: `controllers/queryController.js:23`
**Issue**: No timeout for query execution
**Impact**: Long-running queries can block connections indefinitely
**Recommendation**: Add query timeout (e.g., 30 seconds)

### 7. No Result Size Limits
**Location**: `controllers/queryController.js:30`
**Issue**: No limit on number of rows returned
**Impact**: Large result sets can cause memory issues and slow responses
**Recommendation**: Add maximum row limit (e.g., 10,000 rows) with pagination

### 8. Error Information Leakage
**Location**: `controllers/queryController.js:44`
**Issue**: Returns full PostgreSQL error message to client
**Impact**: May expose database structure, table names, or internal errors
**Recommendation**: Sanitize error messages, return generic errors for production

### 9. No Connection Retry Logic
**Location**: `config/postgres.js`, `config/mongo.js`
**Issue**: No automatic reconnection on connection failure
**Impact**: Application fails permanently if database is temporarily unavailable
**Recommendation**: Implement exponential backoff retry logic

## 🟢 MINOR ISSUES

### 10. Missing Input Validation for Schema
**Location**: `controllers/queryController.js:10-15`
**Issue**: Only checks if schema exists, not if it's valid format
**Impact**: Could accept malformed schema names
**Recommendation**: Validate schema format before sanitization

### 11. No Rate Limiting
**Location**: All routes
**Issue**: No rate limiting on API endpoints
**Impact**: Vulnerable to DoS attacks or abuse
**Recommendation**: Add rate limiting middleware (e.g., express-rate-limit)

### 12. Health Check Doesn't Verify Databases
**Location**: `server.js:16-18`
**Issue**: Health check only returns static message
**Impact**: Doesn't verify actual database connectivity
**Recommendation**: Check both PostgreSQL and MongoDB connections in health endpoint

### 13. Missing Error Handling for client.release()
**Location**: `controllers/queryController.js:47`
**Issue**: If `client.release()` throws, error is not caught
**Impact**: Unhandled exception could crash request handler
**Recommendation**: Wrap release in try-catch

### 14. Inconsistent Status Codes
**Location**: Controllers
**Issue**: 
- `queryController`: Uses 400 for query errors (correct)
- `hintController`: Uses 503 for OpenAI errors (correct)
- But some validation errors could be 422 (Unprocessable Entity)
**Impact**: Minor - not critical but could be more RESTful
**Recommendation**: Use 422 for validation errors, 400 for bad requests

## ✅ SECURITY STRENGTHS

1. **SQL Validation Middleware**: Comprehensive validation blocks dangerous operations
2. **Schema Isolation**: Proper use of `SET search_path` for isolation
3. **Input Sanitization**: Schema names are sanitized
4. **MongoDB ID Validation**: Proper ObjectId format validation
5. **Error Boundaries**: Try-catch blocks in all controllers
6. **Connection Pooling**: Proper use of PostgreSQL connection pool

## ✅ STABILITY STRENGTHS

1. **Resource Management**: Client is properly released in finally block
2. **Error Handling**: All controllers have error handling
3. **Consistent Response Format**: All use `{ success, data/message }` structure
4. **Middleware Protection**: SQL validation middleware protects query endpoint
5. **Graceful Degradation**: Hint service handles OpenAI failures gracefully

## 📋 SUMMARY

### Critical Issues: 3
- SQL injection risk in schema name (needs immediate fix)
- Resource leak potential (needs fix)
- Aggressive process exit (needs fix)

### Medium Issues: 6
- Error response inconsistency
- Schema validation improvements
- Query timeout and result limits
- Error information leakage
- Connection retry logic
- Input validation

### Minor Issues: 4
- Rate limiting
- Health check improvements
- Error handling for release
- Status code consistency

### Overall Assessment
**Security**: 🟡 **MODERATE** - Good foundation but needs hardening
**Stability**: 🟡 **MODERATE** - Works but needs resilience improvements

**Priority Actions**:
1. Fix SQL injection risk in schema name (CRITICAL)
2. Add resource leak protection (CRITICAL)
3. Standardize error responses (MEDIUM)
4. Add query timeout and result limits (MEDIUM)
5. Improve error message sanitization (MEDIUM)

