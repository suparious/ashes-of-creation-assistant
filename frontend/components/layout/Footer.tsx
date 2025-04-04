'use client';

import Link from 'next/link';
import { footerNavigation } from '@/data/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center font-bold text-xl">
              <span className="text-primary">MyAshes</span>
              <span className="text-gray-500">.ai</span>
            </Link>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Your AI-powered assistant for Ashes of Creation. Explore game content, plan your character builds, and optimize your gameplay.
            </p>
          </div>

          {/* Navigation Links */}
          {footerNavigation.map((section) => (
            <div key={section.title} className="md:col-span-1">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-base text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {currentYear} MyAshes.ai. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link 
                href="/terms" 
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              >
                Terms of Service
              </Link>
              <Link 
                href="/privacy" 
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/cookies" 
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            MyAshes.ai is not affiliated with or endorsed by Intrepid Studios.
            Ashes of Creation™ is a registered trademark of Intrepid Studios Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
