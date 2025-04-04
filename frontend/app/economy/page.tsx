'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpDown, Filter, Search, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../../components/ui/loading-spinner';

type ServerData = {
  id: string;
  name: string;
  region: string;
};

type ResourcePriceData = {
  id: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
};

type MarketMetrics = {
  totalVolume: number;
  tradeCount: number;
  mostTraded: string;
  avgItemPrice: number;
};

type CraftingProfitData = {
  id: string;
  name: string;
  materials: string;
  cost: number;
  sellPrice: number;
  profit: number;
  profitMargin: number;
};

type PriceHistoryData = {
  date: string;
  price: number;
};

export default function EconomyTracker() {
  const [activeTab, setActiveTab] = useState('market-prices');
  const [servers, setServers] = useState<ServerData[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcePrices, setResourcePrices] = useState<ResourcePriceData[]>([]);
  const [marketMetrics, setMarketMetrics] = useState<MarketMetrics | null>(null);
  const [craftingData, setCraftingData] = useState<CraftingProfitData[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  useEffect(() => {
    // Fetch server list
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/v1/servers');
        const data = await response.json();
        setServers(data.servers);
        
        // Set default selected server
        if (data.servers.length > 0) {
          setSelectedServer(data.servers[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch servers:', error);
      }
    };

    fetchServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchResourcePrices();
      fetchMarketMetrics();
      fetchCraftingData();
    }
  }, [selectedServer]);

  useEffect(() => {
    if (selectedResource) {
      fetchPriceHistory();
    }
  }, [selectedResource]);

  const fetchResourcePrices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/economy/resources?server=${selectedServer}`);
      const data = await response.json();
      setResourcePrices(data.resources);
    } catch (error) {
      console.error('Failed to fetch resource prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketMetrics = async () => {
    try {
      const response = await fetch(`/api/v1/economy/metrics?server=${selectedServer}`);
      const data = await response.json();
      setMarketMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch market metrics:', error);
    }
  };

  const fetchCraftingData = async () => {
    try {
      const response = await fetch(`/api/v1/economy/crafting-profit?server=${selectedServer}`);
      const data = await response.json();
      setCraftingData(data.items);
    } catch (error) {
      console.error('Failed to fetch crafting data:', error);
    }
  };

  const fetchPriceHistory = async () => {
    try {
      const response = await fetch(`/api/v1/economy/price-history?server=${selectedServer}&resourceId=${selectedResource}`);
      const data = await response.json();
      setPriceHistory(data.history);
    } catch (error) {
      console.error('Failed to fetch price history:', error);
    }
  };

  const handleRefresh = () => {
    fetchResourcePrices();
    fetchMarketMetrics();
    fetchCraftingData();
    if (selectedResource) {
      fetchPriceHistory();
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedResources = [...resourcePrices].filter(
    resource => resource.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a[sortConfig.key as keyof ResourcePriceData] < b[sortConfig.key as keyof ResourcePriceData]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key as keyof ResourcePriceData] > b[sortConfig.key as keyof ResourcePriceData]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const sortedCraftingData = [...craftingData].filter(
    item => item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a[sortConfig.key as keyof CraftingProfitData] < b[sortConfig.key as keyof CraftingProfitData]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key as keyof CraftingProfitData] > b[sortConfig.key as keyof CraftingProfitData]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Economy Tracker</h1>
        <div className="flex items-center space-x-4">
          <select 
            className="border rounded p-2"
            value={selectedServer}
            onChange={e => setSelectedServer(e.target.value)}
          >
            {servers.map(server => (
              <option key={server.id} value={server.id}>
                {server.name} ({server.region})
              </option>
            ))}
          </select>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="market-prices">Market Prices</TabsTrigger>
          <TabsTrigger value="market-trends">Market Trends</TabsTrigger>
          <TabsTrigger value="crafting-profit">Crafting Profit</TabsTrigger>
        </TabsList>

        <TabsContent value="market-prices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Market Prices</CardTitle>
              <CardDescription>Current market prices for resources on {servers.find(s => s.id === selectedServer)?.name}</CardDescription>
              <div className="flex justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">
                          <Button variant="ghost" onClick={() => handleSort('name')} className="flex items-center">
                            Resource
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </th>
                        <th className="px-4 py-2 text-left">
                          <Button variant="ghost" onClick={() => handleSort('price')} className="flex items-center">
                            Price
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </th>
                        <th className="px-4 py-2 text-left">
                          <Button variant="ghost" onClick={() => handleSort('change')} className="flex items-center">
                            24h Change
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </th>
                        <th className="px-4 py-2 text-left">
                          <Button variant="ghost" onClick={() => handleSort('volume')} className="flex items-center">
                            Volume
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </th>
                        <th className="px-4 py-2 text-left">History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResources.map(resource => (
                        <tr key={resource.id} className="border-b hover:bg-gray-100">
                          <td className="px-4 py-2">{resource.name}</td>
                          <td className="px-4 py-2">{resource.price.toFixed(2)} gold</td>
                          <td className={`px-4 py-2 ${resource.change > 0 ? 'text-green-600' : resource.change < 0 ? 'text-red-600' : ''}`}>
                            {resource.change > 0 ? '+' : ''}{resource.change.toFixed(2)}%
                          </td>
                          <td className="px-4 py-2">{resource.volume}</td>
                          <td className="px-4 py-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedResource(resource.id)}
                            >
                              View History
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedResource && (
            <Card>
              <CardHeader>
                <CardTitle>Price History</CardTitle>
                <CardDescription>
                  Historical prices for {resourcePrices.find(r => r.id === selectedResource)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={priceHistory}
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="market-trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>Key market metrics for {servers.find(s => s.id === selectedServer)?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {marketMetrics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Total Volume</div>
                      <div className="text-2xl font-bold">{marketMetrics.totalVolume.toLocaleString()} gold</div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Trade Count</div>
                      <div className="text-2xl font-bold">{marketMetrics.tradeCount.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Most Traded Item</div>
                      <div className="text-2xl font-bold">{marketMetrics.mostTraded}</div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Avg Item Price</div>
                      <div className="text-2xl font-bold">{marketMetrics.avgItemPrice.toFixed(2)} gold</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Traded Items</CardTitle>
                <CardDescription>Items with highest trading volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedResources.slice(0, 5)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="volume" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Price Change %</CardTitle>
                <CardDescription>24-hour price change percentage by resource</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedResources}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="change" fill={(data) => data.change >= 0 ? "#82ca9d" : "#ff7373"} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crafting-profit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crafting Profit Calculator</CardTitle>
              <CardDescription>Calculate profit margins for crafted items</CardDescription>
              <div className="flex justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">
                        <Button variant="ghost" onClick={() => handleSort('name')} className="flex items-center">
                          Item
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </th>
                      <th className="px-4 py-2 text-left">Materials</th>
                      <th className="px-4 py-2 text-left">
                        <Button variant="ghost" onClick={() => handleSort('cost')} className="flex items-center">
                          Cost
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Button variant="ghost" onClick={() => handleSort('sellPrice')} className="flex items-center">
                          Sell Price
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Button variant="ghost" onClick={() => handleSort('profit')} className="flex items-center">
                          Profit
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Button variant="ghost" onClick={() => handleSort('profitMargin')} className="flex items-center">
                          Margin
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCraftingData.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-100">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2">{item.materials}</td>
                        <td className="px-4 py-2">{item.cost.toFixed(2)} gold</td>
                        <td className="px-4 py-2">{item.sellPrice.toFixed(2)} gold</td>
                        <td className={`px-4 py-2 ${item.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.profit.toFixed(2)} gold
                        </td>
                        <td className={`px-4 py-2 ${item.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.profitMargin.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
