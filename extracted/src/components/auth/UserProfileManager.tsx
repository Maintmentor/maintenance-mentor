import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { User, Settings, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import TwoFactorSetup from './TwoFactorSetup';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { useSearchParams } from 'react-router-dom';
import GoogleSheetsCard from '@/components/profile/GoogleSheetsCard';


export const UserProfileManager: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { roles, permissions } = usePermissions();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    property_type: '',
    number_of_beds: 1
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        property_type: profile.property_type || '',
        number_of_beds: profile.number_of_beds || 1
      });
    }
  }, [profile]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <User className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Profile Management</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="2fa">2FA</TabsTrigger>
        </TabsList>


        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="property_type">Property Type</Label>
                    <Input
                      id="property_type"
                      value={formData.property_type}
                      onChange={(e) => handleInputChange('property_type', e.target.value)}
                      placeholder="e.g., Apartment, House"
                    />
                  </div>

                  <div>
                    <Label htmlFor="number_of_beds">Number of Bedrooms</Label>
                    <Input
                      id="number_of_beds"
                      type="number"
                      value={formData.number_of_beds}
                      onChange={(e) => handleInputChange('number_of_beds', parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>

                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <GoogleSheetsCard />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionManager />
        </TabsContent>



        <TabsContent value="roles" className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Roles & Permissions</span>
              </CardTitle>
              <CardDescription>Your current roles and access permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Assigned Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <Badge key={role} variant="secondary" className="capitalize">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No roles assigned</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissions).map(([resource, actions]) => (
                    <Card key={resource} className="p-4">
                      <h4 className="font-medium capitalize mb-2">
                        {resource.replace('_', ' ')}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(actions).map(([action, hasPermission]) => (
                          hasPermission && (
                            <Badge key={action} variant="outline" className="text-xs">
                              {action}
                            </Badge>
                          )
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email Address</h4>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Badge variant={user?.email_confirmed_at ? 'default' : 'destructive'}>
                  {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Last Sign In</h4>
                  <p className="text-sm text-muted-foreground">
                    {user?.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Account Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleString()
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2fa" className="space-y-6">
          <TwoFactorSetup onSetupComplete={() => setMessage('2FA setup completed successfully!')} />
        </TabsContent>
      </Tabs>
    </div>
  );
};