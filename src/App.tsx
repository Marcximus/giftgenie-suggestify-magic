import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Routes } from './Routes';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes />
        <Toaster />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;