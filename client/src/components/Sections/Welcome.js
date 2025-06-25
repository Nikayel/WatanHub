import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { ChevronDown, ArrowRight, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackgroundImage from '../../Homepageback.png';

const Welcome = ({ onScrollClick }) => {
  const particlesRef = useRef(null);
  const { user } = useAuth();

  // Enhanced interactive background effect - more subtle and performance optimized
  useEffect(() => {
    if (!particlesRef.current) return;

    const canvas = particlesRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

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
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.3 - 0.15;
        this.speedY = Math.random() * 0.3 - 0.15;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.05})`;
        this.life = Math.random() * 200 + 100;
        this.maxLife = this.life;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;

        // Fade out as life decreases
        const alpha = (this.life / this.maxLife) * 0.2;
        this.color = `rgba(255, 255, 255, ${Math.max(0.02, alpha)})`;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      isDead() {
        return this.life <= 0;
      }
    }

    const createParticles = () => {
      const particleCount = Math.min(Math.floor(window.innerWidth / 25), 60);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].isDead()) {
          particles.splice(i, 1);
        }
      }

      // Add new particles to maintain count
      while (particles.length < 40) {
        particles.push(new Particle());
      }

      animationId = requestAnimationFrame(animateParticles);
    };

    createParticles();
    animateParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <section
      id="welcome-section"
      className="welcome relative overflow-hidden h-screen flex items-center text-white"
      style={{
        backgroundImage: `url(${BackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: window.innerWidth > 768 ? 'fixed' : 'scroll'
      }}
    >
      {/* Enhanced overlay with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50" />

      {/* Particles background - more subtle */}
      <canvas
        ref={particlesRef}
        className="absolute inset-0 w-full h-full opacity-20"
      />

      {/* Content container */}
      <div className="container mx-auto px-4 py-20 relative z-30 h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Logo - cleaner design */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-12 inline-block"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto shadow-2xl border border-white/20">
              <span className="text-5xl md:text-6xl font-bold text-white">W</span>
            </div>
          </motion.div>

          {/* Main Heading - Apple-style typography */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight"
          >
            <span className="bg-gradient-to-r from-white via-white to-gray-100 bg-clip-text text-transparent">
              Welcome to WatanHub
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-xl md:text-2xl lg:text-3xl max-w-4xl mx-auto mb-12 font-medium leading-relaxed text-white/90"
          >
            Together we can make a difference
          </motion.p>

          {/* CTA Buttons - Apple-style design */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-16"
            >
              <Link to="/signup" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold text-lg rounded-2xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  <span>Sign In</span>
                </motion.button>
              </Link>
            </motion.div>
          )}

          {/* User greeting if logged in */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="mb-16 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 inline-block shadow-2xl"
            >
              <p className="text-xl font-medium text-white mb-4">
                Welcome back! Ready to continue your journey?
              </p>
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-white text-gray-900 font-semibold text-lg rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center mx-auto"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Scroll indicator - enhanced Apple-style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 cursor-pointer"
          onClick={onScrollClick}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors group"
          >
            <span className="text-sm mb-3 font-medium tracking-wide">Explore More</span>
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ChevronDown className="h-4 w-4" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient for seamless transition */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white/20 via-white/5 to-transparent pointer-events-none" />
    </section>
  );
};

export default Welcome;