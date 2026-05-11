import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowRight,
  Calculator,
  Info
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { cn, formatCurrency } from '@/src/lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function MealPlannerPage() {
  const [mealItems, setMealItems] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'lunch' });
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        // Fetch User Profile
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) setUserProfile(docSnap.data());
          else navigate('/onboarding');
        });

        // Fetch Meal Items
        const q = query(collection(db, `users/${user.uid}/meals`));
        const unsubMeals = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMealItems(items);
          setIsLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/meals`);
        });

        return () => {
          unsubProfile();
          unsubMeals();
        };
      }
    });
    return unsubAuth;
  }, [navigate]);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !auth.currentUser) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/meals`), {
        ...newItem,
        price: Number(newItem.price),
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNewItem({ name: '', price: '', category: 'lunch' });
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/meals`, id));
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  const categories = ['breakfast', 'lunch', 'dinner'];

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">Meal Inventory</h1>
        <p className="mt-2 text-sm text-slate-500 font-medium tracking-tight">Manage your food items and local pricing.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Add New Item */}
        <div className="col-span-12 lg:col-span-4 capitalize">
          <div className="sticky top-24 space-y-6 rounded-[2.5rem] bg-white p-8 shadow-sm border border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add New Item</h3>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Expanding your logic</p>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="Item Name" 
                placeholder="Ex. Chicken Breast" 
                value={newItem.name}
                className="h-11 text-sm"
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
              <Input 
                label="Price (PKR)" 
                type="number" 
                placeholder="0.00" 
                value={newItem.price}
                className="h-11 text-sm"
                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                <select 
                  className="w-full h-11 rounded-xl bg-slate-50 border-none px-4 text-xs font-bold focus:bg-white transition-all focus:ring-4 focus:ring-emerald-500/5 outline-none"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <Button 
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black tracking-widest uppercase text-xs mt-4" 
                onClick={handleAddItem}
                isLoading={isAdding}
              >
                <Plus size={18} className="mr-2" /> Add to Database
              </Button>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-6 flex items-start gap-4">
              <Info className="text-indigo-600 shrink-0" size={20} />
              <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                AI uses these items and prices to generate your meal strategies. Accurate prices mean better savings.
              </p>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {categories.map((cat) => (
            <section key={cat} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">{cat} Selection</h3>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {mealItems.filter(m => m.category === cat).map((item) => (
                  <div key={item.id} className="group relative flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-xl shadow-inner border border-slate-100">
                        {cat === 'breakfast' ? '🥪' : cat === 'lunch' ? '🍱' : '🥘'}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 tracking-tight">{item.name}</h4>
                        <p className="text-sm font-black text-emerald-600">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {mealItems.filter(m => m.category === cat).length === 0 && (
                  <div className="col-span-full py-12 text-center rounded-[2rem] border-2 border-dashed border-slate-100 italic text-slate-300 text-sm font-medium">
                    No {cat} items added yet.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
