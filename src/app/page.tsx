import Footer from '@/components/Footer';
import Header from '@/components/Header';
import CategoryShowcase from '@/app/components/CategoryShowcase';
import { HomeCatalog } from '@/app/components/HomeCatalog';
import HeroSection from '@/app/components/HeroSection';

function DeliveryAndReturns() {
  return (
    <section className="px-6 py-16" aria-labelledby="delivery-heading">
      <div className="surface-card mx-auto grid max-w-screen-xl gap-8 p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <h2 id="delivery-heading" className="text-xl font-bold text-card-foreground">
            Delivery
          </h2>
          <p className="mt-2 leading-7 text-muted-foreground">
            Delivery quotes are unavailable in this demo. Checkout shows the item subtotal only, and
            no payment is collected.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-card-foreground">Returns</h2>
          <p className="mt-2 leading-7 text-muted-foreground">
            If an item arrives with a problem, contact Gadget Arena with your order details so we
            can review the next steps.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="dot-pattern-dark min-h-screen bg-background">
      <Header />
      <HeroSection />
      <CategoryShowcase />
      <HomeCatalog />
      <DeliveryAndReturns />
      <Footer />
    </main>
  );
}
