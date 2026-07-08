import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Globe, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { useScreenInit } from '../useScreenInit';
import { ShaderAnimation } from '../components/ui/ShaderAnimation';

export const Contact = () => {
  useScreenInit();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Message sent! We will get back to you shortly.');
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 relative overflow-hidden">
      <ShaderAnimation isPaused={false} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            {/* 3D Illustration replacing the old icon and header */}
            <div className="max-w-[280px] sm:max-w-[320px] mx-auto mb-8 relative">
              <motion.img 
                src="/illustrations/contact_illustration.png" 
                alt="Contact Us 3D Illustration" 
                className="w-full h-auto object-contain drop-shadow-2xl"
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                whileHover={{ y: -8, rotate: 2, scale: 1.05 }}
              />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-neutral-900 dark:text-white mb-6">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-4">
              Have questions, feedback, or need assistance? Our global team is here to support you around the clock.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            
            {/* Contact Form with Landing Page's Glassy Design */}
            <motion.div 
              className="lg:col-span-3 bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/20 dark:border-neutral-800/50 shadow-elevated"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-sm font-medium text-neutral-900 dark:text-neutral-200">First Name</label>
                    <input type="text" required className="w-full h-11 px-4 rounded-lg border border-white/20 dark:border-neutral-700/50 bg-white/20 dark:bg-neutral-950/40 backdrop-blur-sm focus:ring-2 focus:ring-accent-500 outline-none text-neutral-900 dark:text-white transition-all placeholder:text-neutral-400" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-sm font-medium text-neutral-900 dark:text-neutral-200">Last Name</label>
                    <input type="text" required className="w-full h-11 px-4 rounded-lg border border-white/20 dark:border-neutral-700/50 bg-white/20 dark:bg-neutral-950/40 backdrop-blur-sm focus:ring-2 focus:ring-accent-500 outline-none text-neutral-900 dark:text-white transition-all placeholder:text-neutral-400" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-sm font-medium text-neutral-900 dark:text-neutral-200">Email Address</label>
                  <input type="email" required className="w-full h-11 px-4 rounded-lg border border-white/20 dark:border-neutral-700/50 bg-white/20 dark:bg-neutral-950/40 backdrop-blur-sm focus:ring-2 focus:ring-accent-500 outline-none text-neutral-900 dark:text-white transition-all placeholder:text-neutral-400" />
                </div>
                
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-sm font-medium text-neutral-900 dark:text-neutral-200">Subject</label>
                  <input type="text" required className="w-full h-11 px-4 rounded-lg border border-white/20 dark:border-neutral-700/50 bg-white/20 dark:bg-neutral-950/40 backdrop-blur-sm focus:ring-2 focus:ring-accent-500 outline-none text-neutral-900 dark:text-white transition-all placeholder:text-neutral-400" />
                </div>
                
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-sm font-medium text-neutral-900 dark:text-neutral-200">Message</label>
                  <textarea rows={6} required className="w-full px-4 py-3 rounded-lg border border-white/20 dark:border-neutral-700/50 bg-white/20 dark:bg-neutral-950/40 backdrop-blur-sm focus:ring-2 focus:ring-accent-500 outline-none text-neutral-900 dark:text-white transition-all resize-y placeholder:text-neutral-400" />
                </div>
                
                <Button type="submit" className="w-full h-12 shadow-elevated" isLoading={isLoading}>Send Message</Button>
              </form>
            </motion.div>

            {/* General Contact Info Sidebar */}
            <motion.div 
              className="lg:col-span-2 space-y-8 flex flex-col justify-between"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Connect Directly</h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Whether you're looking for help with hiring, enterprise pricing, or custom partnerships, reach out directly.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 bg-white/5 dark:bg-neutral-900/10 backdrop-blur-md rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50">
                    <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-400 mb-0.5">General & Support</h3>
                      <p className="font-bold text-neutral-900 dark:text-white text-base">support@quotahire.org</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-white/5 dark:bg-neutral-900/10 backdrop-blur-md rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50">
                    <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-400 mb-0.5">Partnerships</h3>
                      <p className="font-bold text-neutral-900 dark:text-white text-base">partnerships@quotahire.org</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Trust Badge or Office Hours */}
              <div className="p-6 bg-accent-600/5 rounded-3xl border border-accent-600/10 dark:border-accent-400/10 space-y-3">
                <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400 font-bold">
                  <Clock className="w-5 h-5" />
                  <span>Support Hours</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Our platform support is online 24/7. Account management and recruiting specialists are available Monday – Friday, 9:00 AM – 5:00 PM across all office timezones.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global Offices Section */}
      <section className="py-20 relative bg-neutral-50/50 dark:bg-neutral-900/20 border-t border-neutral-200/50 dark:border-neutral-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">
              Our Global Offices
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
              Visit one of our physical hubs or reach out to local representatives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* UK Office */}
            <motion.div 
              className="bg-white/5 dark:bg-neutral-900/10 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 hover:border-accent-500/50 transition-all duration-300 shadow-sm flex flex-col justify-between"
              whileHover={{ y: -6 }}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-accent-600 dark:text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-none mb-1">United Kingdom</h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">London Hub</span>
                  </div>
                </div>
                
                <div className="space-y-3.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <p className="leading-relaxed">
                    12 Broadgate<br/>London, EC2M 2QS<br/>United Kingdom
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-accent-500" />
                    <span>+44 (20) 7946 0192</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent-500" />
                    <span>support@quotahire.org</span>
                  </p>
                </div>
              </div>

              {/* Styled map */}
              <div className="w-full h-48 rounded-2xl overflow-hidden mt-6 border border-neutral-200/50 dark:border-neutral-800/50 relative">
                <iframe
                  title="London Office Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-0.086%2C51.517%2C-0.080%2C51.521&layer=mapnik&marker=51.519%2C-0.083"
                  className="w-full h-full border-0 grayscale dark:invert-[0.9] dark:hue-rotate-[180deg]"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Lekki Office */}
            <motion.div 
              className="bg-white/5 dark:bg-neutral-900/10 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 hover:border-accent-500/50 transition-all duration-300 shadow-sm flex flex-col justify-between"
              whileHover={{ y: -6 }}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-accent-600 dark:text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-none mb-1">Nigeria</h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Lagos Office</span>
                  </div>
                </div>
                
                <div className="space-y-3.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <p className="leading-relaxed">
                    Block 12, Plot 4<br/>Lekki Phase 1, Lagos<br/>Nigeria
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-accent-500" />
                    <span>+234 (1) 271 8900</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent-500" />
                    <span>support@quotahire.org</span>
                  </p>
                </div>
              </div>

              {/* Styled map */}
              <div className="w-full h-48 rounded-2xl overflow-hidden mt-6 border border-neutral-200/50 dark:border-neutral-800/50 relative">
                <iframe
                  title="Lagos Office Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=3.468%2C6.425%2C3.476%2C6.431&layer=mapnik&marker=6.428%2C3.472"
                  className="w-full h-full border-0 grayscale dark:invert-[0.9] dark:hue-rotate-[180deg]"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Ghana Office */}
            <motion.div 
              className="bg-white/5 dark:bg-neutral-900/10 backdrop-blur-md p-6 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 hover:border-accent-500/50 transition-all duration-300 shadow-sm flex flex-col justify-between"
              whileHover={{ y: -6 }}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-accent-600 dark:text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-none mb-1">Ghana</h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Accra Office</span>
                  </div>
                </div>
                
                <div className="space-y-3.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <p className="leading-relaxed">
                    Cantonments Road<br/>Accra<br/>Ghana
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-accent-500" />
                    <span>+233 (30) 276 5432</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent-500" />
                    <span>support@quotahire.org</span>
                  </p>
                </div>
              </div>

              {/* Styled map */}
              <div className="w-full h-48 rounded-2xl overflow-hidden mt-6 border border-neutral-200/50 dark:border-neutral-800/50 relative">
                <iframe
                  title="Accra Office Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-0.190%2C5.550%2C-0.182%2C5.558&layer=mapnik&marker=5.554%2C-0.186"
                  className="w-full h-full border-0 grayscale dark:invert-[0.9] dark:hue-rotate-[180deg]"
                  loading="lazy"
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
};