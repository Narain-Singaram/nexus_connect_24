import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import AddEditUser from './pages/AddEditUser';
import Map from './pages/Map';
import AI from './pages/AI';
import 'semantic-ui-css/semantic.min.css'

function App() {
  return (
    <BrowserRouter>
      <div data-theme="cupcake" className="App !bg-white">
      <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddEditUser />} />
          <Route path="/update/:id" element={<AddEditUser />} />
          <Route path="/map" element={<Map />} />
          <Route path="/ai" element={<AI />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;


<script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>
