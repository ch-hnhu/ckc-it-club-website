import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 selection:text-blue-100 flex flex-col">
      {/* Fine grid pattern overlay for texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      <Navbar />
      
      <main className="flex-grow flex flex-col">
        <Hero />
        {/* Placeholder sections to demonstrate scrolling effect if needed */}
        {/* <div className="h-screen"></div> */} 
      </main>

      <Footer />
    </div>
  );
};

export default App;