import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Flame, Leaf, Star, Upload, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, Category } from '@/types/database';
import { toast } from 'sonner';

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('menu_items').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    if (itemsRes.data) setItems(itemsRes.data as MenuItem[]);
    if (catsRes.data) setCategories(catsRes.data as Category[]);
    setIsLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload image');
      console.error(uploadError);
      setIsUploading(false);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('menu-images')
      .getPublicUrl(filePath);

    setIsUploading(false);
    return urlData.publicUrl;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const form = new FormData(e.currentTarget);
    
    let imageUrl = editItem?.image_url || null;
    
    // Upload new image if selected
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const data = {
      name: form.get('name') as string,
      name_bn: form.get('name_bn') as string || null,
      description: form.get('description') as string || null,
      price: parseFloat(form.get('price') as string),
      original_price: form.get('original_price') ? parseFloat(form.get('original_price') as string) : null,
      category_id: form.get('category_id') as string || null,
      preparation_time: parseInt(form.get('preparation_time') as string) || 20,
      is_vegetarian: form.get('is_vegetarian') === 'on',
      is_spicy: form.get('is_spicy') === 'on',
      is_popular: form.get('is_popular') === 'on',
      is_available: form.get('is_available') === 'on',
      image_url: imageUrl,
    };

    const { error } = editItem
      ? await supabase.from('menu_items').update(data).eq('id', editItem.id)
      : await supabase.from('menu_items').insert(data);

    setIsSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editItem ? 'Item updated' : 'Item created');
      setIsDialogOpen(false);
      setEditItem(null);
      clearImage();
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success('Item deleted');
      fetchData();
    }
    setDeleteId(null);
  };

  const openCreate = () => { 
    setEditItem(null); 
    clearImage();
    setIsDialogOpen(true); 
  };
  
  const openEdit = (item: MenuItem) => { 
    setEditItem(item); 
    clearImage();
    if (item.image_url) {
      setImagePreview(item.image_url);
    }
    setIsDialogOpen(true); 
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Menu Items</h1>
            <p className="text-muted-foreground">Manage your restaurant menu</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No menu items yet</div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xl font-bengali text-primary/50">{item.name_bn?.charAt(0) || item.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{item.name}</p>
                        {item.is_popular && <Badge variant="outline" className="text-popular border-popular"><Star className="h-3 w-3" /></Badge>}
                        {item.is_spicy && <Badge variant="outline" className="text-spicy border-spicy"><Flame className="h-3 w-3" /></Badge>}
                        {item.is_vegetarian && <Badge variant="outline" className="text-vegetarian border-vegetarian"><Leaf className="h-3 w-3" /></Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{item.price}</p>
                      <Badge variant={item.is_available ? 'default' : 'secondary'}>{item.is_available ? 'Available' : 'Unavailable'}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
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
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Food Image</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-24 h-24">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="w-24 h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 5MB, JPG/PNG/WebP
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editItem?.description || ''} rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input id="price" name="price" type="number" step="0.01" required defaultValue={editItem?.price} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price</Label>
                  <Input id="original_price" name="original_price" type="number" step="0.01" defaultValue={editItem?.original_price || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preparation_time">Prep Time (min)</Label>
                  <Input id="preparation_time" name="preparation_time" type="number" defaultValue={editItem?.preparation_time || 20} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select name="category_id" defaultValue={editItem?.category_id || ''}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="is_available">Available</Label>
                  <Switch id="is_available" name="is_available" defaultChecked={editItem?.is_available ?? true} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="is_popular">Popular</Label>
                  <Switch id="is_popular" name="is_popular" defaultChecked={editItem?.is_popular} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="is_spicy">Spicy</Label>
                  <Switch id="is_spicy" name="is_spicy" defaultChecked={editItem?.is_spicy} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="is_vegetarian">Vegetarian</Label>
                  <Switch id="is_vegetarian" name="is_vegetarian" defaultChecked={editItem?.is_vegetarian} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving || isUploading}>
                  {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
