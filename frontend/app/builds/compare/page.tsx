'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ArrowLeft, Plus, Trash2, Copy, Share2, ExternalLink, Save } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Separator } from '../../../components/ui/separator';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import LoadingSpinner from '../../../components/ui/loading-spinner';

type ClassOption = {
  id: string;
  name: string;
  icon: string;
};

type ClassCombo = {
  primary: ClassOption;
  secondary: ClassOption;
};

type BuildItem = {
  id: string;
  name: string;
  slot: string;
  rarity: string;
  level: number;
  imageUrl: string;
  stats: {
    [key: string]: number;
  };
};

type BuildData = {
  id: string;
  name: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  level: number;
  classes: ClassCombo;
  items: BuildItem[];
  description: string;
  isPublic: boolean;
  likes: number;
  tags: string[];
};

export default function BuildComparison() {
  const [builds, setBuilds] = useState<BuildData[]>([]);
  const [selectedBuilds, setSelectedBuilds] = useState<string[]>([]);
  const [userBuilds, setUserBuilds] = useState<BuildData[]>([]);
  const [publicBuilds, setPublicBuilds] = useState<BuildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stat-comparison');
  const [comparisonReady, setComparisonReady] = useState(false);

  useEffect(() => {
    // Fetch the user's builds
    const fetchUserBuilds = async () => {
      try {
        const response = await fetch('/api/v1/builds/user');
        const data = await response.json();
        setUserBuilds(data.builds);
      } catch (error) {
        console.error('Failed to fetch user builds:', error);
      }
    };

    // Fetch popular public builds
    const fetchPublicBuilds = async () => {
      try {
        const response = await fetch('/api/v1/builds/popular');
        const data = await response.json();
        setPublicBuilds(data.builds);
      } catch (error) {
        console.error('Failed to fetch public builds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBuilds();
    fetchPublicBuilds();
  }, []);

  useEffect(() => {
    // Only proceed if we have selected at least two builds
    if (selectedBuilds.length >= 2) {
      const fetchBuildDetails = async () => {
        setLoading(true);
        const selectedBuildDetails: BuildData[] = [];

        for (const buildId of selectedBuilds) {
          try {
            const response = await fetch(`/api/v1/builds/${buildId}`);
            const data = await response.json();
            selectedBuildDetails.push(data);
          } catch (error) {
            console.error(`Failed to fetch build ${buildId}:`, error);
          }
        }

        setBuilds(selectedBuildDetails);
        setLoading(false);
        setComparisonReady(true);
      };

      fetchBuildDetails();
    } else {
      setComparisonReady(false);
    }
  }, [selectedBuilds]);

  const handleSelectBuild = (buildId: string) => {
    // Toggle selection
    if (selectedBuilds.includes(buildId)) {
      setSelectedBuilds(selectedBuilds.filter(id => id !== buildId));
    } else {
      // Limit to max 3 builds for comparison
      if (selectedBuilds.length < 3) {
        setSelectedBuilds([...selectedBuilds, buildId]);
      }
    }
  };

  const handleRemoveBuild = (buildId: string) => {
    setSelectedBuilds(selectedBuilds.filter(id => id !== buildId));
  };

  const calculateStatTotals = (build: BuildData) => {
    const totals: { [key: string]: number } = {
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      constitution: 0,
      wisdom: 0,
      attackPower: 0,
      spellPower: 0,
      health: 0,
      mana: 0,
      armor: 0,
      crit: 0,
      haste: 0,
    };

    build.items.forEach(item => {
      Object.entries(item.stats).forEach(([stat, value]) => {
        if (totals[stat] !== undefined) {
          totals[stat] += value;
        } else {
          totals[stat] = value;
        }
      });
    });

    return totals;
  };

  const prepareRadarData = () => {
    const stats = ['strength', 'dexterity', 'intelligence', 'constitution', 'wisdom', 'attackPower'];
    
    return stats.map(stat => {
      const dataPoint: { [key: string]: any } = { 
        stat: stat.charAt(0).toUpperCase() + stat.slice(1) 
      };
      
      builds.forEach((build, index) => {
        const totals = calculateStatTotals(build);
        dataPoint[`Build ${index + 1}`] = totals[stat] || 0;
      });
      
      return dataPoint;
    });
  };

  const createStatComparisonTable = () => {
    const allStats = new Set<string>();
    
    // Collect all possible stats
    builds.forEach(build => {
      const statTotals = calculateStatTotals(build);
      Object.keys(statTotals).forEach(stat => allStats.add(stat));
    });
    
    const sortedStats = Array.from(allStats).sort();
    
    // Create comparison data
    return sortedStats.map(stat => {
      const row: { [key: string]: any } = { stat: stat.charAt(0).toUpperCase() + stat.slice(1) };
      
      builds.forEach((build, index) => {
        const statTotals = calculateStatTotals(build);
        row[`build${index}`] = statTotals[stat] || 0;
      });
      
      return row;
    });
  };

  const getBuildColor = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658'];
    return colors[index % colors.length];
  };

  const rarityColors: { [key: string]: string } = {
    common: 'bg-gray-400',
    uncommon: 'bg-green-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500',
    artifact: 'bg-red-500',
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Build Comparison</h1>
        <Link href="/builds">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Builds
          </Button>
        </Link>
      </div>

      {loading && !comparisonReady ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size={64} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Selected Builds ({selectedBuilds.length}/3)</CardTitle>
                <CardDescription>Choose up to 3 builds to compare</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedBuilds.length === 0 ? (
                  <div className="text-center py-4 border-dashed border-2 border-gray-200 rounded-lg">
                    <p className="text-gray-500">Select builds to compare from the lists below</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {builds.map((build, index) => (
                      <div key={build.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 flex items-center justify-center rounded-full font-bold" style={{ backgroundColor: getBuildColor(index) }}>
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium">{build.name}</div>
                            <div className="text-sm text-gray-500">
                              {build.classes.primary.name} / {build.classes.secondary.name}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveBuild(build.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Builds</CardTitle>
                <CardDescription>Select from your saved builds</CardDescription>
              </CardHeader>
              <CardContent>
                {userBuilds.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">You don't have any saved builds yet.</p>
                    <Link href="/builds/create">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create a Build
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userBuilds.map(build => (
                      <div 
                        key={build.id} 
                        className={`p-3 rounded-lg cursor-pointer ${
                          selectedBuilds.includes(build.id) ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleSelectBuild(build.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{build.name}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Level {build.level} {build.classes.primary.name} / {build.classes.secondary.name}
                            </div>
                          </div>
                          <div>
                            {selectedBuilds.includes(build.id) && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                ✓
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Builds</CardTitle>
                <CardDescription>Compare with community builds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {publicBuilds.map(build => (
                    <div 
                      key={build.id} 
                      className={`p-3 rounded-lg cursor-pointer ${
                        selectedBuilds.includes(build.id) ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectBuild(build.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{build.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Level {build.level} {build.classes.primary.name} / {build.classes.secondary.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            by {build.owner} • {build.likes} likes
                          </div>
                        </div>
                        <div>
                          {selectedBuilds.includes(build.id) && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {!comparisonReady ? (
              <Card>
                <CardContent className="p-16 text-center">
                  <div className="mb-4 text-gray-400">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-2">Select Builds to Compare</h2>
                  <p className="text-gray-500">
                    Choose at least 2 builds from your saved builds or popular builds to start comparing.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="stat-comparison">Stat Comparison</TabsTrigger>
                    <TabsTrigger value="item-comparison">Item Comparison</TabsTrigger>
                    <TabsTrigger value="visualization">Visualization</TabsTrigger>
                  </TabsList>

                  <TabsContent value="stat-comparison" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Stat Comparison</CardTitle>
                        <CardDescription>Compare the total stats of each build</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Stat
                                </th>
                                {builds.map((build, index) => (
                                  <th 
                                    key={build.id} 
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                                    style={{ color: getBuildColor(index) }}
                                  >
                                    {build.name}
                                  </th>
                                ))}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Difference
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {createStatComparisonTable().map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                                    {row.stat}
                                  </td>
                                  {builds.map((build, buildIndex) => {
                                    const value = row[`build${buildIndex}`];
                                    // Find max value for this stat
                                    const maxValue = Math.max(
                                      ...builds.map((_, i) => row[`build${i}`] || 0)
                                    );
                                    
                                    return (
                                      <td 
                                        key={`${build.id}-${row.stat}`} 
                                        className={`px-6 py-4 whitespace-nowrap ${value === maxValue && value > 0 ? 'font-bold' : ''}`}
                                        style={{ color: value === maxValue && value > 0 ? getBuildColor(buildIndex) : '' }}
                                      >
                                        {value}
                                      </td>
                                    );
                                  })}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {builds.length === 2 && (
                                      <span className={
                                        row.build0 > row.build1 ? 'text-green-600' : 
                                        row.build0 < row.build1 ? 'text-red-600' : 
                                        'text-gray-500'
                                      }>
                                        {row.build0 > row.build1 ? '+' : ''}{row.build0 - row.build1}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="item-comparison" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Item Comparison</CardTitle>
                        <CardDescription>Compare gear choices between builds</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-8">
                          {['Weapon', 'Head', 'Chest', 'Legs', 'Gloves', 'Boots', 'Amulet', 'Ring'].map(slot => (
                            <div key={slot}>
                              <h3 className="text-lg font-medium mb-3">{slot}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {builds.map((build, index) => {
                                  const item = build.items.find(i => i.slot.toLowerCase() === slot.toLowerCase());
                                  
                                  return (
                                    <Card key={`${build.id}-${slot}`}>
                                      <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getBuildColor(index) }}></div>
                                          <div className="text-sm font-medium">{build.name}</div>
                                        </div>
                                        
                                        {item ? (
                                          <div className="mt-3">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-10 h-10 bg-gray-100 rounded-md relative overflow-hidden">
                                                {item.imageUrl && (
                                                  <Image
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    layout="fill"
                                                    objectFit="cover"
                                                  />
                                                )}
                                              </div>
                                              <div>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="flex space-x-2 mt-1">
                                                  <Badge className={rarityColors[item.rarity] || 'bg-gray-400'}>
                                                    {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                                                  </Badge>
                                                  <Badge variant="outline">Level {item.level}</Badge>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div className="mt-3 space-y-1 text-sm">
                                              {Object.entries(item.stats).map(([stat, value]) => (
                                                <div key={stat} className="flex justify-between">
                                                  <span className="text-gray-500">{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                                                  <span>+{value}</span>
                                                </div>
                                              ))}
                                            </div>
                                            
                                            <div className="mt-3">
                                              <Dialog>
                                                <DialogTrigger asChild>
                                                  <Button size="sm" variant="outline" className="w-full">
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    View Item
                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                  <DialogHeader>
                                                    <DialogTitle>{item.name}</DialogTitle>
                                                    <DialogDescription>Item Details</DialogDescription>
                                                  </DialogHeader>
                                                  <div className="mt-4">
                                                    <Link href={`/items/${item.id}`} passHref>
                                                      <Button className="w-full">Open Item Page</Button>
                                                    </Link>
                                                  </div>
                                                </DialogContent>
                                              </Dialog>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="mt-3 p-6 bg-gray-50 rounded-lg flex items-center justify-center">
                                            <span className="text-gray-400">No {slot} item</span>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                              <Separator className="mt-6" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="visualization" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Stat Visualization</CardTitle>
                        <CardDescription>Visual comparison of key stats</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={90} data={prepareRadarData()}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="stat" />
                              <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                              
                              {builds.map((build, index) => (
                                <Radar
                                  key={build.id}
                                  name={build.name}
                                  dataKey={`Build ${index + 1}`}
                                  stroke={getBuildColor(index)}
                                  fill={getBuildColor(index)}
                                  fillOpacity={0.3}
                                />
                              ))}
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="flex justify-center space-x-4 mt-6">
                          {builds.map((build, index) => (
                            <div key={build.id} className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-2" 
                                style={{ backgroundColor: getBuildColor(index) }}
                              ></div>
                              <span>{build.name}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-8">
                          <h3 className="text-lg font-medium mb-4">Key Observations</h3>
                          
                          <ul className="space-y-2 list-disc pl-5">
                            {builds.length >= 2 && (
                              <>
                                <li>
                                  <span className="font-medium" style={{ color: getBuildColor(0) }}>{builds[0].name}</span> excels in {
                                    (() => {
                                      const statTotals0 = calculateStatTotals(builds[0]);
                                      const statTotals1 = calculateStatTotals(builds[1]);
                                      const strengths = Object.entries(statTotals0)
                                        .filter(([stat, value]) => value > (statTotals1[stat] || 0))
                                        .map(([stat]) => stat.charAt(0).toUpperCase() + stat.slice(1))
                                        .slice(0, 3);
                                      return strengths.join(', ');
                                    })()
                                  }
                                </li>
                                <li>
                                  <span className="font-medium" style={{ color: getBuildColor(1) }}>{builds[1].name}</span> is stronger in {
                                    (() => {
                                      const statTotals0 = calculateStatTotals(builds[0]);
                                      const statTotals1 = calculateStatTotals(builds[1]);
                                      const strengths = Object.entries(statTotals1)
                                        .filter(([stat, value]) => value > (statTotals0[stat] || 0))
                                        .map(([stat]) => stat.charAt(0).toUpperCase() + stat.slice(1))
                                        .slice(0, 3);
                                      return strengths.join(', ');
                                    })()
                                  }
                                </li>
                              </>
                            )}
                            {builds.length >= 3 && (
                              <li>
                                <span className="font-medium" style={{ color: getBuildColor(2) }}>{builds[2].name}</span> has the highest {
                                  (() => {
                                    const statTotals0 = calculateStatTotals(builds[0]);
                                    const statTotals1 = calculateStatTotals(builds[1]);
                                    const statTotals2 = calculateStatTotals(builds[2]);
                                    const strengths = Object.entries(statTotals2)
                                      .filter(([stat, value]) => 
                                        value > (statTotals0[stat] || 0) && 
                                        value > (statTotals1[stat] || 0)
                                      )
                                      .map(([stat]) => stat.charAt(0).toUpperCase() + stat.slice(1))
                                      .slice(0, 3);
                                    return strengths.join(', ');
                                  })()
                                }
                              </li>
                            )}
                            <li>
                              Overall, {
                                (() => {
                                  // Determine best build by highest total stats
                                  const buildTotals = builds.map(build => {
                                    const statTotals = calculateStatTotals(build);
                                    return {
                                      name: build.name,
                                      total: Object.values(statTotals).reduce((a, b) => a + b, 0),
                                      index: builds.findIndex(b => b.id === build.id)
                                    };
                                  });
                                  const bestBuild = buildTotals.sort((a, b) => b.total - a.total)[0];
                                  return (
                                    <span className="font-medium" style={{ color: getBuildColor(bestBuild.index) }}>
                                      {bestBuild.name}
                                    </span>
                                  );
                                })()
                              } has the highest combined stats.
                            </li>
                          </ul>
                        </div>
                        
                        <div className="mt-8 flex space-x-4">
                          <Button variant="outline">
                            <Copy className="mr-2 h-4 w-4" />
                            Save as New Build
                          </Button>
                          <Button variant="outline">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share Comparison
                          </Button>
                          <Button>
                            <Save className="mr-2 h-4 w-4" />
                            Export Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
