import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useScreenInit } from '../useScreenInit';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShaderAnimation } from '../components/ui/ShaderAnimation';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export const About = () => {
  useScreenInit();

  return (
    <div className="flex flex-col min-h-screen relative">
      <ShaderAnimation isPaused={false} />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-24 min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
          <motion.div 
            initial="hidden" animate="visible" variants={fadeIn}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-200 text-sm font-medium mb-8 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-sm"
          >
            About Quota Hire
          </motion.div>
          <motion.h1 
            initial="hidden" animate="visible" variants={fadeIn}
            className="text-5xl sm:text-6xl md:text-7xl font-serif font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
          >
            Redefining How <br className="hidden md:block"/>
            <span className="text-accent-600 dark:text-accent-400">Sales Talent</span> is Hired.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto font-medium"
          >
            The exclusive network connecting elite, performance-verified sales professionals with high-growth companies. No noise, just closers.
          </motion.p>
        </div>
      </section>

      {/* Timeline Origin Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
            <span className="block text-accent-600 dark:text-accent-400 text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              Origin Story
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white">How It All Started</h2>
          </div>

          <div className="relative">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800 transform -translate-x-1/2"></div>

            <div className="space-y-24">
              {/* Milestone 1 */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 group">
                <div className="md:w-1/2 md:pr-16 text-right md:text-right text-left">
                  <div className="md:hidden block w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded-full flex items-center justify-center mb-4 font-bold">2023</div>
                  <h3 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white mb-4">The Broken System</h3>
                  <p className="text-lg text-neutral-600 dark:text-neutral-400">
                    We noticed that incredible sales professionals were struggling to find roles that matched their caliber, while companies were wasting millions on mis-hires. The traditional recruiting model was fundamentally broken, optimizing for quantity over quality.
                  </p>
                </div>
                <div className="hidden md:flex absolute left-1/2 w-12 h-12 bg-white dark:bg-neutral-900 border-4 border-accent-500 rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">2023</span>
                </div>
                <div className="md:w-1/2 md:pl-16 w-full">
                  <motion.img 
                    src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800" 
                    alt="The problem sketch" 
                    initial={{ filter: "grayscale(100%)", opacity: 0.8 }}
                    whileInView={{ filter: "grayscale(0%)", opacity: 1 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="rounded-2xl shadow-elevated transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  />
                </div>
              </div>

              {/* Milestone 2 */}
              <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12 group">
                <div className="md:w-1/2 md:pl-16 text-left">
                  <div className="md:hidden block w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded-full flex items-center justify-center mb-4 font-bold">2024</div>
                  <h3 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white mb-4">The Solution</h3>
                  <p className="text-lg text-neutral-600 dark:text-neutral-400">
                    We designed a platform that flipped the script. Instead of hiding data, we brought it to the forefront. We created a vetting process that verified past performance, ensuring that when an introduction is made, both parties are already aligned.
                  </p>
                </div>
                <div className="hidden md:flex absolute left-1/2 w-12 h-12 bg-white dark:bg-neutral-900 border-4 border-accent-500 rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">2024</span>
                </div>
                <div className="md:w-1/2 md:pr-16 w-full">
                  <motion.img 
                    src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800" 
                    alt="The solution sketch" 
                    initial={{ filter: "grayscale(100%)", opacity: 0.8 }}
                    whileInView={{ filter: "grayscale(0%)", opacity: 1 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="rounded-2xl shadow-elevated transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Milestone 3 */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 group">
                <div className="md:w-1/2 md:pr-16 text-right md:text-right text-left">
                  <div className="md:hidden block w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded-full flex items-center justify-center mb-4 font-bold">Now</div>
                  <h3 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white mb-4">The New Standard</h3>
                  <p className="text-lg text-neutral-600 dark:text-neutral-400">
                    Today, Quota Hire is the premier destination for elite sales talent. We've replaced the noise with signal, helping hundreds of companies build high-performing revenue teams efficiently and transparently.
                  </p>
                </div>
                <div className="hidden md:flex absolute left-1/2 w-12 h-12 bg-accent-500 border-4 border-white dark:border-neutral-900 rounded-full items-center justify-center transform -translate-x-1/2 shadow-[0_0_20px_rgba(21,117,10,0.5)] z-10">
                  <CheckCircle2 className="text-white w-6 h-6" />
                </div>
                <div className="md:w-1/2 md:pl-16 w-full">
                  <img 
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800" 
                    alt="The future sketch" 
                    className="rounded-2xl shadow-elevated transition-all duration-500"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Manifesto Section (Moved down & Restyled) */}
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-24">
            <span className="inline-block py-1.5 px-4 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-sm font-semibold uppercase tracking-[0.2em] mb-6">
              Our Manifesto
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 dark:text-white">What We Believe</h2>
          </div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid md:grid-cols-2 gap-8 md:pb-12"
          >
            {/* Card 1 */}
            <motion.div variants={fadeIn} className="bg-white/30 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 p-10 rounded-[2rem] shadow-soft hover:shadow-elevated hover:border-accent-200 dark:hover:border-accent-800/50 transition-all duration-300 group">
              <div className="text-7xl font-display font-black text-accent-100 dark:text-accent-900/30 mb-6 group-hover:text-accent-200 dark:group-hover:text-accent-800/60 transition-colors">01</div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white mb-4">Transparency is Non-Negotiable</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
                We believe candidates deserve to know the OTE, quota expectations, and product-market fit before the first interview. Hidden compensation is a relic of the past.
              </p>
            </motion.div>
            
            {/* Card 2 (Staggered down on desktop) */}
            <motion.div variants={fadeIn} className="bg-white/30 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 p-10 rounded-[2rem] shadow-soft hover:shadow-elevated hover:border-accent-200 dark:hover:border-accent-800/50 transition-all duration-300 group md:translate-y-16">
              <div className="text-7xl font-display font-black text-accent-100 dark:text-accent-900/30 mb-6 group-hover:text-accent-200 dark:group-hover:text-accent-800/60 transition-colors">02</div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white mb-4">Numbers Speak Louder</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
                Sales is a science. We value verifiable track records, W-2s, and club attainment over resume buzzwords and charismatic fluff. Performance is our currency.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div variants={fadeIn} className="bg-white/30 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 p-10 rounded-[2rem] shadow-soft hover:shadow-elevated hover:border-accent-200 dark:hover:border-accent-800/50 transition-all duration-300 group">
              <div className="text-7xl font-display font-black text-accent-100 dark:text-accent-900/30 mb-6 group-hover:text-accent-200 dark:group-hover:text-accent-800/60 transition-colors">03</div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white mb-4">Eliminate the Middleman</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
                Third-party recruiters slow down the process and misalign incentives. We provide direct access between top-tier talent and hiring managers.
              </p>
            </motion.div>

            {/* Card 4 (Staggered down on desktop) */}
            <motion.div variants={fadeIn} className="bg-white/30 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 p-10 rounded-[2rem] shadow-soft hover:shadow-elevated hover:border-accent-200 dark:hover:border-accent-800/50 transition-all duration-300 group md:translate-y-16">
              <div className="text-7xl font-display font-black text-accent-100 dark:text-accent-900/30 mb-6 group-hover:text-accent-200 dark:group-hover:text-accent-800/60 transition-colors">04</div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white mb-4">Mutual Respect</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
                Companies respect talent by providing honest data. Talent respects companies by bringing verifiable excellence. We facilitate high-trust introductions.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 overflow-hidden mt-12 md:mt-24">
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-neutral-900 dark:text-white mb-8">Ready to Elevate Your Sales Career?</h2>
          <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl mx-auto">
            Join the exclusive network of top-tier sales professionals and high-growth companies today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup?role=employee">
              <Button size="lg" className="w-full sm:w-auto shadow-elevated">
                Apply as Talent
              </Button>
            </Link>
            <Link to="/signup?role=company">
              <Button variant="outline" size="lg" className="w-full sm:w-auto backdrop-blur-sm">
                Hire Talent
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};