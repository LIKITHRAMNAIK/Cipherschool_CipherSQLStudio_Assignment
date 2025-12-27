import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import AssignmentList from './pages/AssignmentList/AssignmentList';
import AssignmentAttempt from './pages/AssignmentAttempt/AssignmentAttempt';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AssignmentList />} />
        <Route path="/assignment/:id" element={<AssignmentAttempt />} />
      </Routes>
    </Layout>
  );
}

export default App;

