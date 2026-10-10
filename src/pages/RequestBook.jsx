import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { BookOpen, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RequestBook() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
    book_name: '',
    author: '',
    translator: '',
    publisher: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        user_name: user.user_metadata?.full_name || user.email || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error: insertError } = await supabase
        .from('book_requests')
        .insert([formData]);
        
      if (insertError) throw insertError;
      
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit your request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[60vh] flex items-center justify-center px-4"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-theme-light/30 p-10 rounded-2xl shadow-md text-center max-w-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h2 className="text-3xl font-serif text-theme-darkest mb-4">Request Received!</h2>
          <p className="text-theme-medium text-lg leading-relaxed mb-8">
            Thank you, {formData.user_name}! We have received your request for <span className="font-bold">"{formData.book_name}"</span>. We will try our best to source it for you and notify you at {formData.email}.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ user_name: '', email: '', book_name: '', author: '', translator: '', publisher: '' });
            }}
            className="bg-theme-deep text-white px-8 py-3 rounded-full font-bold tracking-wide hover:bg-theme-darkest transition-colors shadow-md cursor-pointer"
          >
            Submit Another Request
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-[70vh] flex items-center justify-center px-4"
    >
      <div className="w-full max-w-2xl relative">
        <div className="bg-white/90 backdrop-blur-xl border border-theme-light/30 p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden">
          
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-theme-light/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-theme-medium/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-theme-light/50 rounded-full flex items-center justify-center mx-auto mb-4 text-theme-deep border border-theme-medium/20 shadow-inner">
                <BookOpen size={32} />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-theme-darkest mb-3">Request a Book</h2>
              <p className="text-theme-medium text-sm md:text-base tracking-wide max-w-lg mx-auto">
                Can't find the book you're looking for? Let us know! Fill out the details below and we'll try to add it to our collection.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-900/10 border border-red-500/50 text-red-600 p-4 rounded-lg mb-8 text-sm text-center font-semibold">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-theme-medium mb-2">Your Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="user_name"
                    required
                    value={formData.user_name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-theme-medium mb-2">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-theme-medium mb-2">Book Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="book_name"
                  required
                  value={formData.book_name}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest"
                  placeholder="The Lord of the Rings"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-theme-medium mb-2">Author (Optional)</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest"
                    placeholder="J.R.R. Tolkien"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-theme-medium mb-2">Translator (Optional)</label>
                  <input
                    type="text"
                    name="translator"
                    value={formData.translator}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest"
                    placeholder="E.g. David Bellos"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-theme-medium mb-2">Publisher (Optional)</label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest"
                  placeholder="E.g. Penguin Books"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-theme-deep text-white font-bold tracking-wider uppercase py-4 rounded-xl hover:bg-theme-darkest hover:shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2 group cursor-pointer"
                >
                  <span className="relative z-10">{loading ? 'Submitting...' : 'Send Request'}</span>
                  {!loading && <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
