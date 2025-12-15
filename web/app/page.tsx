import { PortfolioNavbar } from "@/components/PortfolioNavbar"
import { ProductTeaserCard } from "@/components/ProductTeaserCard"
import { BankingScaleHero } from "@/components/BankingScaleHero"
import CatAccordion from "@/components/CatAccordion"
import AnimatedCardStack from "@/components/AnimatedCardStack"
import { Footer } from "@/components/Footer"

export default function Page() {
  return (
    <>
      <PortfolioNavbar />
      <ProductTeaserCard />
      <BankingScaleHero />

      {/* Featured Projects Section */}
      <section id="projects" className="w-full bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Featured Projects</h2>
          <p className="text-center text-gray-600 mb-12">
            Interactive card stack showcase
          </p>
          <AnimatedCardStack />
        </div>
      </section>

      {/* Gallery Section */}
      <section className="w-full bg-white">
        <CatAccordion />
      </section>

      <Footer />
    </>
  )
}
