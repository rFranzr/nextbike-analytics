import Image from "next/image";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Image
                  src="/logo.webp"
                  alt="Nextbike Analytics Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                   Nextbike Analytics
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Analyze your Nextbike ride history with detailed statistics, visualizations, and insights. 📊
              </p>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-2">
                100% client-side • No backend • No cookies • Your data stays in your browser
              </p>
            </div>

            {/* Overview Image */}
            <Card>
              <CardContent className="p-0">
                <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                  <Image
                    src="/map.webp"
                    alt="Nextbike Analytics Dashboard Overview"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </CardContent>
            </Card>

            {/* Login Section */}
            <div className="flex justify-center">
              <div className="w-full">
                <LoginForm />
              </div>
            </div>


            {/* Features Section */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>📈</span> Comprehensive Statistics
                  </CardTitle>
                  <CardDescription>
                    View total rides, distance, duration, and averages per ride day. Get the full picture of your cycling journey!
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🗺️</span> Visual Analytics
                  </CardTitle>
                  <CardDescription>
                    Explore your riding patterns with heatmaps, histograms, and interactive maps. See your data come to life!
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>📅</span> Monthly Breakdown
                  </CardTitle>
                  <CardDescription>
                    Track your progress over time with detailed monthly statistics. Watch your cycling habits evolve!
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🚲</span> Favorite Bike
                  </CardTitle>
                  <CardDescription>
                    Discover which bike you ride most frequently. Find your trusty steed!
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nextbike Analytics. Made with ❤️ for the Nextbike community 🚴‍♂️🚴‍♀️
            </p>
            <a
              href="https://github.com/yourusername/nextbike-analysis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}


