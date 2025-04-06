'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import LoadingSpinner from '@/components/common/LoadingSpinner'

type Material = {
  id: string
  name: string
  quantity: number
  icon: string
  source: string
  basePrice: number
}

type Recipe = {
  id: string
  name: string
  resultQuantity: number
  category: string
  skillRequired: string
  skillLevel: number
  materials: Material[]
  craftingTime: number
  icon: string
}

export default function CraftingContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSkill, setSelectedSkill] = useState('all')
  const [skillLevel, setSkillLevel] = useState(1)
  const [categories, setCategories] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>({})
  
  // Load data
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true)
        
        // Fetch recipes data
        const res = await fetch('/api/v1/crafting/recipes')
        const data = await res.json()
        
        setRecipes(data.recipes || [])
        
        // Extract unique categories and skills
        const uniqueCategories = [...new Set(data.recipes.map((r: Recipe) => r.category))]
        const uniqueSkills = [...new Set(data.recipes.map((r: Recipe) => r.skillRequired))]
        
        setCategories(uniqueCategories)
        setSkills(uniqueSkills)
        
        // Check for query parameter
        const recipeId = searchParams.get('recipe')
        const category = searchParams.get('category')
        const skill = searchParams.get('skill')
        
        if (recipeId) {
          setSearchTerm(recipeId)
        }
        
        if (category) {
          setSelectedCategory(category)
        }
        
        if (skill) {
          setSelectedSkill(skill)
        }
        
      } catch (error) {
        console.error('Error fetching recipes:', error)
      } finally {
        setLoading(false)
      }
    }
    
    const fetchMaterialPrices = async () => {
      try {
        // Fetch current market prices
        const res = await fetch('/api/v1/economy/materials')
        const data = await res.json()
        
        // Create price lookup object
        const prices: Record<string, number> = {}
        data.materials.forEach((m: { id: string, price: number }) => {
          prices[m.id] = m.price
        })
        
        setMaterialPrices(prices)
      } catch (error) {
        console.error('Error fetching material prices:', error)
      }
    }
    
    fetchRecipes()
    fetchMaterialPrices()
  }, [searchParams])
  
  // Filter recipes
  useEffect(() => {
    let filtered = [...recipes]
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory)
    }
    
    // Apply skill filter
    if (selectedSkill !== 'all') {
      filtered = filtered.filter(recipe => recipe.skillRequired === selectedSkill)
    }
    
    // Apply skill level filter
    filtered = filtered.filter(recipe => recipe.skillLevel <= skillLevel)
    
    setFilteredRecipes(filtered)
  }, [recipes, searchTerm, selectedCategory, selectedSkill, skillLevel])
  
  // Calculate recipe cost
  const calculateRecipeCost = (recipe: Recipe) => {
    return recipe.materials.reduce((total, material) => {
      const price = materialPrices[material.id] || material.basePrice
      return total + (price * material.quantity)
    }, 0)
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
        <h1 className="text-3xl font-display font-bold dark:text-white mb-4 md:mb-0">Crafting Calculator</h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute right-3 top-2.5 text-gray-400"
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
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Filters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Crafting Skill
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="all">All Skills</option>
                  {skills.map(skill => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Skill Level: {skillLevel}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-4">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Calculator Tips</h2>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Material prices update hourly</li>
              <li>• Click a recipe to see detailed requirements</li>
              <li>• Cost calculations include all materials</li>
              <li>• Skill requirements show minimum needed level</li>
              <li>• Use filters to find recipes for your character</li>
            </ul>
          </div>
        </div>
        
        {/* Recipe List */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Recipes ({filteredRecipes.length})</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredRecipes.length} of {recipes.length} recipes
              </div>
            </div>
            
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No recipes match your filters. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecipes.map(recipe => (
                  <div 
                    key={recipe.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-md w-12 h-12 flex items-center justify-center mr-4 mb-3 sm:mb-0">
                        {/* Placeholder for recipe icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      
                      <div className="flex-grow">
                        <h3 className="font-medium text-lg dark:text-white">{recipe.name}</h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {recipe.category} • {recipe.skillRequired} (Level {recipe.skillLevel})
                        </div>
                      </div>
                      
                      <div className="text-right mt-3 sm:mt-0">
                        <div className="font-medium dark:text-white">
                          {calculateRecipeCost(recipe).toFixed(2)} gold
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {recipe.craftingTime} seconds
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="font-medium text-sm mb-2 dark:text-white">Materials:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {recipe.materials.map(material => (
                          <div key={material.id} className="flex items-center">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded w-8 h-8 flex items-center justify-center mr-2">
                              {/* Placeholder for material icon */}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                            </div>
                            <div className="text-sm">
                              <span className="dark:text-white">{material.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-1">x{material.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
