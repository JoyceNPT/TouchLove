import { motion } from 'framer-motion';
import { Heart, Smartphone, Image as ImageIcon, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-primary uppercase bg-primary/10 rounded-full">
              Hơn cả một món quà
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
              Gắn kết tình yêu qua{' '}
              <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                một cú chạm
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              TouchLove biến những chiếc móc khóa len thủ công thành cầu nối kỹ thuật số, 
              nơi lưu giữ những khoảnh khắc và lời chúc ngọt ngào nhất của hai bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-bold shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Bắt đầu hành trình <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/c/demo"
                className="w-full sm:w-auto px-8 py-4 glass rounded-full text-lg font-bold hover:bg-secondary transition-all"
              >
                Xem demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tại sao chọn TouchLove?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Chúng mình mang đến trải nghiệm hiện đại cho những cảm xúc truyền thống.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Smartphone className="w-8 h-8 text-blue-500" />}
              title="Công nghệ NFC"
              description="Chỉ cần chạm điện thoại vào móc khóa để mở ngay trang riêng của hai bạn."
              delay={0.1}
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8 text-primary" />}
              title="Lời chúc AI mỗi ngày"
              description="Nhận những thông điệp yêu thương được cá nhân hóa bởi AI vào mỗi buổi sáng."
              delay={0.2}
            />
            <FeatureCard
              icon={<ImageIcon className="w-8 h-8 text-green-500" />}
              title="Album kỷ niệm"
              description="Lưu giữ và chia sẻ những khoảnh khắc đẹp nhất trong không gian riêng tư."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Cách thức hoạt động</h2>
              <div className="space-y-8">
                <Step number="1" title="Sở hữu bộ móc khóa" description="Chọn mẫu móc khóa len yêu thích từ cửa hàng TouchLove." />
                <Step number="2" title="Kích hoạt & Kết nối" description="Chạm NFC để đăng ký và kết nối tài khoản với người ấy." />
                <Step number="3" title="Chia sẻ yêu thương" description="Cùng nhau xây dựng album và nhận tin nhắn ngọt ngào mỗi ngày." />
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square glass rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-pink-500/10">
                <Heart className="w-48 h-48 text-primary/20 animate-pulse absolute" />
                <img 
                  src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800" 
                  alt="Couple illustration"
                  className="rounded-2xl shadow-lg relative z-10 hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-primary to-pink-600 rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-primary/30">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Sẵn sàng để gắn kết?</h2>
            <p className="text-lg opacity-90 mb-10 max-w-xl mx-auto">
              Hãy để TouchLove trở thành người giữ hộ những kỷ niệm đẹp nhất của hai bạn.
            </p>
            <Link
              to="/register"
              className="inline-block px-10 py-4 bg-white text-primary rounded-full text-lg font-bold hover:scale-105 transition-transform"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="glass p-8 rounded-3xl hover:shadow-xl transition-all hover:-translate-y-2"
  >
    <div className="mb-6 p-3 bg-background rounded-2xl w-fit shadow-sm">{icon}</div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

const Step = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
      {number}
    </div>
    <div>
      <h4 className="text-xl font-bold mb-1">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Home;
