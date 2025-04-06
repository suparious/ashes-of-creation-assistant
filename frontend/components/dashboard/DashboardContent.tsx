'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/stores/auth'
import LoadingSpinner from '@/components/common/LoadingSpinner'

type SavedBuild = {
  id: string
  name: string
  class: string
  race: string
  level: number
  createdAt: string
  updatedAt: string
}

type SavedItem = {
  id: string
  name: string
  type: string
  quality: string
  notes: string
  savedAt: string
}

type ActivityFeed = {
  id: string
  type: string
  content: string
  timestamp: string
}

type ServerInfo = {
  name: string
  status: string
  population: string
}

export default function DashboardContent() {
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([])
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityFeed[]>([])
  const [serverInfo, setServerInfo] = useState<ServerInfo[]>([])
  const [activeTab, setActiveTab] = useState('all')
  
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
    
    fetchDashboardData()
  }, [searchParams])
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user's saved builds
      if (isAuthenticated) {
        const buildsRes = await fetch('/api/v1/users/builds')
        const buildsData = await buildsRes.json()
        setSavedBuilds(buildsData.builds || [])
        
        // Fetch user's saved items
        const itemsRes = await fetch('/api/v1/users/saved-items')
        const itemsData = await itemsRes.json()
        setSavedItems(itemsData.items || [])
      }
      
      // Fetch activity feed
      const activityRes = await fetch('/api/v1/activity')
      const activityData = await activityRes.json()
      setActivityFeed(activityData.activities || [])
      
      // Fetch server status
      const serverRes = await fetch('/api/v1/servers')
      const serverData = await serverRes.json()
      setServerInfo(serverData.servers || [])
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner size="large" />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-display font-bold dark:text-white mb-4 md:mb-0">
          {isAuthenticated ? `Welcome, ${user?.username}!` : 'Dashboard'}
        </h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md ${
              activeTab === 'all'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('builds')}
            className={`px-3 py-1.5 rounded-md ${
              activeTab === 'builds'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Builds
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-3 py-1.5 rounded-md ${
              activeTab === 'items'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Items
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Saved Builds Section */}
          {(activeTab === 'all' || activeTab === 'builds') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold dark:text-white">Saved Builds</h2>
                <a
                  href="/builds"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </a>
              </div>
              <div className="p-6">
                {isAuthenticated ? (
                  savedBuilds.length > 0 ? (
                    <div className="space-y-4">
                      {savedBuilds.slice(0, 3).map(build => (
                        <div
                          key={build.id}
                          className="flex items-start border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0"
                        >
                          <div className="w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-blue-600 dark:text-blue-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <a
                              href={`/builds/${build.id}`}
                              className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {build.name}
                            </a>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {build.race} {build.class} (Level {build.level})
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Last updated: {formatDate(build.updatedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        You haven't saved any builds yet.
                      </p>
                      <a
                        href="/builds"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors inline-block"
                      >
                        Create Your First Build
                      </a>
                    </div>
                  )
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Sign in to save and manage your character builds.
                    </p>
                    <a
                      href="/auth/login"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors inline-block"
                    >
                      Sign In
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Saved Items Section */}
          {(activeTab === 'all' || activeTab === 'items') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold dark:text-white">Saved Items</h2>
                <a
                  href="/items"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </a>
              </div>
              <div className="p-6">
                {isAuthenticated ? (
                  savedItems.length > 0 ? (
                    <div className="space-y-4">
                      {savedItems.slice(0, 3).map(item => (
                        <div
                          key={item.id}
                          className="flex items-start border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0"
                        >
                          <div className="w-10 h-10 rounded-md bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-purple-600 dark:text-purple-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <a
                              href={`/items/${item.id}`}
                              className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400"
                            >
                              {item.name}
                            </a>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {item.type} • {item.quality}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Notes: {item.notes}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Saved: {formatDate(item.savedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        You haven't saved any items yet.
                      </p>
                      <a
                        href="/items"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors inline-block"
                      >
                        Browse Items
                      </a>
                    </div>
                  )
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Sign in to save and track items you're interested in.
                    </p>
                    <a
                      href="/auth/login"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors inline-block"
                    >
                      Sign In
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Activity Feed */}
          {activeTab === 'all' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold dark:text-white">Community Activity</h2>
              </div>
              <div className="p-6">
                {activityFeed.length > 0 ? (
                  <div className="space-y-4">
                    {activityFeed.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                          {activity.type === 'build' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-blue-600 dark:text-blue-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          )}
                          {activity.type === 'item' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-purple-600 dark:text-purple-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                              />
                            </svg>
                          )}
                          {activity.type === 'forum' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-green-600 dark:text-green-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div
                            className="text-gray-900 dark:text-white"
                            dangerouslySetInnerHTML={{ __html: activity.content }}
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getRelativeTime(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400">
                      No recent activity to display.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Server Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold dark:text-white">Server Status</h2>
            </div>
            <div className="p-6">
              {serverInfo.length > 0 ? (
                <div className="space-y-3">
                  {serverInfo.map(server => (
                    <div
                      key={server.name}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium dark:text-white">{server.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        server.status === 'Online'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : server.status === 'Maintenance'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {server.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-gray-500 dark:text-gray-400">
                    No server information available.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold dark:text-white">Quick Links</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <a
                  href="/chat"
                  className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <span className="dark:text-white">AI Assistant</span>
                </a>
                <a
                  href="/builds"
                  className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <span className="dark:text-white">Character Builds</span>
                </a>
                <a
                  href="/items"
                  className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-purple-600 dark:text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <span className="dark:text-white">Item Database</span>
                </a>
                <a
                  href="/map"
                  className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                  <span className="dark:text-white">Resource Map</span>
                </a>
                <a
                  href="/crafting"
                  className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-amber-600 dark:text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <span className="dark:text-white">Crafting Calculator</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
