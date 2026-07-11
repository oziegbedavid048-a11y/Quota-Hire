import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useScreenInit } from '../useScreenInit';
import { ShaderAnimation } from '../components/ui/ShaderAnimation';

export const Contact = () => {
  useScreenInit();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 relative overflow-hidden">
      <ShaderAnimation isPaused={false} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-8 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="relative z-10 overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500/10 via-white dark:via-neutral-900 to-warm-500/10 border border-neutral-100 dark:border-neutral-800 p-6 sm:p-10 md:p-12 shadow-sm text-center"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-warm-500/10 dark:bg-warm-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* 3D Illustration at the top of the layout container */}
              <div className="max-w-[200px] sm:max-w-[260px] md:max-w-[300px] mx-auto mb-6 sm:mb-8 relative">
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
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">
                Get in Touch
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
                Have questions, feedback, or need assistance? Our global team is here to support you around the clock.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 relative">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div 
            className="space-y-8 sm:space-y-10 text-center"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                Connect Directly
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
                Our support team is here to assist you with any questions, feedback, or technical issues you may experience. Please reach out to us directly at{' '}
                <a 
                  href="mailto:support@quotahire.org" 
                  className="text-accent-600 dark:text-accent-400 hover:underline font-bold transition-colors"
                >
                  support@quotahire.org
                </a>
                , and we will get back to you as soon as possible.
              </p>
            </div>


          </motion.div>
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
                    128 City Road<br/>London, EC1V 2NX<br/>United Kingdom
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
              <motion.div 
                initial={{ filter: "grayscale(100%)" }}
                whileInView={{ filter: "grayscale(0%)" }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="w-full h-48 rounded-2xl overflow-hidden mt-6 border border-neutral-200/50 dark:border-neutral-800/50 relative"
              >
                <iframe
                  title="London Office Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-0.095%2C51.522%2C-0.083%2C51.530&layer=mapnik&marker=51.5262%2C-0.0898"
                  className="w-full h-full border-0 dark:invert-[0.9] dark:hue-rotate-[180deg]"
                  loading="lazy"
                />
              </motion.div>
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
              <motion.div 
                initial={{ filter: "grayscale(100%)" }}
                whileInView={{ filter: "grayscale(0%)" }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="w-full h-48 rounded-2xl overflow-hidden mt-6 border border-neutral-200/50 dark:border-neutral-800/50 relative"
              >
                <iframe
                  title="Lagos Office Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=3.468%2C6.425%2C3.476%2C6.431&layer=mapnik&marker=6.428%2C3.472"
                  className="w-full h-full border-0 dark:invert-[0.9] dark:hue-rotate-[180deg]"
                  loading="lazy"
                />
              </motion.div>
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
              <motion.div 
                initial={{ filter: "grayscale(100%)" }}
                whileInView={{ filter: "grayscale(0%)" }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="w-full h-48 rounded-2xl overflow-hidden mt-6 border border-neutral-200/50 dark:border-neutral-800/50 relative"
              >
                <iframe
                  title="Accra Office Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-0.190%2C5.550%2C-0.182%2C5.558&layer=mapnik&marker=5.554%2C-0.186"
                  className="w-full h-full border-0 dark:invert-[0.9] dark:hue-rotate-[180deg]"
                  loading="lazy"
                />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
};