import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

export default function DashboardPage() {
  // TODO: Fetch real data from Supabase
  const stats = {
    pendingReviews: 5,
    respondedThisWeek: 12,
    averageRating: 4.3,
    totalReviews: 127,
  };

  const recentReviews = [
    {
      id: '1',
      reviewerName: 'John D.',
      rating: 5,
      text: 'Excellent service! Very professional and quick.',
      date: '2 hours ago',
      status: 'pending',
    },
    {
      id: '2',
      reviewerName: 'Sarah M.',
      rating: 4,
      text: 'Good experience overall. Would recommend.',
      date: '5 hours ago',
      status: 'responded',
    },
    {
      id: '3',
      reviewerName: 'Mike R.',
      rating: 2,
      text: 'Service was slow, had to wait longer than expected.',
      date: '1 day ago',
      status: 'pending',
    },
  ];

  return (
    <div>
      <Header
        title="Dashboard"
        description="Welcome back! Here's an overview of your reviews."
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            subtitle="Need attention"
            variant="warning"
          />
          <StatCard
            title="Responded This Week"
            value={stats.respondedThisWeek}
            subtitle="Great progress!"
            variant="success"
          />
          <StatCard
            title="Average Rating"
            value={stats.averageRating.toFixed(1)}
            subtitle="Out of 5 stars"
            variant="info"
          />
          <StatCard
            title="Total Reviews"
            value={stats.totalReviews}
            subtitle="All time"
            variant="default"
          />
        </div>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start justify-between p-4 border border-gray-100 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{review.reviewerName}</span>
                      <span className="text-yellow-500">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                      <Badge
                        variant={
                          review.status === 'pending' ? 'warning' : 'success'
                        }
                        size="sm"
                      >
                        {review.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{review.text}</p>
                    <p className="text-gray-400 text-xs mt-1">{review.date}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="/reviews"
              className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              View all reviews →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}) {
  const variants = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
  };

  return (
    <Card className={variants[variant]}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
