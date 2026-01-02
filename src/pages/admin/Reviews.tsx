import { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Review } from '@/types/database';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, menu_items (name)')
      .order('created_at', { ascending: false });
    if (data) setReviews(data as any);
    setIsLoading(false);
  };

  const toggleApproval = async (id: string, currentApproval: boolean) => {
    const { error } = await supabase.from('reviews').update({ is_approved: !currentApproval }).eq('id', id);
    if (error) {
      toast.error('Failed to update review');
    } else {
      toast.success(!currentApproval ? 'Review approved' : 'Review unapproved');
      fetchReviews();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('reviews').delete().eq('id', deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success('Review deleted');
      fetchReviews();
    }
    setDeleteId(null);
  };

  const filteredReviews = filterStatus === 'all' 
    ? reviews 
    : filterStatus === 'approved' 
      ? reviews.filter(r => r.is_approved)
      : reviews.filter(r => !r.is_approved);

  const pendingCount = reviews.filter(r => !r.is_approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Reviews</h1>
          <p className="text-muted-foreground">
            Moderate customer reviews
            {pendingCount > 0 && <Badge variant="destructive" className="ml-2">{pendingCount} pending</Badge>}
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No reviews found</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredReviews.map((review: any) => (
                <div key={review.id} className="p-4 hover:bg-muted/50">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Review content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= review.rating ? 'text-accent fill-accent' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                        {review.menu_items?.name && (
                          <Badge variant="outline" className="truncate max-w-[150px]">{review.menu_items.name}</Badge>
                        )}
                        <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                      {review.comment && (
                        <p className="text-foreground line-clamp-2 sm:line-clamp-none">{review.comment}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-1 shrink-0 self-end sm:self-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleApproval(review.id, review.is_approved)}
                        className={review.is_approved ? 'text-destructive' : 'text-success'}
                      >
                        {review.is_approved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(review.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
