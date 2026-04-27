import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string;
  description: string;
  onBuy: (id: string) => void;
  onClick: (slug: string) => void;
  delay?: number;
  outOfStock?: boolean;
}

const ProductCard = ({ id, name, slug, price, image, description, onBuy, onClick, delay = 0, outOfStock = false }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      onClick={() => onClick(slug)}
      className="group relative bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer"
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-6 py-2 bg-white/90 text-zinc-900 font-bold rounded-full text-sm uppercase tracking-wider">
              Hết hàng
            </span>
          </div>
        )}
        <button 
          className="absolute top-4 right-4 p-3 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110"
          title="Yêu thích"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
              {description}
            </p>
          </div>
          <span className="text-xl font-black text-primary">
            {price}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            !outOfStock && onBuy(id);
          }}
          disabled={outOfStock}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 group/btn ${
            outOfStock 
            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-primary dark:hover:bg-primary dark:hover:text-white'
          }`}
        >
          <ShoppingCart className="w-5 h-5 transition-transform group-hover/btn:-rotate-12" />
          {outOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
