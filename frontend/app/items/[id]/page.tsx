'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import Image from 'next/image';
import { ArrowLeft, Heart, ShoppingCart, Share2, BarChart2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../../../components/ui/loading-spinner';

type ItemData = {
  id: string;
  name: string;
  description: string;
  type: string;
  subtype: string;
  rarity: string;
  level: number;
  source: string;
  imageUrl: string;
  stats: {
    [key: string]: number;
  };
  effects: {
    name: string;
    description: string;
  }[];
  craftingMaterials?: {
    id: string;
    name: string;
    amount: number;
  }[];
  dropSources?: {
    name: string;
    dropRate: number;
    location: string;
  }[];
  marketData?: {
    currentPrice: number;
    priceHistory: {
      date: string;
      price: number;
    }[];
    volume: number;
    priceChange: number;
  };
  relatedItems?: {
    id: string;
    name: string;
    type: string;
    imageUrl: string;
  }[];
};

type CommentData = {
  id: string;
  userName: string;
  content: string;
  timestamp: string;
  rating: number;
};

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<ItemData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [serverFilter, setServerFilter] = useState('all');

  const rarityColors = {
    common: 'bg-gray-400',
    uncommon: 'bg-green-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500',
    artifact: 'bg-red-500',
  };

  useEffect(() => {
    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/items/${params.id}`);
        const data = await response.json();
        setItem(data);
        
        // Fetch comments as well
        const commentsResponse = await fetch(`/api/v1/items/${params.id}/comments`);
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments);
      } catch (error) {
        console.error('Failed to fetch item details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex justify-center items-center">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-3xl font-bold mb-4">Item Not Found</h1>
            <p className="mb-8">We couldn't find the item you're looking for.</p>
            <Link href="/items">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Items
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRarityClass = (rarity: string) => {
    return rarityColors[rarity as keyof typeof rarityColors] || 'bg-gray-400';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/items">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Items
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 w-full md:w-64 h-64 relative bg-gray-100 rounded-lg overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image available
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold">{item.name}</h1>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge className={getRarityClass(item.rarity)}>
                          {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                        </Badge>
                        <Badge variant="outline">{item.type}</Badge>
                        {item.subtype && <Badge variant="outline">{item.subtype}</Badge>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="icon" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="mt-4 text-gray-700">{item.description}</p>
                  
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Level</span>
                      <span className="font-medium">{item.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Source</span>
                      <span className="font-medium">{item.source}</span>
                    </div>
                    {item.marketData && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Market Price</span>
                        <span className="font-medium">{item.marketData.currentPrice.toFixed(2)} gold</span>
                      </div>
                    )}
                  </div>

                  {item.marketData && (
                    <div className="mt-6 flex flex-wrap gap-4">
                      <Button className="flex-1">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Buy Now
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Track Price
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="crafting">Crafting</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.keys(item.stats).length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Stats</h3>
                        <div className="space-y-3">
                          {Object.entries(item.stats).map(([stat, value]) => (
                            <div key={stat} className="grid grid-cols-2 gap-4">
                              <div className="text-gray-500">{stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">+{value}</span>
                                <Progress value={value} max={100} className="h-2 w-24" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.effects.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Effects</h3>
                        <div className="space-y-3">
                          {item.effects.map((effect, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium text-blue-600">{effect.name}</div>
                              <div className="text-gray-700 mt-1">{effect.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.dropSources && item.dropSources.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Drop Sources</h3>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drop Rate</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {item.dropSources.map((source, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap">{source.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{source.location}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{(source.dropRate * 100).toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crafting" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crafting Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.craftingMaterials && item.craftingMaterials.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Required Materials</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {item.craftingMaterials.map((material) => (
                              <tr key={material.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{material.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{material.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Link href={`/items/${material.id}`}>
                                    <Button size="sm" variant="outline">View</Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-6">
                        <Button>Add All Materials to Shopping List</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">This item cannot be crafted.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="market" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Data</CardTitle>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="server-filter" className="text-sm">Server:</label>
                    <select
                      id="server-filter"
                      className="border rounded p-1 text-sm"
                      value={serverFilter}
                      onChange={(e) => setServerFilter(e.target.value)}
                    >
                      <option value="all">All Servers</option>
                      <option value="server1">Alpha Server</option>
                      <option value="server2">Beta Server</option>
                      <option value="server3">Gamma Server</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.marketData ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-500">Current Price</div>
                          <div className="text-2xl font-bold">{item.marketData.currentPrice.toFixed(2)} gold</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-500">24h Change</div>
                          <div className={`text-2xl font-bold ${item.marketData.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.marketData.priceChange >= 0 ? '+' : ''}{item.marketData.priceChange.toFixed(2)}%
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-500">Volume (24h)</div>
                          <div className="text-2xl font-bold">{item.marketData.volume}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">Price History</h3>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={item.marketData.priceHistory}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button variant="outline">Set Price Alert</Button>
                        <Button>Buy Now</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No market data available for this item.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border-b pb-4">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{comment.userName}</div>
                            <div className="text-sm text-gray-500">{new Date(comment.timestamp).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center mt-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-lg ${i < comment.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No comments yet. Be the first to leave a comment!</p>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Add a Comment</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <button key={i} className="text-xl text-gray-300 hover:text-yellow-400">★</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                        <textarea 
                          className="w-full p-2 border rounded-md" 
                          rows={4}
                          placeholder="Share your thoughts about this item..."
                        />
                      </div>
                      <Button>Submit Comment</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          {item.relatedItems && item.relatedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {item.relatedItems.map((relatedItem) => (
                    <Link key={relatedItem.id} href={`/items/${relatedItem.id}`}>
                      <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <div className="w-12 h-12 bg-gray-100 rounded-md mr-3 relative overflow-hidden">
                          {relatedItem.imageUrl && (
                            <Image
                              src={relatedItem.imageUrl}
                              alt={relatedItem.name}
                              layout="fill"
                              objectFit="cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{relatedItem.name}</div>
                          <div className="text-sm text-gray-500">{relatedItem.type}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Build Calculator</CardTitle>
              <CardDescription>See how this item affects your character stats</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Add to Build Planner</Button>
              
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Character Level</div>
                  <select className="w-full p-2 border rounded-md">
                    {[...Array(50)].map((_, i) => (
                      <option key={i} value={i + 1}>Level {i + 1}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Class</div>
                  <select className="w-full p-2 border rounded-md">
                    <option value="mage">Mage</option>
                    <option value="fighter">Fighter</option>
                    <option value="tank">Tank</option>
                    <option value="ranger">Ranger</option>
                    <option value="cleric">Cleric</option>
                    <option value="bard">Bard</option>
                    <option value="rogue">Rogue</option>
                    <option value="summoner">Summoner</option>
                  </select>
                </div>
                
                <Button variant="outline" className="w-full">Calculate Stats</Button>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Estimated Stat Changes</div>
                <div className="space-y-2">
                  {Object.entries(item.stats).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between">
                      <span className="text-gray-600">{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                      <span className="font-medium text-green-600">+{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
