'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BillingManagement } from '@/components/subscription/BillingManagement';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  CreditCard, 
  ArrowLeft, 
  Shield, 
  FileText,
  Download,
  Calendar,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function BillingSettingsPage() {
  const { features, subscription } = useSubscription();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, billing information, and download invoices.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Main Billing Management */}
        <BillingManagement />

        {/* Current Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Plan Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Platform Access</span>
                  <Badge variant="outline">
                    {features.maxPlatforms === 999 ? 'Unlimited' : `${features.maxPlatforms} platforms`}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress Tracking</span>
                  <Badge variant="outline">
                    {features.maxProgressDays} days
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Advanced Analytics</span>
                  <Badge variant={features.hasAdvancedAnalytics ? 'default' : 'secondary'}>
                    {features.hasAdvancedAnalytics ? 'Included' : 'Not included'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Premium Templates</span>
                  <Badge variant={features.hasPremiumTemplates ? 'default' : 'secondary'}>
                    {features.hasPremiumTemplates ? 'Included' : 'Not included'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Priority Support</span>
                  <Badge variant={features.hasPrioritySupport ? 'default' : 'secondary'}>
                    {features.hasPrioritySupport ? 'Included' : 'Not included'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Export Reports</span>
                  <Badge variant={features.hasExportReports ? 'default' : 'secondary'}>
                    {features.hasExportReports ? 'Included' : 'Not included'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Team Features</span>
                  <Badge variant={features.hasTeamCollaboration ? 'default' : 'secondary'}>
                    {features.hasTeamCollaboration ? 'Included' : 'Not included'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Access</span>
                  <Badge variant={features.hasApiAccess ? 'default' : 'secondary'}>
                    {features.hasApiAccess ? 'Included' : 'Not included'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Billing History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription?.plan === 'free' ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Billing History</h3>
                <p className="text-muted-foreground mb-4">
                  You're currently on the free plan. Upgrade to start tracking your billing history.
                </p>
                <Button onClick={() => window.location.href = '/pricing'}>
                  View Plans
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Download className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {subscription?.plan === 'premium' ? 'Pro Creator' : 'Creator Studio'} - {subscription?.isYearly ? 'Annual' : 'Monthly'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.currentPeriodStart ? 
                          new Date(subscription.currentPeriodStart).toLocaleDateString() : 
                          'Current period'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Paid
                  </Badge>
                </div>

                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    For detailed billing history and invoices, use the billing portal.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // This would open the Stripe customer portal
                      window.open('https://billing.stripe.com/p/login/test_...');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Billing Portal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Billing Questions</h4>
                  <p className="text-sm text-muted-foreground">
                    Have questions about your subscription or billing?{' '}
                    <a href="mailto:billing@creatorsaicompass.com" className="text-primary hover:underline">
                      Contact billing support
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Refund Policy</h4>
                  <p className="text-sm text-muted-foreground">
                    We offer a 30-day money-back guarantee on all paid plans.{' '}
                    <a href="/refund-policy" className="text-primary hover:underline">
                      Learn more
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}