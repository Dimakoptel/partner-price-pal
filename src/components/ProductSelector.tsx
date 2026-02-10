import { motion } from "framer-motion";
import { PRODUCTS, ProductInfo } from "@/lib/calculator";

interface Props {
  selected: string | null;
  onSelect: (type: string) => void;
}

export default function ProductSelector({ selected, onSelect }: Props) {
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
          <div className="text-2xl mb-2">{p.icon}</div>
          <div className="font-medium text-sm">{p.label}</div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
        </motion.button>
      ))}
    </div>
  );
}
