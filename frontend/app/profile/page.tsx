'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Loader2, Settings, User, ShieldCheck, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useAuth, withAuth, User as UserType } from '@/stores/auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    displayName: '',
    bio: ''
  });
  
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    discordNotifications: false,
    darkMode: false,
    compactLayout: false
  });
  
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    plan: 'Free',
    billingCycle: '',
    nextBillingDate: '',
    paymentMethod: '',
    isActive: true
  });
  
  // Load user data on mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (user) {
      setProfileData({
        username: user.username,
        email: user.email,
        displayName: user.displayName || '',
        bio: user.bio || ''
      });
      
      // Load user preferences
      loadUserPreferences();
      
      // Load subscription info if user is premium
      if (user.isPremium) {
        loadSubscriptionInfo();
      }
    }
  }, [user, isAuthenticated, router]);
  
  const loadUserPreferences = async () => {
    try {
      const response = await withAuth('/api/v1/users/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };
  
  const loadSubscriptionInfo = async () => {
    try {
      const response = await withAuth('/api/v1/users/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Failed to load subscription info:', error);
    }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const response = await withAuth('/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const data = await response.json();
      updateUser(data);
      setSuccess('Profile updated successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate passwords
    if (securityData.newPassword !== securityData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (securityData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await withAuth('/api/v1/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      setSuccess('Password changed successfully');
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    const updatedPreferences = {
      ...preferences,
      [key]: value
    };
    
    setPreferences(updatedPreferences);
    
    try {
      await withAuth('/api/v1/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPreferences),
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert change on failure
      setPreferences(preferences);
    }
  };
  
  const handleLogout = () => {
    logout();
    router.push('/');
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="account" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and public profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                    placeholder="How you want to be known in the community"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell us about yourself and your interest in Ashes of Creation"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={securityData.currentPassword}
                    onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : 'Change Password'}
                  </Button>
                </div>
              </form>
              
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-medium mb-4">Account Actions</h3>
                
                <div className="space-y-4">
                  <Button variant="outline" onClick={handleLogout}>
                    Sign Out of All Sessions
                  </Button>
                  
                  <div>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      This action is permanent and cannot be undone. All your data will be erased.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Notifications</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive updates and announcements via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="discordNotifications" className="text-base">Discord Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications on Discord</p>
                    </div>
                    <Switch
                      id="discordNotifications"
                      checked={preferences.discordNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('discordNotifications', checked)}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="darkMode" className="text-base">Dark Mode</Label>
                        <p className="text-sm text-gray-500">Use dark theme for the interface</p>
                      </div>
                      <Switch
                        id="darkMode"
                        checked={preferences.darkMode}
                        onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="compactLayout" className="text-base">Compact Layout</Label>
                        <p className="text-sm text-gray-500">Reduce spacing in the interface</p>
                      </div>
                      <Switch
                        id="compactLayout"
                        checked={preferences.compactLayout}
                        onCheckedChange={(checked) => handlePreferenceChange('compactLayout', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Your Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-4">Current Plan: {subscriptionInfo.plan}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptionInfo.billingCycle && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Billing Cycle</h4>
                        <p>{subscriptionInfo.billingCycle}</p>
                      </div>
                    )}
                    
                    {subscriptionInfo.nextBillingDate && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Next Billing Date</h4>
                        <p>{subscriptionInfo.nextBillingDate}</p>
                      </div>
                    )}
                    
                    {subscriptionInfo.paymentMethod && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Payment Method</h4>
                        <p>{subscriptionInfo.paymentMethod}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Status</h4>
                      <p>{subscriptionInfo.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>
                
                {user?.isPremium ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Subscription Management</h3>
                    
                    <div className="flex flex-wrap gap-4">
                      <Button variant="outline">Update Payment Method</Button>
                      <Button variant="outline">View Billing History</Button>
                      <Button variant="destructive">Cancel Subscription</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Upgrade Your Experience</h3>
                    
                    <p className="text-gray-600">
                      Upgrade to Premium for advanced features:
                    </p>
                    
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>Save unlimited character builds</li>
                      <li>Access to premium calculators and tools</li>
                      <li>Early access to new features</li>
                      <li>Ad-free experience</li>
                      <li>Priority support</li>
                    </ul>
                    
                    <Button className="mt-4">
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
