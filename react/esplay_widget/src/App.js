import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WidgetPage from './components/WidgetPage';


// Set up routing for the app
function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/widget/:username" element={<WidgetPage />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
