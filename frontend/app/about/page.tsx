'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          className="text-4xl font-display font-bold mb-6 dark:text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          About MyAshes.ai
        </motion.h1>
        
        <motion.div
          className="prose prose-lg dark:prose-invert max-w-none mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p>
            MyAshes.ai is a comprehensive AI-powered assistant and toolkit for the MMORPG game Ashes of Creation. 
            We're dedicated to helping players discover information about the game, plan character builds, 
            optimize crafting, and engage with the game more effectively.
          </p>
          
          <p>
            Our mission is to create the most helpful and accurate resource for Ashes of Creation players, 
            leveraging cutting-edge AI technology to provide personalized assistance and enhance the gaming experience.
          </p>
        </motion.div>
        
        {/* Feature grid */}
        <div className="mb-16">
          <motion.h2 
            className="text-2xl font-display font-bold mb-8 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Platform Features
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold dark:text-white">AI-Powered Chat Assistant</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Get instant answers to your questions about items, locations, crafting recipes, and gameplay mechanics.
                Our assistant leverages a comprehensive database of game knowledge to provide accurate information.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold dark:text-white">Character Build Planner</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Create and share optimized character builds with detailed skills and equipment loadouts.
                Experiment with different classes, races, and skill combinations to find the perfect build for your playstyle.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold dark:text-white">Crafting Calculator</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Calculate required materials for any crafting project with our advanced calculator.
                Optimize your gathering routes, track your progress, and determine the most efficient
                way to level your crafting skills.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold dark:text-white">Interactive World Map</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Explore Verra with our detailed map featuring resource nodes, dungeons, cities,
                and other points of interest. Find exactly what you need with powerful filtering
                options and bookmark important locations.
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* Technology section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-2xl font-display font-bold mb-8 dark:text-white">Our Technology</h2>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              MyAshes.ai is built using cutting-edge AI and web technologies:
            </p>
            
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• <span className="font-medium">Advanced Language Models</span> trained on extensive game data</li>
              <li>• <span className="font-medium">Vector Databases</span> for semantic search capabilities</li>
              <li>• <span className="font-medium">React & Next.js</span> for a responsive, modern web experience</li>
              <li>• <span className="font-medium">Real-time Data Collection</span> to stay up-to-date with the latest game information</li>
              <li>• <span className="font-medium">Discord Integration</span> for seamless access in your community servers</li>
            </ul>
          </div>
        </motion.div>
        
        {/* Team section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <h2 className="text-2xl font-display font-bold mb-8 dark:text-white">Our Team</h2>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              MyAshes.ai was created by a team of passionate Ashes of Creation players and technical experts. We're dedicated to
              building the best tools possible for the community and continuously improving our platform based on your feedback.
            </p>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden mx-auto mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-medium dark:text-white">Alex Chen</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Founder & Lead Developer</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden mx-auto mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-medium dark:text-white">Sarah Johnson</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI Research Lead</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden mx-auto mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-medium dark:text-white">Michael Torres</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Game Systems Expert</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Call to action */}
        <motion.div
          className="text-center bg-ashes-dark text-white p-8 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <h2 className="text-2xl font-display font-bold mb-4">Join Our Community</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Join thousands of players who are already using MyAshes.ai to get ahead in the game.
            Connect with us on Discord, share your builds, and contribute to our growing knowledge base.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/chat"
              className="px-6 py-3 bg-ashes-gold hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <a 
              href="https://discord.gg/myashes"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Join Our Discord
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
