# CipherSQLStudio

A browser-based SQL learning platform where students can practice SQL queries against pre-configured assignments with real-time execution and intelligent hints.

## Problem Statement

Traditional SQL learning environments face several challenges:
- **Security Risk**: Allowing students to execute arbitrary SQL queries can expose or corrupt database data
- **Isolation**: Multiple students working simultaneously need isolated environments to prevent conflicts
- **Learning Support**: Students need guidance without being given complete solutions
- **Scalability**: Managing separate databases for each student is resource-intensive

CipherSQLStudio addresses these challenges by providing a secure, isolated, and guided SQL learning environment where students can practice safely while receiving intelligent hints that guide learning without revealing answers.

## Project Overview

CipherSQLStudio provides an interactive environment for learning SQL through hands-on practice. Students can:
- Browse available SQL assignments
- Write and execute SQL queries in a Monaco Editor
- View query results in real-time
- Get intelligent hints from an integrated LLM (without revealing solutions)
- Practice in isolated PostgreSQL schemas for safety

## Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: 
  - PostgreSQL (query execution sandbox)
  - MongoDB (assignments and user progress)
- **LLM Integration**: OpenAI API (for hint generation)
- **Key Libraries**: 
  - `express` - Web framework
  - `pg` - PostgreSQL client
  - `mongoose` - MongoDB ODM
  - `axios` - HTTP client for LLM API
  - `cors` - Cross-origin resource sharing
  - `dotenv` - Environment variables

### Frontend
- **Framework**: React.js with Vite
- **Routing**: React Router DOM
- **Editor**: Monaco Editor (VS Code editor)
- **Styling**: SCSS (mobile-first, responsive)
- **HTTP Client**: Axios
- **Key Libraries**:
  - `react` & `react-dom` - UI framework
  - `@monaco-editor/react` - SQL code editor
  - `sass` - SCSS preprocessor

## Setup Steps

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- MongoDB (local or Atlas)
- OpenAI API key (for hint generation)

### Backend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ciphersqlstudio_app
   DB_USER=postgres
   DB_PASSWORD=your_password
   MONGODB_URI=mongodb://localhost:27017/ciphersqlstudio
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Set up PostgreSQL**
   - Create database: `ciphersqlstudio_app`
   - Create schemas for each assignment (e.g., `workspace_assignment1`)
   - Pre-populate tables with sample data

4. **Set up MongoDB**
   - Create database: `ciphersqlstudio`
   - Pre-populate assignments collection

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

The frontend runs on `http://localhost:3000` and proxies API requests to `http://localhost:5000`.

## Environment Variables

### Backend (.env)
```env
PORT=5000                          # Server port
DB_HOST=localhost                  # PostgreSQL host
DB_PORT=5432                       # PostgreSQL port
DB_NAME=ciphersqlstudio_app        # PostgreSQL database name
DB_USER=postgres                   # PostgreSQL username
DB_PASSWORD=your_password          # PostgreSQL password
MONGODB_URI=mongodb://...          # MongoDB connection string
OPENAI_API_KEY=sk-...              # OpenAI API key
```

### Frontend
No environment variables required. API proxy is configured in `vite.config.js`.

## Data Flow

### Assignment Listing Flow
```
User → Frontend → GET /api/assignments → Backend → MongoDB
                ← Assignment List ← Backend ← MongoDB
```

### Query Execution Flow
```
User writes SQL → Frontend → POST /api/queries/execute
                              ↓
                    SQL Validation Middleware
                              ↓
                    PostgreSQL (isolated schema)
                              ↓
                    Results → Frontend → Display Table
```

### Hint Generation Flow
```
User clicks "Get Hint" → Frontend → POST /api/hint
                                      ↓
                            Fetch Assignment (MongoDB)
                                      ↓
                            Call OpenAI API
                                      ↓
                            Sanitize (remove SQL)
                                      ↓
                            Hint → Frontend → Display
```

### Complete User Journey
1. User visits homepage → Fetches assignments from MongoDB
2. User selects assignment → Fetches full assignment details
3. User writes SQL query → Validated on backend
4. User executes query → Runs in isolated PostgreSQL schema
5. Results displayed → Formatted table with columns and rows
6. User requests hint → LLM generates guidance (no SQL code)
7. User can retry → Process repeats

## Folder Structure

```
CipherSQLStudio/
├── config/                    # Database configurations
│   ├── mongo.js              # MongoDB connection
│   └── postgres.js           # PostgreSQL connection pool
├── controllers/              # Request handlers
│   ├── assignmentController.js
│   ├── hintController.js
│   └── queryController.js
├── middleware/               # Express middleware
│   └── sqlValidation.js      # SQL query validation
├── models/                   # Mongoose schemas
│   ├── Assignment.js
│   └── UserProgress.js
├── routes/                  # API routes
│   ├── assignments.js
│   ├── hints.js
│   └── queries.js
├── services/                # Business logic
│   └── llmHintService.js    # OpenAI integration
├── server.js                # Express app entry point
├── package.json
├── .env                     # Environment variables (not in git)
└── frontend/                # React application
    ├── src/
    │   ├── components/      # Reusable components
    │   │   ├── Layout/
    │   │   └── MonacoEditor/
    │   ├── pages/           # Page components
    │   │   ├── AssignmentList/
    │   │   └── AssignmentAttempt/
    │   ├── config/          # Configuration
    │   │   └── axios.js
    │   ├── styles/          # SCSS files
    │   │   ├── variables.scss
    │   │   ├── mixins.scss
    │   │   ├── states.scss
    │   │   ├── utilities.scss
    │   │   └── main.scss
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Key Features

### Security Architecture

#### Schema Sandboxing Strategy

**Why Schema Sandboxing?**
PostgreSQL schemas provide namespace isolation within a single database, offering several advantages over separate databases:

1. **Resource Efficiency**: Multiple schemas in one database consume fewer resources than multiple databases
2. **Simplified Management**: Easier to create, drop, and manage schemas programmatically
3. **Performance**: Faster schema switching using `SET search_path` compared to database connections
4. **Isolation**: Each schema acts as a separate namespace, preventing cross-assignment data access
5. **Scalability**: Can support hundreds of concurrent users without database connection overhead

**Implementation:**
- Each assignment uses a dedicated schema (e.g., `workspace_assignment123`)
- Schema name is sanitized to prevent SQL injection (alphanumeric + underscore only)
- `SET search_path TO schema_name` ensures queries only access tables within that schema
- Schema names are validated and sanitized before use

#### Security Enforcement Layers

**1. SQL Query Validation (Middleware)**
- **Query Type Restriction**: Only `SELECT` and `WITH` (CTE) queries allowed
- **Keyword Blocking**: Dangerous operations blocked (DROP, DELETE, UPDATE, INSERT, ALTER, CREATE, TRUNCATE, etc.)
- **Multiple Statement Prevention**: Blocks semicolon-separated multiple queries
- **System Schema Protection**: Blocks access to `pg_catalog`, `information_schema`, and `pg_*` system tables
- **Schema Escape Prevention**: Prevents schema-qualified table names (e.g., `public.users`)

**2. Schema Isolation**
- Schema names sanitized using regex: `/[^a-zA-Z0-9_]/g`
- Each query execution sets `search_path` to the assignment's schema
- No cross-schema access possible

**3. Error Message Sanitization**
- Database errors are caught and returned as generic messages
- Prevents exposure of database structure or internal errors

#### LLM Hint Restrictions

**Multi-Layer Protection Against Solution Leakage:**

**1. Prompt Engineering**
- System prompt explicitly forbids SQL code: "NEVER provide complete SQL queries or code solutions"
- Instructions emphasize conceptual hints only
- Difficulty-adaptive guidance (Easy/Medium/Hard) adjusts hint depth

**2. Backend Sanitization**
- LLM response checked for SQL keywords (SELECT, FROM, WHERE, JOIN, etc.)
- If SQL detected, response is replaced with generic guidance
- Code blocks (```sql...```) are removed

**3. Frontend Sanitization**
- Additional layer removes SQL keywords from hint text
- Filters out lines containing SQL syntax
- Removes backticks and code formatting
- Fallback message if sanitization removes all content

**Result**: Students receive conceptual guidance (e.g., "Consider which columns you need" or "Think about filtering conditions") without seeing actual SQL code or query structure.

### User Experience
- Monaco Editor with SQL syntax highlighting
- Real-time query execution
- Intelligent hints (conceptual guidance, no solutions)
- Responsive design (mobile-first)
- Loading, error, and empty states
- Touch-friendly UI (44px minimum touch targets)

### Architecture
- RESTful API design
- Separation of concerns (controllers, services, models)
- Middleware for validation
- Connection pooling for databases
- Error handling and logging

## API Endpoints

### Assignments
- `GET /api/assignments` - List all assignments
- `GET /api/assignments/:id` - Get assignment details

### Queries
- `POST /api/queries/execute` - Execute SQL query
  - Body: `{ sql: string, schema: string }`

### Hints
- `POST /api/hint` - Get intelligent hint
  - Body: `{ assignmentId: string, userQuery: string, error?: string }`

### Health
- `GET /health` - Server health check

## Development Notes

- Backend runs on port 5000
- Frontend runs on port 3000 (dev) with Vite
- PostgreSQL schemas should be pre-created for each assignment
- MongoDB collections should be pre-populated with assignments
- SCSS uses BEM naming convention
- Mobile-first responsive design (320px, 641px, 1024px, 1281px breakpoints)

## License

ISC

