import { PortfolioNavbar } from "@/components/PortfolioNavbar"
import { Footer } from "@/components/Footer"
import Link from "next/link"

// Tool categories with planned tools
const toolCategories = [
  {
    id: "image-tools",
    name: "🎨 Image Tools",
    description: "Enhance and transform your images",
    tools: [
      {
        name: "Border Frame Generator",
        description: "Add elegant borders and frames to your images",
        status: "planned",
        icon: "🖼️",
      },
      {
        name: "Batch Watermark",
        description: "Add watermarks to multiple images at once",
        status: "planned",
        icon: "💧",
      },
      {
        name: "Image Compressor",
        description: "Reduce image file size without quality loss",
        status: "planned",
        icon: "📦",
      },
    ],
  },
  {
    id: "stealth-games",
    name: "🎮 Stealth Games",
    description: "Games disguised as terminal/IDE interfaces",
    tools: [
      {
        name: "Terminal Chess",
        description: "Play chess in a terminal-styled interface",
        status: "planned",
        icon: "♟️",
      },
      {
        name: "Code Golf Challenge",
        description: "Solve coding puzzles disguised as work",
        status: "planned",
        icon: "⛳",
      },
      {
        name: "Terminal Tetris",
        description: "Classic Tetris in terminal style",
        status: "planned",
        icon: "🧱",
      },
      {
        name: "VS Code Minesweeper",
        description: "Minesweeper that looks like a code editor",
        status: "planned",
        icon: "💣",
      },
    ],
  },
  {
    id: "dev-utils",
    name: "🛠️ Developer Utils",
    description: "Handy tools for daily development",
    tools: [
      {
        name: "JSON Formatter",
        description: "Format and validate JSON data",
        status: "planned",
        icon: "📋",
      },
      {
        name: "Base64 Encoder/Decoder",
        description: "Convert text to/from Base64",
        status: "planned",
        icon: "🔐",
      },
      {
        name: "Color Picker",
        description: "Pick and convert colors between formats",
        status: "planned",
        icon: "🎨",
      },
      {
        name: "Regex Tester",
        description: "Test and debug regular expressions",
        status: "planned",
        icon: "🔍",
      },
    ],
  },
]

export default function ToolsPage() {
  return (
    <>
      <PortfolioNavbar />

      {/* Hero Section */}
      <section className="w-full px-8 pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Tools & Utilities
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A collection of handy tools and creative projects. Some are practical, others are just for fun 😉
            </p>
          </div>
        </div>
      </section>

      {/* Tools Gallery */}
      <section className="w-full px-8 pb-24">
        <div className="max-w-7xl mx-auto space-y-20">
          {toolCategories.map((category) => (
            <div key={category.id} className="space-y-8">
              {/* Category Header */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h2>
                <p className="text-gray-600">{category.description}</p>
              </div>

              {/* Tool Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Coming Soon Badge */}
                    {tool.status === "planned" && (
                      <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                        Coming Soon
                      </div>
                    )}

                    {/* Tool Icon */}
                    <div className="text-5xl mb-4">{tool.icon}</div>

                    {/* Tool Info */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {tool.description}
                    </p>

                    {/* Action Button */}
                    <button
                      className="text-blue-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all cursor-not-allowed opacity-50"
                      disabled
                    >
                      {tool.status === "planned" ? "In Development" : "Try It"}
                      <span>→</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-8 py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Have an idea for a tool?
          </h2>
          <p className="text-gray-600 mb-8">
            I'm always looking for interesting tool ideas to build. Feel free to suggest one!
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
