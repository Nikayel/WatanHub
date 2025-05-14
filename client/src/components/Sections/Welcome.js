import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { ChevronDown, ArrowRight, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      canvas.height = window.innerHeight * (window.innerWidth < 640 ? 0.7 : 0.8);
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
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - distance / 1000})`;
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
    <section id="welcome-section" className="welcome relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white z-10">
      {/* Interactive particles background */}
      <canvas
        ref={particlesRef}
        className="absolute inset-0 w-full h-full opacity-60"
      />

      {/* Decorative waves with improved responsiveness */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="rgba(255,255,255,0.1)" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,122.7C384,117,480,75,576,74.7C672,75,768,117,864,144C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Content container with improved responsive padding */}
      <div className="container mx-auto px-4 py-16 sm:py-20 md:py-24 lg:py-28 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Logo icon with improved responsive sizing */}
          <div className="mb-6 inline-block">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg border border-white border-opacity-20">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold">W</span>
            </div>
          </div>

          {/* Heading with animated gradient and responsive sizing */}
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 leading-tight"
          >
            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white animate-gradient-x">
              Welcome to Watan!
            </span>
          </motion.h1>

          {/* Tagline with staggered animation and responsive text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-10 font-light leading-relaxed"
          >
            Empowering Underrepresented Youth Through
            <span className="block mt-2 font-medium bg-gradient-to-r from-pink-200 to-indigo-200 bg-clip-text text-transparent">
              Community and Mentorship
            </span>
          </motion.p>

          {/* CTA Buttons with responsive design and improved routing */}
          {!user && (
            <div className="flex flex-col xs:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 md:mt-10">
              <Link to="/signup" className="w-full xs:w-auto mb-3 xs:mb-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full xs:w-auto px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-white text-indigo-700 font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.button>
              </Link>
              <Link to="/login" className="w-full xs:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full xs:w-auto px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Sign In</span>
                </motion.button>
              </Link>
            </div>
          )}

          {/* User greeting if logged in */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl border border-white border-opacity-20 inline-block"
            >
              <p className="text-lg font-medium">Welcome back! Navigate to your dashboard to continue your journey.</p>
              <Link to="/dashboard">
                <button className="mt-4 px-6 py-2 bg-white text-indigo-700 font-bold rounded-full hover:shadow-lg transition-all duration-300 flex items-center mx-auto">
                  <span>Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            </motion.div>
          )}

          {/* Decorative elements - kept but with responsive adjustments */}
          <div className="hidden md:block absolute -right-12 top-8 rotate-12">
            <div className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-xs uppercase font-bold px-4 py-1 rounded-full shadow-lg">
              we are just getting started
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Down Arrow with improved positioning */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={() => {
            document.getElementById('blog-list')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-white opacity-70 hover:opacity-100 animate-bounce"
          aria-label="Scroll down"
        >
          <ChevronDown className="h-8 w-8 sm:h-10 sm:w-10" />
        </button>
      </div>

      {/* Add custom animations */}
      <style>{`
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
        
        @keyframes animate-gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Create custom breakpoint for extra small screens */
        @media (min-width: 480px) {
          .xs\\:w-auto {
            width: auto;
          }
          .xs\\:flex-row {
            flex-direction: row;
          }
          .xs\\:mb-0 {
            margin-bottom: 0;
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: animate-gradient-x 3s ease infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Welcome;