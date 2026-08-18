import React from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { openCookieBanner } from '../ui/CookieBanner';

const LinkedinIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 24 24">
		<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 0 0-1.62 1.62 1.62 1.62 0 0 0 1.62 1.62 1.62 1.62 0 0 0 1.62-1.62c0-.9-.73-1.62-1.62-1.62Z" />
	</svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 24 24">
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 24 24">
		<path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z" />
	</svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 24 24">
		<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
	</svg>
);

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
			{ title: 'Delete Account', href: '/delete-account' },
		],
	},
	{
		label: 'Social',
		links: [
			{ title: 'LinkedIn', href: '#', icon: LinkedinIcon },
			{ title: 'Twitter', href: '#', icon: TwitterIcon },
			{ title: 'Facebook', href: '#', icon: FacebookIcon },
			{ title: 'Instagram', href: '#', icon: InstagramIcon },
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