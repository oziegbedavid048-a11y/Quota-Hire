import { motion } from 'framer-motion';
import { Target, Settings, Users, Briefcase } from 'lucide-react';
import { useScreenInit } from '../useScreenInit';

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

export const Why = () => {
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
            Why Quotahire
          </motion.div>
          <motion.h1 
            initial="hidden" animate="visible" variants={fadeIn}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
          >
            Building Revenue Teams <br className="hidden md:block"/>
            <span className="text-accent-600 dark:text-accent-400">That Keep Businesses Alive</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto font-medium"
          >
            We don't just "give you staff". We give you a functioning revenue system with people, process, and accountability.
          </motion.p>
        </div>
      </section>

      {/* Problem & Vision - Alternating Layout */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-32">
            
            {/* The Problem */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 group">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="md:w-1/2 text-left md:pr-12"
              >
                <span className="text-accent-600 dark:text-accent-400 font-bold tracking-wide uppercase text-sm mb-4 block">The Challenge</span>
                <h3 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white mb-6 leading-tight">The Problem We Solve</h3>
                <div className="space-y-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  <p>
                    <strong className="text-neutral-900 dark:text-white">For Business Owners:</strong> 90% of Global SMEs die within 5 years. The #1 cause isn't bad products — it's lack of consistent revenue. Most founders are technicians, not salespeople. They can't afford a full HR team to recruit, train, and manage high-performing Sales & Marketing staff. Result: No pipeline, no cashflow, business shuts down.
                  </p>
                  <p>
                    <strong className="text-neutral-900 dark:text-white">For The Economy:</strong> Thousands of skilled Sales, Marketing, Finance, and Ops talents remain in obscurity. They have the ability to generate millions in revenue but lack visibility and structured opportunities. Talent waste = GDP waste.
                  </p>
                </div>
              </motion.div>
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="md:w-1/2 w-full"
              >
                <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800" alt="Business Struggle" className="w-full rounded-2xl shadow-elevated grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" />
              </motion.div>
            </div>

            {/* The Vision */}
            <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12 group">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="md:w-1/2 text-left md:pl-12"
              >
                <span className="text-accent-600 dark:text-accent-400 font-bold tracking-wide uppercase text-sm mb-4 block">The Solution</span>
                <h3 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white mb-6 leading-tight">The Quotahire Vision</h3>
                <div className="space-y-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  <p>
                    Businesses don't fail from lack of effort. They fail from lack of <strong className="text-neutral-900 dark:text-white">structured, revenue-generating teams</strong>.
                  </p>
                  <p>
                    Quotahire exists to establish, recruit, onboard, and manage Sales & Marketing engines for Global businesses. We turn "struggling businesses" into "revenue machines" by giving them the one thing they lack: people who sell, consistently.
                  </p>
                  <p className="font-medium text-accent-700 dark:text-accent-300">
                    When we fix revenue, businesses survive. When businesses survive, they hire more. When they hire more, talents get visible. That's the ecosystem we're building.
                  </p>
                </div>
              </motion.div>
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="md:w-1/2 w-full"
              >
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" alt="The Vision" className="w-full rounded-2xl shadow-elevated grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* What We Do - Staggered Cards (Like Manifesto) */}
      <section className="py-24 relative z-10 overflow-hidden bg-white/40 dark:bg-neutral-950/40 backdrop-blur-2xl border-y border-neutral-200/50 dark:border-neutral-800/50">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-24">
            <span className="inline-block py-1.5 px-4 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-sm font-semibold uppercase tracking-[0.2em] mb-6">
              Talent-as-a-Service
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white">What We Do For Businesses</h2>
          </div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid md:grid-cols-2 gap-8 md:pb-12"
          >
            {[
              { 
                num: "01",
                title: "Recruitment & Hiring", 
                desc: "We source, test, and deliver only pre-vetted Sales, Marketing, Finance & Ops talent. No more CV spam. You interview the top 3-5%.",
                icon: <Target className="w-8 h-8 text-accent-500 mb-6" />,
                offset: false
              },
              { 
                num: "02",
                title: "Onboarding & Structuring", 
                desc: "We set KPIs, commission plans, reporting systems, and sales playbooks from Day 1. Your new hire starts selling in Week 1, not Month 3.",
                icon: <Settings className="w-8 h-8 text-accent-500 mb-6" />,
                offset: true
              },
              { 
                num: "03",
                title: "Team Management", 
                desc: "We run weekly huddles, monthly performance reviews, and sales training. Underperformers get coached or replaced. Free replacement within 90 days.",
                icon: <Users className="w-8 h-8 text-accent-500 mb-6" />,
                offset: false
              },
              { 
                num: "04",
                title: "Revenue Outsourcing", 
                desc: "No HR department? We become it. We build and run your entire Sales/Marketing team as a managed service. You pay for results, not headaches.",
                icon: <Briefcase className="w-8 h-8 text-accent-500 mb-6" />,
                offset: true
              }
            ].map((service, i) => (
              <motion.div 
                key={i} 
                variants={fadeIn} 
                className={`bg-white/30 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 p-10 rounded-[2rem] shadow-soft hover:shadow-elevated hover:border-accent-200 dark:hover:border-accent-800/50 transition-all duration-300 group ${service.offset ? 'md:translate-y-16' : ''}`}
              >
                <div className="flex justify-between items-start">
                  {service.icon}
                  <div className="text-5xl font-display font-black text-accent-100 dark:text-accent-900/30 group-hover:text-accent-200 dark:group-hover:text-accent-800/60 transition-colors">{service.num}</div>
                </div>
                <h3 className="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-4">{service.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Onboarding Timeline Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
            <span className="block text-accent-600 dark:text-accent-400 text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              The Blueprint
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white">Our Staff Onboarding Process</h2>
          </div>

          <div className="relative">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800 transform -translate-x-1/2"></div>

            <div className="space-y-24">
              {/* Phase 1 */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 group">
                <div className="md:w-1/2 md:pr-16 text-left md:text-right">
                  <div className="md:hidden block w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded-full flex items-center justify-center mb-4 font-bold">P1</div>
                  <h3 className="text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">Phase 1: Pre-Boarding</h3>
                  <p className="text-accent-600 dark:text-accent-400 font-bold mb-4 tracking-wide uppercase text-sm">Days 0 to 5</p>
                  <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Quotahire handles contracts, NDAs, KYC, and KPI design. Employer sets up tools: CRM, email, WhatsApp Business. We align on targets before Day 1.
                  </p>
                </div>
                <div className="hidden md:flex absolute left-1/2 w-12 h-12 bg-white dark:bg-neutral-900 border-4 border-accent-500 rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">01</span>
                </div>
                <div className="md:w-1/2 md:pl-16 w-full">
                  <img 
                    src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800" 
                    alt="Phase 1: Pre-Boarding" 
                    className="w-full object-cover rounded-2xl shadow-elevated grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>

              {/* Phase 2 */}
              <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12 group">
                <div className="md:w-1/2 md:pl-16 text-left">
                  <div className="md:hidden block w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded-full flex items-center justify-center mb-4 font-bold">P2</div>
                  <h3 className="text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">Phase 2: Foundation</h3>
                  <p className="text-accent-600 dark:text-accent-400 font-bold mb-4 tracking-wide uppercase text-sm">Week 1</p>
                  <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Induction on products, pricing, ICP. Quotahire delivers Sales Playbook + script training. New hire shadows founder/team lead. Daily activity tracking starts: Calls, meetings, quotes.
                  </p>
                </div>
                <div className="hidden md:flex absolute left-1/2 w-12 h-12 bg-white dark:bg-neutral-900 border-4 border-accent-500 rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">02</span>
                </div>
                <div className="md:w-1/2 md:pr-16 w-full">
                  <img 
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" 
                    alt="Phase 2: Foundation" 
                    className="w-full object-cover rounded-2xl shadow-elevated grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>
              
              {/* Phase 3 */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 group">
                <div className="md:w-1/2 md:pr-16 text-left md:text-right">
                  <div className="md:hidden block w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded-full flex items-center justify-center mb-4 font-bold">P3</div>
                  <h3 className="text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">Phase 3: Ramp & Accountability</h3>
                  <p className="text-accent-600 dark:text-accent-400 font-bold mb-4 tracking-wide uppercase text-sm">Week 2-4</p>
                  <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Daily huddles. Weekly scorecards: Leads → Proposals → Closed → Collections. Quotahire runs mid-month coaching. 30-Day Probation Review with go/no-go decision.
                  </p>
                </div>
                <div className="hidden md:flex absolute left-1/2 w-12 h-12 bg-white dark:bg-neutral-900 border-4 border-accent-500 rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">03</span>
                </div>
                <div className="md:w-1/2 md:pl-16 w-full">
                  <img 
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800" 
                    alt="Phase 3: Ramp & Accountability" 
                    className="w-full object-cover rounded-2xl shadow-elevated grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>

              {/* Phase 4 */}
              <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12 group">
                <div className="md:w-1/2 md:pl-16 text-left">
                  <div className="md:hidden block w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded-full flex items-center justify-center mb-4 font-bold">P4</div>
                  <h3 className="text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">Phase 4: Scale</h3>
                  <p className="text-accent-600 dark:text-accent-400 font-bold mb-4 tracking-wide uppercase text-sm">Month 2+</p>
                  <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Monthly Business Reviews tied to revenue. Ongoing training on negotiation & upsell. Quotahire manages HR issues, motivation, and replacements to ensure zero downtime.
                  </p>
                </div>
                <div className="hidden md:flex absolute left-1/2 w-12 h-12 bg-accent-500 border-4 border-white dark:border-neutral-900 rounded-full items-center justify-center transform -translate-x-1/2 shadow-[0_0_20px_rgba(21,117,10,0.5)] z-10">
                  <Target className="text-white w-5 h-5" />
                </div>
                <div className="md:w-1/2 md:pr-16 w-full">
                  <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" 
                    alt="Phase 4: Scale" 
                    className="w-full object-cover rounded-2xl shadow-elevated grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Investment Case & Promise - Alternating Layout */}
      <section className="py-24 relative z-10 bg-white/40 dark:bg-neutral-950/40 backdrop-blur-2xl border-t border-neutral-200/50 dark:border-neutral-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-32">
            
            {/* The Investment Case */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 group">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="md:w-1/2 text-left md:pr-12"
              >
                <span className="text-accent-600 dark:text-accent-400 font-bold tracking-wide uppercase text-sm mb-4 block">ROI Focus</span>
                <h3 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white mb-8 leading-tight">The Investment Case</h3>
                <div className="space-y-8">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center flex-shrink-0 font-bold mt-1 text-sm shadow-sm">1</div>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      <strong className="text-neutral-900 dark:text-white">Cost of Empty Seat:</strong> 1 month without a salesperson = ₦2M+ in lost revenue. Quotahire fills seats in 14 days.
                    </p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center flex-shrink-0 font-bold mt-1 text-sm shadow-sm">2</div>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      <strong className="text-neutral-900 dark:text-white">Cost of Bad Hire:</strong> Wrong staff = 6 months wasted salary + training. Our vetting + 90-day replacement guarantee eliminates that risk.
                    </p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center flex-shrink-0 font-bold mt-1 text-sm shadow-sm">3</div>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      <strong className="text-neutral-900 dark:text-white">ROI Focus:</strong> You don't pay for "effort". You pay for a managed process that delivers calls, meetings, and closed deals.
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="md:w-1/2 w-full"
              >
                <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800" alt="Investment Case" className="w-full rounded-2xl shadow-elevated grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" />
              </motion.div>
            </div>

            {/* Our Promise */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
              className="bg-accent-50/50 dark:bg-accent-900/10 border border-accent-100 dark:border-accent-800/30 rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-soft"
            >
              <span className="inline-block py-1.5 px-4 rounded-full bg-accent-100/50 dark:bg-accent-800/50 text-accent-700 dark:text-accent-300 font-bold tracking-wide uppercase text-sm mb-6">Our Commitment</span>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white mb-8 leading-tight">Our Promise To You</h3>
              <p className="text-xl md:text-2xl text-neutral-700 dark:text-neutral-300 leading-relaxed mb-10">
                We will establish your revenue team, manage their performance, and make sure they sell. If they don't perform, we replace them. Your business stays alive.
              </p>
              <div className="pt-8 border-t border-accent-200/50 dark:border-accent-800/50 inline-block">
                <p className="font-display font-bold text-neutral-900 dark:text-white text-2xl md:text-3xl leading-snug">
                  Quotahire. Hire Verified Talent, Faster.<br/> Generate Revenue, Longer.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 overflow-hidden mt-12 md:mt-24">
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-neutral-900 dark:text-white mb-8">Next Step for Business Owners</h2>
          <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl mx-auto">
            Book a 15-min Revenue Audit → We'll show you the team structure you need to hit your next ₦10M.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="mailto:hello@quotahire.com">
              <Button size="lg" className="w-full sm:w-auto shadow-elevated text-lg px-10 py-6 h-auto rounded-full">
                Book Your Revenue Audit
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
