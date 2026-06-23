
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Users,
  Shield,
  Zap,
  BarChart3
} from
  'lucide-react';
import { Button } from '../components/ui/Button';
import { ShaderAnimation } from '../components/ui/ShaderAnimation';
import { useScreenInit } from '../useScreenInit';
import { CircularTestimonials } from '../components/ui/circular-testimonials';
import { useTheme } from '../context/ThemeContext';
const fadeIn = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
};

export const Home = () => {
  useScreenInit();
  const { theme } = useTheme();
  const whyQuotaHireRef = useRef<HTMLElement>(null);
  const isWhyQuotaHireInView = useInView(whyQuotaHireRef, { amount: 0.3 });
  


  const getInTouchRef = useRef<HTMLElement>(null);
  const isGetInTouchInView = useInView(getInTouchRef, { amount: 0.3 });

  const howItWorksRef = useRef<HTMLElement>(null);
  const isHowItWorksInView = useInView(howItWorksRef, { amount: 0.3 });

  const readyToCrushRef = useRef<HTMLElement>(null);
  const isReadyToCrushInView = useInView(readyToCrushRef, { amount: 0.3 });
  const revenueRealityRef = useRef<HTMLElement>(null);
  const isRevenueRealityInView = useInView(revenueRealityRef, { amount: 0.3 });

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-950 relative">
      <ShaderAnimation isPaused={isWhyQuotaHireInView || isGetInTouchInView || isHowItWorksInView || isReadyToCrushInView || isRevenueRealityInView} />

      {/* Shader Animation Hero */}
      <section className="relative z-10 min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 text-center pt-20">
          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              duration: 1.5
            }}
            className="max-w-5xl mx-auto">

            <motion.span
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.6
              }}
              className="inline-block py-1.5 px-4 rounded-full bg-white/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-200 text-sm font-medium mb-8 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-sm">

              The Future Of Sales Recruting Globally
            </motion.span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-8 tracking-tighter text-neutral-900 dark:text-white drop-shadow-sm leading-tight">
              Hire the closers. <br />
              <span className="text-accent-600 dark:text-accent-400">
                Land the quota.
              </span>
            </h1>

            <motion.p
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.4,
                duration: 0.6
              }}
              className="text-lg md:text-xl text-neutral-700 dark:text-neutral-300 mb-10 max-w-2xl mx-auto drop-shadow-sm font-medium px-4">

              The curated network where elite sales talent meets high-growth companies. Skip the generic job boards.
            </motion.p>

            <motion.div
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.6,
                duration: 0.6
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4">

              <Link to="/signup?role=employee">
                <Button
                  size="lg"
                  rightIcon={<ArrowRight size={18} />}
                  className="w-full sm:w-auto shadow-elevated">

                  I am looking for job
                </Button>
              </Link>
              <Link to="/signup?role=company">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-sm">

                  I am hiring
                </Button>
              </Link>
            </motion.div>


          </motion.div>
        </div>
      </section>

      {/* The Revenue Reality Section - Polished Redesign */}
      <section ref={revenueRealityRef} className="py-24 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-30 dark:opacity-20 pointer-events-none">
          <div className="w-full max-w-4xl h-[400px] bg-accent-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        </div>

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-16">
            <span className="block text-accent-600 dark:text-accent-400 text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              The Revenue Reality
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-neutral-900 dark:text-white mb-6 tracking-tight">
              Aligning Sales Structure with Revenue Targets
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Whether you are advising a client, presenting a proposal, or reporting to the board, the core issue remains the same: scaling requires a systemic approach.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Consultant */}
            <div className="bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-elevated hover:border-accent-200/50 dark:hover:border-accent-800/50 transition-all duration-300">
              <div className="w-12 h-12 bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                Consultant Perspective
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                Direct & Professional
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                Inadequate revenue generation often stems from gaps in sales structure. Without a defined process for lead generation, qualification, conversion, and follow-up, even strong products struggle to convert interest into consistent income. Strengthening the sales framework is the most direct path to revenue stability.
              </p>
            </div>

            {/* Card 2: Client-Facing */}
            <div className="bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-elevated hover:border-accent-200/50 dark:hover:border-accent-800/50 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                Client Proposal
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                Softened & Solution-Oriented
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                Based on current performance, the primary constraint to revenue growth appears to be sales structure. Optimizing the sales system — from pipeline management to closing and retention — typically unlocks immediate revenue gains without increasing marketing spend. I recommend we audit and rebuild this structure to align with your revenue targets.
              </p>
            </div>

            {/* Card 3: Executive */}
            <div className="bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-elevated hover:border-accent-200/50 dark:hover:border-accent-800/50 transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                Board Report
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                Data-Driven & Concise
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                Revenue underperformance is attributable to structural deficiencies in the sales process. Key areas requiring intervention include lead flow, conversion benchmarks, and account management. Establishing a scalable sales structure will directly impact top-line revenue and forecast accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Block Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true
              }}
              variants={fadeIn}
              className="group bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-neutral-800/50 overflow-hidden shadow-elevated hover:shadow-[0_0_30px_rgba(217,104,32,0.15)] transition-all duration-300">

              <div className="h-64 overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}talent_realistic.jpg`}
                  alt="Sales professional working"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                  For Talent
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-lg">
                  Stop applying into the void. Get matched with companies that
                  value your track record and offer transparent compensation.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Direct access to hiring managers',
                    'Transparent salary and OTE ranges',
                    'No spam from third-party recruiters'].
                    map((item, i) =>
                      <li
                        key={i}
                        className="flex items-start gap-3 text-neutral-700 dark:text-neutral-300">

                        <CheckCircle2 className="w-5 h-5 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    )}
                </ul>
                <Link to="/signup?role=employee">
                  <Button rightIcon={<ArrowRight size={16} />}>
                    Build Your Profile
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true
              }}
              variants={fadeIn}
              className="group bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-neutral-800/50 overflow-hidden shadow-elevated hover:shadow-[0_0_30px_rgba(217,104,32,0.15)] transition-all duration-300">

              <div className="h-64 overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}company_realistic.jpg`}
                  alt="Hiring manager reviewing candidates"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                  For Companies
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-lg">
                  Access a curated pool of vetted, high-performing sales
                  professionals. Hire reps who actually hit their number.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Pre-vetted candidates with verified quota',
                    'Structured CVs for easy comparison',
                    'Reduce time-to-hire by 50%'].
                    map((item, i) =>
                      <li
                        key={i}
                        className="flex items-start gap-3 text-neutral-700 dark:text-neutral-300">

                        <CheckCircle2 className="w-5 h-5 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    )}
                </ul>
                <Link to="/signup?role=company">
                  <Button
                    variant="outline"
                    rightIcon={<ArrowRight size={16} />}>

                    Post a Role
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={howItWorksRef} className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xl md:text-2xl md:text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-6">
              How it works
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              A streamlined process designed to get you in front of the right
              people, faster.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-24 right-24 h-0.5 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700"></div>

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {[
                {
                  num: '01',
                  title: 'Build your profile',
                  desc: 'Highlight your sales achievements, deal sizes, and quota history.'
                },
                {
                  num: '02',
                  title: 'Get matched',
                  desc: 'Our algorithm connects you with roles that fit your specific experience.'
                },
                {
                  num: '03',
                  title: 'Land the role',
                  desc: 'Interview directly with hiring managers and negotiate your best comp.'
                }].
                map((step, i) =>
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{
                      once: true
                    }}
                    variants={fadeIn}
                    className="text-center">

                    <div className="w-24 h-24 mx-auto bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl rounded-full border border-white/20 dark:border-neutral-800/50 shadow-elevated flex items-center justify-center mb-6">
                      <span className="text-2xl font-display font-bold text-accent-600 dark:text-accent-400">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {step.desc}
                    </p>
                  </motion.div>
                )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section ref={whyQuotaHireRef} className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xl md:text-2xl md:text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-6">
              Why Quota Hire?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingUp className="w-5 h-5 text-accent-600" />,
                title: 'Performance-based matching',
                desc: 'We match based on verified quota attainment and deal sizes.'
              },
              {
                icon: <Zap className="w-5 h-5 text-accent-600" />,
                title: 'Instant CV generation',
                desc: 'Turn your raw numbers into a compelling sales resume instantly.'
              },
              {
                icon: <Shield className="w-5 h-5 text-accent-600" />,
                title: 'Vetted opportunities only',
                desc: 'Every company is screened for realistic quotas and product-market fit.'
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-accent-600" />,
                title: 'Salary transparency required',
                desc: 'No more guessing games. Base and OTE are listed upfront.'
              },
              {
                icon: <CheckCircle2 className="w-5 h-5 text-accent-600" />,
                title: 'No spam from recruiters',
                desc: 'Your inbox stays clean. Only hear from companies you express interest in.'
              },
              {
                icon: <Users className="w-5 h-5 text-accent-600" />,
                title: 'Built for sales professionals',
                desc: 'Designed specifically for the nuances of SDR, AE, and Leadership roles.'
              }].
              map((feature, i) =>
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true
                  }}
                  variants={fadeIn}
                  className="bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-neutral-800/50 hover:shadow-[0_0_30px_rgba(217,104,32,0.15)] hover:border-accent-300 dark:hover:border-accent-700 transition-all duration-300">

                  <div className="w-10 h-10 bg-accent-50 dark:bg-accent-900/30 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h4 className="text-lg font-display font-semibold text-neutral-900 dark:text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-24 relative overflow-hidden">

        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xl md:text-2xl md:text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-6">
              Don't just take our word for it
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              See what top sales professionals and hiring managers are saying about their experience with Quota Hire.
            </p>
          </div>

          <div className="flex justify-center">
            <CircularTestimonials
              testimonials={[
                {
                  quote: 'Closed my OTE within 60 days of starting. Quota Hire actually screened for the qualities that matter.',
                  name: 'Marcus Reed',
                  designation: 'Enterprise AE @ Northwind Cloud',
                  src: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&q=80'
                },
                {
                  quote: 'We hired three reps in a quarter — every one is in the top half of the team. Their vetting works.',
                  name: 'Priya Kapoor',
                  designation: 'VP Sales @ Helios SaaS',
                  src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80'
                },
                {
                  quote: 'The generated CV got me into rooms my old resume never did. The process was incredibly smooth.',
                  name: 'Jordan Chen',
                  designation: 'Senior SDR',
                  src: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80'
                }
              ]}
              autoplay={true}
              colors={theme === 'dark' ? {
                name: "#ffffff",
                designation: "#a1a1aa",
                testimony: "#e4e4e7",
                arrowBackground: "#27272a",
                arrowForeground: "#ffffff",
                arrowHoverBackground: "#4f46e5",
              } : {
                name: "#09090b",
                designation: "#52525b",
                testimony: "#27272a",
                arrowBackground: "#e4e4e7",
                arrowForeground: "#09090b",
                arrowHoverBackground: "#4f46e5",
              }}
              fontSizes={{
                name: "1.5rem",
                designation: "1rem",
                quote: "1.125rem",
              }}
            />
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section ref={readyToCrushRef} className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{
              opacity: 0,
              y: 30
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            className="max-w-3xl mx-auto">

            <h2 className="text-2xl md:text-xl md:text-2xl md:text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-6">
              Ready to crush your next quota?
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-10">
              Join thousands of top sales professionals and high-growth
              companies already on Quota Hire.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup?role=employee">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-accent-600 hover:bg-accent-500 text-white border-none">

                  I'm looking for a job
                </Button>
              </Link>
              <Link to="/signup?role=company">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-neutral-700 text-white hover:bg-neutral-800">

                  I'm hiring sales talent
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* App Mockup & Download Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

            {/* Left: Mobile Phone Mockup */}
            <motion.div
              className="lg:w-1/2 w-full flex justify-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}>
              {/* Phone outer shell */}
              <div className="relative w-[280px] sm:w-[300px]">
                {/* Ambient glow */}
                <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-accent-500 scale-75 rounded-full" />

                {/* Phone frame */}
                <div className="relative bg-neutral-900 dark:bg-neutral-800 rounded-[44px] p-2.5 shadow-[0_40px_80px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10">

                  {/* Side buttons */}
                  <div className="absolute -left-[3px] top-24 w-[3px] h-8 bg-neutral-700 rounded-l-sm" />
                  <div className="absolute -left-[3px] top-36 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
                  <div className="absolute -left-[3px] top-52 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
                  <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-neutral-700 rounded-r-sm" />

                  {/* Screen — exact website dashboard light mode */}
                  <div className="rounded-[36px] overflow-hidden relative bg-white flex flex-col h-[550px]">

                    {/* Status bar */}
                    <div className="px-6 pt-4 pb-2 flex items-center justify-between relative bg-white z-20">
                      {/* Dynamic island */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-20 h-6 bg-black rounded-full z-10" />
                      <span className="text-neutral-900 text-xs font-semibold">9:41</span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-end gap-0.5 h-3">
                          {[1, 1.5, 2, 3].map((h, i) => (
                            <div key={i} className="w-0.5 bg-neutral-900 rounded-sm" style={{ height: `${h * 4}px` }} />
                          ))}
                        </div>
                        <div className="w-5 h-2.5 border border-neutral-900 rounded-sm flex items-center px-0.5">
                          <div className="h-1.5 bg-neutral-900 rounded-sm" style={{ width: '70%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-neutral-50 pb-20 custom-scrollbar relative z-10">
                      {/* App header (Navbar mobile) */}
                      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-warm-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">QH</div>
                           <span className="font-display font-bold text-neutral-900">Quota Hire</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">AJ</div>
                      </div>

                      {/* Dashboard Content */}
                      <div className="p-4 space-y-4">
                        {/* Welcome Banner */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500/10 via-white to-warm-500/10 border border-neutral-200 p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 bg-white/60 px-2 py-0.5 rounded-full border border-neutral-200/50">
                              <svg className="w-3 h-3 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                              My Dashboard
                            </span>
                          </div>
                          <h1 className="text-lg font-extrabold text-neutral-900 mb-1 leading-tight">
                            Ready to crush it, <span className="text-accent-600">Alex!</span>
                          </h1>
                          <p className="text-neutral-600 text-[10px] max-w-md">
                            You have <strong className="text-neutral-900">12 active applications</strong>.
                          </p>
                        </div>

                        {/* Stat Cards Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-sm hover:-translate-y-0.5 transition-transform">
                            <div className="w-8 h-8 rounded-xl bg-accent-50 flex items-center justify-center mb-2">
                              <svg className="w-4 h-4 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                            </div>
                            <p className="text-xl font-extrabold text-neutral-900">12</p>
                            <p className="text-[10px] font-semibold text-neutral-500">Active Applications</p>
                          </div>
                          <div className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-sm hover:-translate-y-0.5 transition-transform">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                            </div>
                            <p className="text-xl font-extrabold text-neutral-900">80%</p>
                            <p className="text-[10px] font-semibold text-neutral-500">Profile Score</p>
                          </div>
                        </div>

                        {/* Recent Applications */}
                        <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm">
                           <div className="flex justify-between items-center mb-3">
                             <h2 className="text-sm font-extrabold text-neutral-900">Recent Applications</h2>
                           </div>
                           <div className="space-y-2">
                             <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-neutral-50 hover:-translate-y-0.5 transition-transform shadow-sm">
                               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-100 to-warm-100 flex items-center justify-center text-accent-600 font-extrabold text-xs shadow-sm border border-white/50">S</div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-bold text-neutral-900 truncate">Sr. Account Exec</p>
                                 <p className="text-[9px] text-neutral-500 font-medium mt-0.5">Northwind Cloud</p>
                               </div>
                               <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-50 text-amber-700">Under Review</span>
                             </div>
                             <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-neutral-50 hover:-translate-y-0.5 transition-transform shadow-sm">
                               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-100 to-warm-100 flex items-center justify-center text-accent-600 font-extrabold text-xs shadow-sm border border-white/50">E</div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-bold text-neutral-900 truncate">Enterprise AE</p>
                                 <p className="text-[9px] text-neutral-500 font-medium mt-0.5">Helios SaaS</p>
                               </div>
                               <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-purple-50 text-purple-700">Interview</span>
                             </div>
                             <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-neutral-50 hover:-translate-y-0.5 transition-transform shadow-sm">
                               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-100 to-warm-100 flex items-center justify-center text-accent-600 font-extrabold text-xs shadow-sm border border-white/50">G</div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-bold text-neutral-900 truncate">Growth Marketer</p>
                                 <p className="text-[9px] text-neutral-500 font-medium mt-0.5">Ozone Apps</p>
                               </div>
                               <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-neutral-100 text-neutral-600">Applied</span>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom nav bar — exact mobile nav mimicking real app */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                      <div className="flex justify-around items-center px-2 py-3">
                        <div className="flex flex-col items-center text-accent-600 gap-1 cursor-pointer">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          <span className="text-[9px] font-bold">Dashboard</span>
                        </div>
                        <div className="flex flex-col items-center text-neutral-400 gap-1 cursor-pointer hover:text-neutral-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                          <span className="text-[9px] font-medium">Jobs</span>
                        </div>
                        <div className="flex flex-col items-center text-neutral-400 gap-1 cursor-pointer hover:text-neutral-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                          <span className="text-[9px] font-medium">Tracker</span>
                        </div>
                        <div className="flex flex-col items-center text-neutral-400 gap-1 cursor-pointer hover:text-neutral-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                          <span className="text-[9px] font-medium">Profile</span>
                        </div>
                      </div>
                      {/* Home indicator */}
                      <div className="pb-2 flex justify-center">
                        <div className="w-24 h-1.5 rounded-full bg-neutral-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Copy & Download Buttons */}
            <motion.div
              className="lg:w-1/2 w-full"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}>
              <span className="inline-block py-1 px-3 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs font-semibold uppercase tracking-wider mb-4">
                Mobile App
              </span>
              <h2 className="text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                Manage your career on the go.
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-10">
                Track applications, chat with hiring managers, and receive instant job alerts — all from your pocket. Your next quota-crushing role is one tap away.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Google Play Button */}
                <a
                  href="https://play.google.com"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-neutral-900 dark:bg-white/10 hover:bg-neutral-800 dark:hover:bg-white/20 border border-neutral-700 dark:border-white/20 text-white rounded-2xl px-6 py-4 transition-all duration-300 hover:shadow-[0_0_25px_rgba(217,104,32,0.2)] hover:border-accent-500/50">
                  <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.18 1.47C2.84 1.84 2.64 2.42 2.64 3.18V20.82C2.64 21.58 2.84 22.16 3.18 22.53L3.26 22.61L13.28 12.59V12.41L3.26 2.39L3.18 1.47Z" fill="#00D2FF"/>
                    <path d="M16.6 15.93L13.27 12.6V12.4L16.6 9.07L16.7 9.13L20.63 11.37C21.75 12.01 21.75 12.99 20.63 13.63L16.7 15.87L16.6 15.93Z" fill="#FFD700"/>
                    <path d="M16.7 15.87L13.27 12.5L3.18 22.53C3.54 22.92 4.12 22.97 4.76 22.62L16.7 15.87Z" fill="#FF3D00"/>
                    <path d="M16.7 9.13L4.76 2.38C4.12 2.03 3.54 2.08 3.18 2.47L13.27 12.5L16.7 9.13Z" fill="#00E676"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-neutral-400 dark:text-neutral-300 leading-none mb-0.5">Get it on</div>
                    <div className="text-base font-semibold text-white leading-tight">Google Play</div>
                  </div>
                </a>

                {/* App Store - Coming Soon */}
                <div className="relative flex items-center gap-4 bg-neutral-900/50 dark:bg-white/5 border border-neutral-700/50 dark:border-white/10 text-white/60 rounded-2xl px-6 py-4 cursor-not-allowed select-none">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-accent-600 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
                      Coming Soon
                    </span>
                  </div>
                  <svg className="w-8 h-8 flex-shrink-0 opacity-40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.78 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                  </svg>
                  <div className="text-left opacity-40">
                    <div className="text-xs leading-none mb-0.5">Download on the</div>
                    <div className="text-base font-semibold leading-tight">App Store</div>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm text-neutral-500 dark:text-neutral-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                Android app available now · iOS launching Q3 2025
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={getInTouchRef} className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xl md:text-2xl md:text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-6">
              Get in Touch
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Have questions about how Quota Hire can accelerate your hiring or job search? We're here to help.
            </p>
          </div>
          <div className="max-w-xl mx-auto bg-white/10 dark:bg-neutral-900/20 backdrop-blur-xl p-8 rounded-3xl border border-white/20 dark:border-neutral-800/50 shadow-elevated">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium text-neutral-900 dark:text-white">Name</label>
                  <input type="text" required className="w-full h-11 px-4 rounded-lg border border-white/20 dark:border-neutral-700/50 bg-white/20 dark:bg-neutral-950/40 backdrop-blur-sm focus:ring-2 focus:ring-accent-500 outline-none text-neutral-900 dark:text-white" />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium text-neutral-900 dark:text-white">Email</label>
                  <input type="email" required className="w-full h-11 px-4 rounded-lg border border-white/20 dark:border-neutral-700/50 bg-white/20 dark:bg-neutral-950/40 backdrop-blur-sm focus:ring-2 focus:ring-accent-500 outline-none text-neutral-900 dark:text-white" />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-neutral-900 dark:text-white">Message</label>
                <textarea required rows={4} className="w-full p-4 rounded-lg border border-white/20 dark:border-neutral-700/50 bg-white/20 dark:bg-neutral-950/40 backdrop-blur-sm focus:ring-2 focus:ring-accent-500 outline-none resize-none text-neutral-900 dark:text-white"></textarea>
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </div>
        </div>
      </section>
    </div>);

};