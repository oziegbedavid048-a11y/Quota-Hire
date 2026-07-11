import React from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { openCookieBanner } from '../ui/CookieBanner';


interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'For Talent',
		links: [
			{ title: 'Browse Jobs', href: '/jobs' },
			{ title: 'Create Profile', href: '/signup?role=employee' },
			{ title: 'CV Generator', href: '/signup?role=employee' },
			{ title: 'Salary Guide', href: '/jobs' },
		],
	},
	{
		label: 'For Companies',
		links: [
			{ title: 'Post a Job', href: '/signup?role=company' },
			{ title: 'Pricing', href: '/signup?role=company' },
			{ title: 'Success Stories', href: '/signup?role=company' },
			{ title: 'Hiring Guide', href: '/signup?role=company' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'About Us', href: '/about' },
			{ title: 'Why Quotahire', href: '/why' },
			{ title: 'Contact', href: '/contact' },
			{ title: 'Privacy Policy', href: '/privacy' },
		],
	},

	{
		label: 'Social',
		links: [
			{ title: 'LinkedIn', href: '#', icon: Linkedin },
			{ title: 'Twitter', href: '#', icon: Twitter },
			{ title: 'Facebook', href: '#', icon: Facebook },
			{ title: 'Instagram', href: '#', icon: Instagram },
		],
	},
];

export const Footer = () => {
	return (
		<footer className="mt-auto md:rounded-t-[3rem] relative w-full flex flex-col items-center justify-center rounded-t-[2rem] border-t border-neutral-200 dark:border-neutral-800 bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.black/3%),transparent)] dark:bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/5%),transparent)] px-6 py-12 lg:py-16 bg-white dark:bg-neutral-950">
			<div className="bg-accent-500/30 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm" />

			<div className="grid w-full max-w-6xl gap-8 xl:grid-cols-3 xl:gap-8 mx-auto">
				<AnimatedContainer className="space-y-4">
					<Link className="flex items-center gap-2 mb-4" to="/">
            <Logo size={30} />
            <span className="font-display font-bold text-xl tracking-tight text-neutral-900 dark:text-white">
              Quota Hire
            </span>
          </Link>
					<p className="text-neutral-500 dark:text-neutral-400 mt-8 text-sm md:mt-0 max-w-xs">
						Where elite sales talent meets quota-crushing companies.
						<br/><br/>
						© {new Date().getFullYear()} Quota Hire. All rights reserved.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-sm font-bold text-neutral-900 dark:text-white">{section.label}</h3>
								<ul className="text-neutral-600 dark:text-neutral-400 mt-4 space-y-3 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<Link
												to={link.href}
												className="hover:text-accent-600 dark:hover:text-accent-400 inline-flex items-center transition-colors duration-300"
											>
												{link.icon && <link.icon className="mr-2 h-4 w-4" />}
												{link.title}
											</Link>
										</li>
									))}
									{section.label === 'Company' && (
										<li>
											<button
												id="footer-cookie-settings"
												onClick={openCookieBanner}
												className="hover:text-accent-600 dark:hover:text-accent-400 inline-flex items-center transition-colors duration-300"
											>
												Cookie Settings
											</button>
										</li>
									)}

								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
};

type ViewAnimationProps = {
	delay?: number;
	className?: string;
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}