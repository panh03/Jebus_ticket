import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Search from "./pages/Search";
import TripDetail from "./pages/TripDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/search" element={<Search />} />
      

        <Route path="/trip/:id" element={<TripDetail />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;