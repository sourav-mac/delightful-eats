import { useState, useEffect } from 'react';
import { CalendarDays, Clock, Users, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Reservation } from '@/types/database';
import { toast } from 'sonner';
import { format } from 'date-fns';

const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
];

export default function Reservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) fetchReservations();
  }, [user]);

  const fetchReservations = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user?.id)
      .order('reservation_date', { ascending: false });
    if (data) setReservations(data as Reservation[]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to make a reservation');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from('reservations').insert({
      user_id: user.id,
      guest_name: formData.get('name') as string,
      guest_email: formData.get('email') as string,
      guest_phone: formData.get('phone') as string,
      party_size: parseInt(formData.get('party_size') as string),
      reservation_date: formData.get('date') as string,
      reservation_time: formData.get('time') as string,
      special_requests: formData.get('requests') as string,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      setShowSuccess(true);
      fetchReservations();
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-accent text-accent-foreground';
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = format(tomorrow, 'yyyy-MM-dd');

  return (
    <Layout>
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold">Table Reservation</h1>
          <p className="text-muted-foreground mt-2">Book your table for an unforgettable dining experience</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Reservation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Make a Reservation</CardTitle>
              <CardDescription>Fill in the details to book your table</CardDescription>
            </CardHeader>
            <CardContent>
              {showSuccess && (
                <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <p className="text-success font-medium">Reservation submitted! We'll confirm shortly.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" required placeholder="+880 1XXX" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="your@email.com" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required min={minDate} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Select name="time" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="party_size">Guests</Label>
                    <Select name="party_size" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'guest' : 'guests'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requests">Special Requests (Optional)</Label>
                  <Textarea id="requests" name="requests" placeholder="Any dietary requirements or special occasions?" rows={3} />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || !user}>
                  {!user ? 'Sign in to Reserve' : isSubmitting ? 'Submitting...' : 'Book Table'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Reservations */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <p className="text-muted-foreground text-center py-8">Sign in to view your reservations</p>
                ) : reservations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reservations yet</p>
                ) : (
                  <div className="space-y-4">
                    {reservations.slice(0, 5).map((res) => (
                      <div key={res.id} className="p-4 border border-border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <span className="font-medium">{format(new Date(res.reservation_date), 'MMM d, yyyy')}</span>
                          </div>
                          <Badge className={getStatusColor(res.status)}>{res.status}</Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {res.reservation_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {res.party_size} guests
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="bg-secondary">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-display font-semibold">Restaurant Hours</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Mon - Thu: 11:00 AM - 10:00 PM</p>
                  <p>Fri - Sun: 11:00 AM - 11:00 PM</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    For large parties (10+) or special events, please call us at <span className="text-foreground font-medium">+880 1234-567890</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
