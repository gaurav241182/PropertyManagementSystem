import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Hotel } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 font-serif font-bold text-xl cursor-pointer">
              <Hotel className="h-6 w-6 text-primary" />
              <span>LuxeStay</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/"><span className="hover:text-primary transition-colors cursor-pointer">Home</span></Link>
            <Link href="/rooms"><span className="hover:text-primary transition-colors cursor-pointer">Rooms</span></Link>
            <Link href="/dining"><span className="hover:text-primary transition-colors cursor-pointer">Dining</span></Link>
            <Link href="/about"><span className="hover:text-primary transition-colors cursor-pointer">About Us</span></Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">Owner Login</Button>
            </Link>
            <Button size="sm" className="bg-primary text-primary-foreground font-medium">
              Book Now
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-serif font-bold text-xl">
              <Hotel className="h-6 w-6" />
              <span>LuxeStay</span>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Experience luxury and comfort in the heart of the city. Your perfect getaway awaits.
            </p>
          </div>
          
          <div>
            <h3 className="font-serif font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>123 Luxury Avenue</li>
              <li>New York, NY 10001</li>
              <li>+1 (555) 123-4567</li>
              <li>concierge@luxestay.com</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-serif font-semibold mb-4">Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>About Us</li>
              <li>Rooms & Suites</li>
              <li>Dining</li>
              <li>Spa & Wellness</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-serif font-semibold mb-4">Newsletter</h3>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-primary-foreground/10 border border-primary-foreground/20 rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-secondary"
              />
              <Button size="sm" variant="secondary">Subscribe</Button>
            </div>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/50">
          © 2024 LuxeStay Hotel. All rights reserved.
        </div>
      </footer>
    </div>
  );
}