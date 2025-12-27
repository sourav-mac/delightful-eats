import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/database';
import { toast } from 'sonner';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data as Category[]);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get('name') as string,
      name_bn: form.get('name_bn') as string || null,
      description: form.get('description') as string || null,
      sort_order: parseInt(form.get('sort_order') as string) || 0,
      is_active: form.get('is_active') === 'on',
    };

    const { error } = editItem
      ? await supabase.from('categories').update(data).eq('id', editItem.id)
      : await supabase.from('categories').insert(data);

    setIsSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editItem ? 'Category updated' : 'Category created');
      setIsDialogOpen(false);
      setEditItem(null);
      fetchCategories();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('categories').delete().eq('id', deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success('Category deleted');
      fetchCategories();
    }
    setDeleteId(null);
  };

  const openCreate = () => { setEditItem(null); setIsDialogOpen(true); };
  const openEdit = (item: Category) => { setEditItem(item); setIsDialogOpen(true); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Categories</h1>
            <p className="text-muted-foreground">Organize your menu items</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No categories yet</div>
            ) : (
              <div className="divide-y divide-border">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{cat.name}</p>
                        {cat.name_bn && <span className="text-sm font-bengali text-muted-foreground">({cat.name_bn})</span>}
                      </div>
                      {cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}
                    </div>
                    <Badge variant={cat.is_active ? 'default' : 'secondary'}>{cat.is_active ? 'Active' : 'Inactive'}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required defaultValue={editItem?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_bn">Bengali Name</Label>
                  <Input id="name_bn" name="name_bn" defaultValue={editItem?.name_bn || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editItem?.description || ''} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input id="sort_order" name="sort_order" type="number" defaultValue={editItem?.sort_order || 0} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch id="is_active" name="is_active" defaultChecked={editItem?.is_active ?? true} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
              <AlertDialogDescription>This will not delete menu items in this category, but they will become uncategorized.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
