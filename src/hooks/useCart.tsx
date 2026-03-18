import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CalculationResult, ProductType } from "@/lib/calculator";

export interface CartItem {
  id: string;
  productType: ProductType;
  productLabel: string;
  params: any;
  result: CalculationResult;
  addedAt: string;
  selected: boolean; // for КП
}

interface CartContextType {
  items: CartItem[];
  addItem: (productType: ProductType, productLabel: string, params: any, result: CalculationResult) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  toggleAll: (selected: boolean) => void;
  clearCart: () => void;
  clearSelected: () => void;
  selectedItems: CartItem[];
  selectedTotal: number;
  /** For adding to existing lead */
  appendToLeadId: string | null;
  setAppendToLeadId: (id: string | null) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appendToLeadId, setAppendToLeadId] = useState<string | null>(null);

  const addItem = useCallback((productType: ProductType, productLabel: string, params: any, result: CalculationResult) => {
    const item: CartItem = {
      id: crypto.randomUUID(),
      productType,
      productLabel,
      params,
      result,
      addedAt: new Date().toISOString(),
      selected: true,
    };
    setItems(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const toggleItem = useCallback((id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  }, []);

  const toggleAll = useCallback((selected: boolean) => {
    setItems(prev => prev.map(i => ({ ...i, selected })));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppendToLeadId(null);
  }, []);

  const clearSelected = useCallback(() => {
    setItems(prev => prev.filter(i => !i.selected));
  }, []);

  const selectedItems = items.filter(i => i.selected);
  const selectedTotal = selectedItems.reduce((sum, i) => sum + (i.result.grandTotal || i.result.totalPrice), 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, toggleItem, toggleAll,
      clearCart, clearSelected, selectedItems, selectedTotal,
      appendToLeadId, setAppendToLeadId,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
