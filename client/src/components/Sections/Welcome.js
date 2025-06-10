import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { ChevronDown, ArrowRight, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackgroundImage from '../../Homepageback.png';

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
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.2) this.size -= 0.01;

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
      const particleCount = Math.min(Math.floor(window.innerWidth / 15), 80);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create subtle connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 - distance / 2000})`;
            ctx.lineWidth = 0.3;
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
      if (particles.length < 40) createParticles();

      requestAnimationFrame(animateParticles);
    };

    createParticles();
    animateParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <section
      id="welcome-section"
      className="welcome relative overflow-hidden min-h-screen flex items-center text-white z-10"
      style={{
        backgroundImage: `url(${BackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: window.innerWidth > 768 ? 'fixed' : 'scroll'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10" />

      {/* Interactive particles background - more subtle */}
      <canvas
        ref={particlesRef}
        className="absolute inset-0 w-full h-full opacity-30 z-20"
      />

      {/* Content container - full screen responsive */}
      <div className="container mx-auto px-4 py-16 sm:py-20 md:py-24 lg:py-32 relative z-30 min-h-screen flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-6xl mx-auto"
        >
          {/* Logo icon with improved responsive sizing */}
          <div className="mb-8 inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-2xl border border-white border-opacity-30">
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">W</span>
            </div>
          </div>

          {/* Main Heading */}
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight"
          >
            <span className="inline-block text-white drop-shadow-2xl">
              Welcome to WatanHub
            </span>
          </motion.h1>

          {/* Hero tagline - "Together we can make a difference" */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl max-w-3xl mx-auto mb-6 sm:mb-8 font-medium leading-relaxed text-white drop-shadow-xl"
          >
            Together we can make a difference
          </motion.p>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-6 sm:mb-8 font-light leading-relaxed text-white text-opacity-90 drop-shadow-lg"
          >
            {/* Empowering underrepresented youth through community and mentorship */}
          </motion.p>

          {/* CTA Buttons with responsive design and improved routing */}
          {!user && (
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <Link to="/signup" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3 bg-white text-indigo-700 font-semibold text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3 bg-transparent border-2 border-white text-white font-semibold text-base rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
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
              className="mt-8 p-4 bg-white bg-opacity-20 backdrop-blur-md rounded-xl border border-white border-opacity-30 inline-block shadow-xl"
            >
              <p className="text-lg font-medium text-white mb-3">Welcome back! Navigate to your dashboard to continue your journey.</p>
              <Link to="/dashboard">
                <button className="px-6 py-2.5 bg-white text-indigo-700 font-semibold text-base rounded-full hover:shadow-lg transition-all duration-300 flex items-center mx-auto">
                  <span>Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-white text-opacity-80"
          >
            <span className="text-sm mb-2 font-medium">Scroll to explore</span>
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced gradient overlay at bottom for smooth transition to next section */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent z-20" />
    </section>
  );
};

export default Welcome;