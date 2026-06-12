import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { toast } from 'sonner';
import { useScreenInit } from '../useScreenInit';

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
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden bg-neutral-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-accent-600 dark:text-accent-400" />
            </div>
            <h1 className="text-2xl md:text-xl md:text-2xl md:text-6xl font-display font-bold text-neutral-900 dark:text-white mb-6">
              Let's Start a Conversation
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Have questions about Quota Hire? Looking for an enterprise plan? We're here to help you hit your goals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            
            {/* Contact Form */}
            <motion.div 
              className="lg:col-span-3 bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-elevated"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="First Name" required />
                  <Input label="Last Name" required />
                </div>
                <Input label="Email Address" type="email" required />
                <Input label="Subject" required />
                <Textarea label="Message" rows={6} required />
                <Button type="submit" className="w-full h-12" isLoading={isLoading}>Send Message</Button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div 
              className="lg:col-span-2 space-y-8"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Contact Information</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Fill out the form and our team will get back to you within 24 hours.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4 p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50">
                  <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="text-accent-600 dark:text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Email</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">support@quotahire.com</p>
                    <p className="text-neutral-600 dark:text-neutral-400">partnerships@quotahire.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50">
                  <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-accent-600 dark:text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Office</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      100 Market Street<br/>Suite 300<br/>San Francisco, CA 94105
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50">
                  <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="text-accent-600 dark:text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Phone</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};