import { useState, useEffect } from 'react';
import { CalendarDays, Clock, Users, Phone, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Reservation } from '@/types/database';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-accent text-accent-foreground' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-success text-success-foreground' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-destructive text-destructive-foreground' },
  { value: 'completed', label: 'Completed', color: 'bg-primary text-primary-foreground' },
];

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true });
    if (data) setReservations(data as Reservation[]);
    setIsLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const reservation = reservations.find(r => r.id === id);
    const { error } = await supabase.from('reservations').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Reservation status updated');
      
      // Send SMS notification to user
      if (reservation?.guest_phone) {
        supabase.functions.invoke('send-sms', {
          body: {
            type: 'reservation_status',
            data: {
              status: newStatus,
              date: reservation.reservation_date,
              userPhone: reservation.guest_phone,
            },
          },
        }).catch(console.error);
      }
      
      fetchReservations();
    }
  };

  const filteredReservations = filterStatus === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const config = statusOptions.find(s => s.value === status) || statusOptions[0];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingReservations = filteredReservations.filter(r => r.reservation_date >= today);
  const pastReservations = filteredReservations.filter(r => r.reservation_date < today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Reservations</h1>
          <p className="text-muted-foreground">Manage table bookings</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upcoming Reservations */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : upcomingReservations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No upcoming reservations</div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingReservations.map((res) => (
                  <div key={res.id} className="p-4 hover:bg-muted/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Guest info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium truncate">{res.guest_name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 shrink-0" /> {format(new Date(res.reservation_date), 'MMM d, yyyy')}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" /> {res.reservation_time}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3 shrink-0" /> {res.party_size}</span>
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {res.guest_phone}</span>
                        </div>
                        {res.special_requests && <p className="text-sm text-muted-foreground italic line-clamp-1">"{res.special_requests}"</p>}
                      </div>
                      
                      {/* Status and actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        {getStatusBadge(res.status)}
                        <Select value={res.status} onValueChange={(v) => updateStatus(res.id, v)}>
                          <SelectTrigger className="w-28 sm:w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Past</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {pastReservations.slice(0, 10).map((res) => (
                  <div key={res.id} className="p-4 hover:bg-muted/50 opacity-70">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium truncate">{res.guest_name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 shrink-0" /> {format(new Date(res.reservation_date), 'MMM d, yyyy')}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" /> {res.reservation_time}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3 shrink-0" /> {res.party_size}</span>
                        </div>
                      </div>
                      <div className="self-start sm:self-center">
                        {getStatusBadge(res.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
