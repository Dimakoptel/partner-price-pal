import { motion } from "framer-motion";
import { PRODUCTS, ProductInfo } from "@/lib/calculator";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface Props {
  selected: string | null;
  onSelect: (type: string) => void;
}

export default function ProductSelector({ selected, onSelect }: Props) {
  const { getSetting } = useCompanySettings();

  const getProductIcon = (product: ProductInfo) => {
    const customIcon = getSetting(`product_icon_${product.type}`);
    if (!customIcon) return <span className="text-2xl">{product.icon}</span>;
    if (customIcon.startsWith("http")) {
      return <img src={customIcon} alt={product.label} className="w-8 h-8 object-contain" />;
    }
    return <span className="text-2xl">{customIcon}</span>;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {PRODUCTS.map((p, i) => (
        <motion.button
          key={p.type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(p.type)}
          className={`glass-panel p-4 text-left transition-all duration-200 hover:border-primary/50 ${
            selected === p.type
              ? "border-primary glow-primary bg-primary/5"
              : "hover:bg-card"
          }`}
        >
          <div className="mb-2">{getProductIcon(p)}</div>
          <div className="font-medium text-sm">{p.label}</div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
        </motion.button>
      ))}
    </div>
  );
}
