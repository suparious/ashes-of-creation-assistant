'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import LoadingSpinner from '@/components/common/LoadingSpinner'

type Item = {
  id: string
  name: string
  icon: string
  type: string
  subtype: string
  level: number
  quality: string
  description: string
  stats: Record<string, any>
  source: string
  vendor_price: number
}

export default function ItemsContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState<[number, number]>([1, 50])
  const [selectedQuality, setSelectedQuality] = useState('all')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0
  })
  
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'weapon', label: 'Weapons' },
    { value: 'armor', label: 'Armor' },
    { value: 'accessory', label: 'Accessories' },
    { value: 'consumable', label: 'Consumables' },
    { value: 'material', label: 'Materials' },
    { value: 'quest', label: 'Quest Items' }
  ]
  
  const qualityOptions = [
    { value: 'all', label: 'All Qualities' },
    { value: 'common', label: 'Common' },
    { value: 'uncommon', label: 'Uncommon' },
    { value: 'rare', label: 'Rare' },
    { value: 'epic', label: 'Epic' },
    { value: 'legendary', label: 'Legendary' },
    { value: 'artifact', label: 'Artifact' }
  ]
  
  // Load items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        
        // Check for search params
        const search = searchParams.get('search')
        const type = searchParams.get('type')
        const quality = searchParams.get('quality')
        const page = searchParams.get('page')
        
        if (search) setSearchTerm(search)
        if (type) setSelectedType(type)
        if (quality) setSelectedQuality(quality)
        if (page) setPagination({ ...pagination, currentPage: parseInt(page) })
        
        // Fetch items
        const queryParams = new URLSearchParams({
          page: pagination.currentPage.toString(),
          limit: pagination.itemsPerPage.toString(),
          type: selectedType !== 'all' ? selectedType : '',
          quality: selectedQuality !== 'all' ? selectedQuality : '',
          search: searchTerm,
          min_level: selectedLevel[0].toString(),
          max_level: selectedLevel[1].toString(),
          sort_by: sortConfig.key,
          sort_direction: sortConfig.direction
        })
        
        const res = await fetch(`/api/v1/items?${queryParams.toString()}`)
        const data = await res.json()
        
        setItems(data.items || [])
        setFilteredItems(data.items || [])
        setPagination({
          ...pagination,
          totalItems: data.total || 0
        })
        
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchItems()
  }, [searchParams, pagination.currentPage, pagination.itemsPerPage, sortConfig])
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, currentPage: 1 })
    applyFilters()
  }
  
  // Apply filters
  const applyFilters = () => {
    let filtered = [...items]
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType)
    }
    
    // Apply quality filter
    if (selectedQuality !== 'all') {
      filtered = filtered.filter(item => item.quality.toLowerCase() === selectedQuality)
    }
    
    // Apply level filter
    filtered = filtered.filter(
      item => item.level >= selectedLevel[0] && item.level <= selectedLevel[1]
    )
    
    setFilteredItems(filtered)
    setPagination({
      ...pagination,
      totalItems: filtered.length
    })
  }
  
  // Handle sort
  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    setSortConfig({ key, direction })
  }
  
  // Quality color class
  const getQualityColorClass = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'common': return 'text-gray-600 dark:text-gray-300'
      case 'uncommon': return 'text-green-600 dark:text-green-400'
      case 'rare': return 'text-blue-600 dark:text-blue-400'
      case 'epic': return 'text-purple-600 dark:text-purple-400'
      case 'legendary': return 'text-amber-600 dark:text-amber-400'
      case 'artifact': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-300'
    }
  }
  
  // Get pagination buttons
  const getPaginationButtons = () => {
    const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage)
    const currentPage = pagination.currentPage
    
    const buttons = []
    
    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => setPagination({ ...pagination, currentPage: currentPage - 1 })}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
      >
        &laquo;
      </button>
    )
    
    // Page buttons
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + 4)
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPagination({ ...pagination, currentPage: i })}
          className={`px-3 py-1 rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white dark:bg-blue-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          {i}
        </button>
      )
    }
    
    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => setPagination({ ...pagination, currentPage: currentPage + 1 })}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
      >
        &raquo;
      </button>
    )
    
    return buttons
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
        <h1 className="text-3xl font-display font-bold dark:text-white mb-4 md:mb-0">Item Database</h1>
        
        <form onSubmit={handleSearch} className="w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md pr-10"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Filters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quality
                </label>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  {qualityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item Level: {selectedLevel[0]} - {selectedLevel[1]}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={selectedLevel[0]}
                    onChange={(e) => setSelectedLevel([parseInt(e.target.value), selectedLevel[1]])}
                    className="w-full"
                  />
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={selectedLevel[1]}
                    onChange={(e) => setSelectedLevel([selectedLevel[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
              </div>
              
              <button
                onClick={applyFilters}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Legend</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-gray-600 dark:bg-gray-300 mr-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Common</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-green-600 dark:bg-green-400 mr-2"></span>
                <span className="text-green-600 dark:text-green-400">Uncommon</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 mr-2"></span>
                <span className="text-blue-600 dark:text-blue-400">Rare</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-purple-600 dark:bg-purple-400 mr-2"></span>
                <span className="text-purple-600 dark:text-purple-400">Epic</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-600 dark:bg-amber-400 mr-2"></span>
                <span className="text-amber-600 dark:text-amber-400">Legendary</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-red-600 dark:bg-red-400 mr-2"></span>
                <span className="text-red-600 dark:text-red-400">Artifact</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Item List */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white mb-2 md:mb-0">
                Items ({pagination.totalItems})
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} items
              </div>
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No items match your filters. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 px-4">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Name
                          {sortConfig.key === 'name' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? '' : 'transform rotate-180'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </button>
                      </th>
                      <th className="py-2 px-4">
                        <button
                          onClick={() => handleSort('type')}
                          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Type
                          {sortConfig.key === 'type' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? '' : 'transform rotate-180'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </button>
                      </th>
                      <th className="py-2 px-4">
                        <button
                          onClick={() => handleSort('level')}
                          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Level
                          {sortConfig.key === 'level' && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? '' : 'transform rotate-180'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </button>
                      </th>
                      <th className="py-2 px-4">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-md w-10 h-10 flex items-center justify-center mr-3">
                              {/* Placeholder for item icon */}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            </div>
                            <div>
                              <a
                                href={`/items/${item.id}`}
                                className={`font-medium hover:underline ${getQualityColorClass(item.quality)}`}
                              >
                                {item.name}
                              </a>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.quality}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {item.type}
                            {item.subtype && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                {item.subtype}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {item.level}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {item.source}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                {getPaginationButtons()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
