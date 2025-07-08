'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Crown,
  Target,
  Star
} from 'lucide-react';

export function BillingManagement() {
  const { 
    subscription, 
    isLoading, 
    isActive, 
    isCanceled, 
    isExpired, 
    daysLeft,
    upgradeToPortal,
    refreshSubscription
  } = useSubscription();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSubscriptionAction = async (action: string) => {
    setActionLoading(action);
    
    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await refreshSubscription();
      } else {
        console.error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading('portal');
    try {
      await upgradeToPortal();
    } catch (error) {
      console.error('Error opening billing portal:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'premium':
        return <Crown className="w-5 h-5 text-purple-500" />;
      case 'enterprise':
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Target className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'Pro Creator';
      case 'enterprise':
        return 'Creator Studio';
      default:
        return 'Creator (Free)';
    }
  };

  const getStatusBadge = () => {
    if (subscription?.plan === 'free') {
      return <Badge variant="secondary">Free Plan</Badge>;
    }

    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (isCanceled) {
      return <Badge variant="outline" className="text-orange-600 border-orange-300">
        Canceling
      </Badge>;
    }

    if (isActive) {
      return <Badge variant="default" className="bg-green-600">Active</Badge>;
    }

    return <Badge variant="secondary">{subscription?.status}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getPlanIcon(subscription?.plan || 'free')}
            <span>Current Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {getPlanName(subscription?.plan || 'free')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {subscription?.isYearly ? 'Annual billing' : 'Monthly billing'}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {subscription?.plan !== 'free' && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Current Period</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(subscription?.currentPeriodStart)} - {formatDate(subscription?.currentPeriodEnd)}
                  </p>
                </div>

                {daysLeft !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Next Billing</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Due now'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status Messages */}
          {isCanceled && subscription?.currentPeriodEnd && (
            <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Plan Canceling</p>
                <p className="text-orange-700">
                  Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. 
                  You'll still have access to premium features until then.
                </p>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Subscription Expired</p>
                <p className="text-red-700">
                  Your subscription has expired. Upgrade to continue using premium features.
                </p>
              </div>
            </div>
          )}

          {isActive && !isCanceled && subscription?.plan !== 'free' && (
            <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Subscription Active</p>
                <p className="text-green-700">
                  Your subscription is active and will renew automatically.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Billing Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {subscription?.plan === 'free' ? (
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleManageBilling}
                  disabled={actionLoading === 'portal'}
                  className="w-full"
                  variant="outline"
                >
                  {actionLoading === 'portal' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage Billing & Invoices
                    </>
                  )}
                </Button>

                <div className="flex space-x-2">
                  {isCanceled ? (
                    <Button 
                      onClick={() => handleSubscriptionAction('reactivate')}
                      disabled={actionLoading === 'reactivate'}
                      variant="default"
                      className="flex-1"
                    >
                      {actionLoading === 'reactivate' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Reactivating...
                        </>
                      ) : (
                        'Reactivate Subscription'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSubscriptionAction('cancel_at_period_end')}
                      disabled={actionLoading === 'cancel_at_period_end'}
                      variant="outline"
                      className="flex-1"
                    >
                      {actionLoading === 'cancel_at_period_end' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        'Cancel at Period End'
                      )}
                    </Button>
                  )}

                  <Button 
                    onClick={() => window.location.href = '/pricing'}
                    variant="outline"
                    className="flex-1"
                  >
                    Change Plan
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>
              Need help? Contact our support team at{' '}
              <a href="mailto:support@creatorsaicompass.com" className="text-primary hover:underline">
                support@creatorsaicompass.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}