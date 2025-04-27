import { useState, useRef } from 'react';
import { Send, Loader2, CheckCircle, X } from 'lucide-react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [charCount, setCharCount] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const formRef = useRef(null);
  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001'
  : 'https://api.watanhub.com'; // 🛠 when I buy the domain

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'message') {
      setCharCount(value.length);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
  
    try {
      await new Promise(r => setTimeout(r, 900));
  
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
  
      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          setFormData({ name: '', email: '', message: '' });
          setCharCount(0);
          setStatus('idle');
        }, 4000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };
  

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);
  
  const getFieldClass = (field) => {
    let baseClass = "transition-all duration-300 border p-4 w-full rounded-lg outline-none";
    
    if (focusedField === field) {
      return `${baseClass} border-blue-400 shadow-md bg-blue-50`;
    }
    return `${baseClass} border-gray-300 focus:border-blue-400`;
  };

  const isFormValid = formData.name && formData.email && formData.message;

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden transform transition-all">
      {status === 'success' ? (
        <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 h-96">
          <CheckCircle size={64} className="text-green-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 text-center mb-6">Your message has been sent successfully. We'll get back to you soon!</p>
          <button 
            onClick={() => setStatus('idle')}
            className="bg-green-500 text-white py-2 px-6 rounded-full hover:bg-green-600 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Get In Touch</h2>
            <p className="text-gray-600">We'd love to hear from you!</p>
          </div>
          
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => handleFocus('name')}
              onBlur={handleBlur}
              className={getFieldClass('name')}
              required
            />
            <div className={`absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 ${focusedField === 'name' ? 'w-full' : 'w-0'}`}></div>
          </div>
          
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleFocus('email')}
              onBlur={handleBlur}
              className={getFieldClass('email')}
              required
            />
            <div className={`absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 ${focusedField === 'email' ? 'w-full' : 'w-0'}`}></div>
          </div>
          
          <div className="relative">
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              onFocus={() => handleFocus('message')}
              onBlur={handleBlur}
              className={`${getFieldClass('message')} resize-none`}
              rows="5"
              required
            ></textarea>
            <div className={`absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 ${focusedField === 'message' ? 'w-full' : 'w-0'}`}></div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {charCount} characters
            </div>
          </div>
          
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
              <X size={18} className="mr-2" />
              Unable to send message. Please try again.
            </div>
          )}
          
          <button
            type="submit"
            disabled={!isFormValid || status === 'submitting'}
            className={`w-full rounded-lg py-3 px-4 flex items-center justify-center font-medium transition-all duration-300 ${
              isFormValid && status !== 'submitting' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Send Message
              </>
            )}
          </button>
          
          <div className="text-center text-xs text-gray-500 mt-6">
            We respect your privacy and will never share your information.
          </div>
        </form>
      )}
    </div>
  );
}

export default ContactForm;