import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { MenuCard } from '@/components/menu/MenuCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MenuItem, Category } from '@/types/database';
import { Search, Filter } from 'lucide-react';

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsRes, categoriesRes] = await Promise.all([
      supabase.from('menu_items').select('*').eq('is_available', true),
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
    ]);

    if (itemsRes.data) setItems(itemsRes.data as MenuItem[]);
    if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    setIsLoading(false);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold">Our Menu</h1>
          <p className="text-muted-foreground mt-2">Discover authentic Bengali flavors</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search dishes..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>All</Button>
            {categories.map((cat) => (
              <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">No dishes found</div>
        )}
      </div>
    </Layout>
  );
}
