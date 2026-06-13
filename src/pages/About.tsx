import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, ArrowRight } from 'lucide-react';
import { useScreenInit } from '../useScreenInit';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShaderAnimation } from '../components/ui/ShaderAnimation';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const About = () => {
  useScreenInit();
  
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 relative">
      {/* Hero */}
      <section className="pt-32 pb-24 relative overflow-hidden bg-gradient-to-br from-accent-500/10 via-white to-warm-500/10 dark:from-accent-500/10 dark:via-neutral-900 dark:to-warm-500/10 border-b border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div 
            initial="hidden" animate="visible" variants={fadeIn}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-bold text-sm mb-6"
          >
            About Us
          </motion.div>
          <motion.h1 
            initial="hidden" animate="visible" variants={fadeIn}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-600 dark:from-white dark:via-neutral-200 dark:to-neutral-400 mb-6 pb-2 leading-tight"
          >
            We are redefining how <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-400">sales talent</span> is hired.
          </motion.h1>
          <motion.p 
            initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.2 } } }}
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
          >
            Quota Hire is the exclusive network connecting elite, performance-verified sales professionals with high-growth companies.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.6 } } }} className="mt-12 flex justify-center">
            <img src={`${import.meta.env.BASE_URL}images/about_illustration_nobg.png`} alt="Team collaboration" className="w-full max-w-md object-contain drop-shadow-2xl animate-float" />
          </motion.div>
        </div>
      </section>

      <div className="relative overflow-hidden">
        <ShaderAnimation isPaused={false} className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50 dark:opacity-60 dark:mix-blend-screen z-0" />

        {/* Story */}
        <section className="py-24 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 dark:text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-lg text-neutral-600 dark:text-neutral-400">
                <p>We built Quota Hire because the traditional recruiting model is broken for sales professionals.</p>
                <p>General job boards treat sales roles like any other position, focusing on keywords and job titles rather than the metrics that actually matter: quota attainment, deal sizes, and win rates.</p>
                <p>Meanwhile, third-party recruiters often spam candidates with irrelevant roles and hide compensation details until the final interview stages.</p>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="relative">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200" alt="Team meeting" className="rounded-2xl shadow-elevated" />
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-subtle border border-neutral-200 dark:border-neutral-800">
                <p className="text-xl md:text-2xl font-bold text-accent-600 dark:text-accent-400 mb-1">500+</p>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Companies Hiring</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 relative overflow-hidden bg-white/60 dark:bg-neutral-950/60 backdrop-blur-md border-y border-neutral-200 dark:border-neutral-800 z-10">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-neutral-900 dark:text-white">Our Core Values</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Target className="w-8 h-8 text-accent-500" />, title: 'Transparency', desc: 'Upfront salary, OTE, and realistic quotas. No hidden surprises.' },
              { icon: <TrendingUp className="w-8 h-8 text-accent-500" />, title: 'Performance', desc: 'We value track records over buzzwords. Numbers speak louder.' },
              { icon: <Users className="w-8 h-8 text-accent-500" />, title: 'Direct Access', desc: 'Eliminating the middleman to connect you straight to the source.' },
            ].map((v, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="mb-6">{v.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-neutral-900 dark:text-white">{v.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 dark:text-white mb-6">Join the revolution in sales hiring.</h2>
          <Link to="/signup?role=employee">
            <Button size="lg" rightIcon={<ArrowRight size={18} />}>Get Started Today</Button>
          </Link>
        </div>
      </section>
      </div>
    </div>
  );
};