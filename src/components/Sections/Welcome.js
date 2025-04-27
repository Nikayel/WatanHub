import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { ChevronDown } from 'lucide-react';

const Welcome = () => {
  const particlesRef = useRef(null);
  const { user } = useAuth();

  // Interactive background effect
  useEffect(() => {
    if (!particlesRef.current) return;
    
    const canvas = particlesRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.7; // 70% of viewport height
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.size > 0.2) this.size -= 0.02;
        
        // Wrap around edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const createParticles = () => {
      const particleCount = Math.min(Math.floor(window.innerWidth / 10), 100);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };
    
    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - distance/1000})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      // Replace small particles
      particles = particles.filter(p => p.size > 0.2);
      if (particles.length < 50) createParticles();
      
      requestAnimationFrame(animateParticles);
    };
    
    createParticles();
    animateParticles();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <section className="welcome relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
      {/* Interactive particles background */}
      <canvas 
        ref={particlesRef} 
        className="absolute inset-0 w-full h-full opacity-60"
      />
      
      {/* Decorative waves */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="rgba(255,255,255,0.1)" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,122.7C384,117,480,75,576,74.7C672,75,768,117,864,144C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto -mt-12">
          <path fill="rgba(255,255,255,0.05)" fillOpacity="1" d="M0,192L48,208C96,224,192,256,288,240C384,224,480,160,576,165.3C672,171,768,245,864,272C960,299,1056,277,1152,250.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
      
      {/* Content container */}
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Logo icon */}
          <div className="mb-6 inline-block">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg border border-white border-opacity-20">
              <span className="text-4xl md:text-5xl font-bold">W</span>
            </div>
          </div>
          
          {/* Heading with animated gradient */}
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 md:mb-8 leading-tight"
          >
            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white animate-gradient-x">
              Welcome to Watan!
            </span>
          </motion.h1>
          
          {/* Tagline with staggered animation */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl max-w-3xl mx-auto mb-8 md:mb-10 font-light leading-relaxed"
          >
            Empowering Underrepresented Youth Through
            <span className="block mt-2 font-medium bg-gradient-to-r from-pink-200 to-indigo-200 bg-clip-text text-transparent">
              Community and Mentorship
            </span>
          </motion.p>
          
          {/* CTA Buttons */}
          {!user && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 md:mt-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 md:px-10 md:py-4 bg-white text-indigo-700 font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 md:px-10 md:py-4 border-2 border-white border-opacity-60 hover:border-opacity-100 font-semibold rounded-full backdrop-blur-sm transition-all duration-300"
            >
              Learn More
            </motion.button>
          </div>)}
          
          {/* Decorative badge */}
          <div className="hidden md:block absolute -right-12 top-8 rotate-12">
            <div className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-xs uppercase font-bold px-4 py-1 rounded-full shadow-lg">
              we are just getting started
            </div>
          </div>
          
          {/* Floating shapes decoration */}
          <div className="hidden lg:block absolute -left-16 bottom-20 opacity-50">
            <div className="w-24 h-24 rounded-full border-4 border-white border-opacity-20 animate-float-slow"></div>
          </div>
          <div className="hidden lg:block absolute right-10 bottom-40 opacity-30">
            <div className="w-16 h-16 rounded-lg border-4 border-white border-opacity-20 rotate-45 animate-float"></div>
          </div>
        </motion.div>
      </div>
      {/* Scroll Down Arrow */}
<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
  <button
    onClick={() => {
      const nextSection = document.getElementById('next-section');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }
    }}
    className="text-white opacity-70 hover:opacity-100 animate-bounce"
  >
    <ChevronDown size={40} />
  </button>
</div>

      
      {/* Stats section to be added in the future */}
      {/* <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto px-4 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20"
        >
          <div className="text-4xl font-bold mb-2">500+</div>
          <div className="text-sm uppercase tracking-wider">Mentors</div>
        </motion.div>
         */}
        {/* <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20"
        >
          <div className="text-4xl font-bold mb-2">5,000+</div>
          <div className="text-sm uppercase tracking-wider">Youth Empowered</div>
        </motion.div> */}
        
        {/* <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 sm:col-span-2 lg:col-span-1"
        >
          <div className="text-4xl font-bold mb-2">20+</div>
          <div className="text-sm uppercase tracking-wider">Communities</div>
        </motion.div>
      </div> */}
      
      {/* Add custom animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(45deg); }
          50% { transform: translateY(-20px) rotate(45deg); }
          100% { transform: translateY(0px) rotate(45deg); }
        }
        
        @keyframes float-slow {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default Welcome;