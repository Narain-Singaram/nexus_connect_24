import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import AddEditUser from './pages/AddEditUser';
import Map from './pages/Map';
import AI from './pages/AI';
import Help from './pages/Help';
import Graph from './pages/Graph';
import Sidebar from './components/sidebar.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
      <Sidebar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddEditUser />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/update/:id" element={<AddEditUser />} />
          <Route path="/map" element={<Map />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

<script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.4.1/flowbite.min.js"></script>
  