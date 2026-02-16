import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Users, ArrowRight, Star, Wifi, Coffee, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const featuredRooms = [
    {
      id: 1,
      name: "Deluxe Ocean View",
      price: 250,
      capacity: 2,
      size: "45m²",
      image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800",
      features: ["King Bed", "Ocean View", "Balcony"]
    },
    {
      id: 2,
      name: "Executive Suite",
      price: 450,
      capacity: 4,
      size: "75m²",
      image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=800",
      features: ["2 Bedrooms", "Living Area", "Kitchenette"]
    },
    {
      id: 3,
      name: "Garden Villa",
      price: 380,
      capacity: 3,
      size: "60m²",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800",
      features: ["Private Garden", "Plunge Pool", "Patio"]
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hotel-hero.png" 
            alt="Luxury Hotel" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="container relative z-10 text-center text-white space-y-6">
          <span className="uppercase tracking-[0.2em] text-sm font-medium text-secondary">Welcome to LuxeStay</span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight">
            Experience Luxury <br /> Like Never Before
          </h1>
          <p className="max-w-xl mx-auto text-lg text-white/90">
            Discover a sanctuary of elegance and tranquility, where every detail is curated for your comfort.
          </p>
          
          {/* Booking Widget */}
          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl max-w-4xl mx-auto mt-12 flex flex-col md:flex-row gap-4 items-end text-left">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Check In</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-transparent border-input/50", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Check Out</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent border-input/50">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Select date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="w-full md:w-40 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Guests</label>
              <Select defaultValue="2">
                <SelectTrigger className="bg-transparent border-input/50">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Guest</SelectItem>
                  <SelectItem value="2">2 Guests</SelectItem>
                  <SelectItem value="3">3 Guests</SelectItem>
                  <SelectItem value="4">4+ Guests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full md:w-auto bg-primary text-primary-foreground h-10 px-8">
              Check Availability
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif text-4xl font-bold text-primary">Our Accommodations</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed for comfort and style, our rooms offer the perfect blend of modern amenities and timeless elegance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {featuredRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden group border-none shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={room.image} 
                    alt={room.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-primary">
                    ${room.price}/night
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold mb-1">{room.name}</h3>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {room.capacity} Guests</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {room.size}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {room.features.map((feature, i) => (
                      <span key={i} className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Preview */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="font-serif text-4xl font-bold text-primary">World-Class Amenities</h2>
              <p className="text-muted-foreground">
                Immerse yourself in a world of relaxation and recreation. From our infinity pool to our award-winning spa, every moment is designed to rejuvenate your senses.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <Wifi className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">High-Speed Wi-Fi</h4>
                    <p className="text-xs text-muted-foreground">Stay connected anywhere</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <Coffee className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Gourmet Dining</h4>
                    <p className="text-xs text-muted-foreground">International cuisine</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <Star className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Luxury Spa</h4>
                    <p className="text-xs text-muted-foreground">Holistic treatments</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Concierge Service</h4>
                    <p className="text-xs text-muted-foreground">24/7 assistance</p>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="mt-4">Explore All Amenities</Button>
            </div>
            
            <div className="relative">
              <div className="aspect-[4/5] rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800" 
                  alt="Hotel Amenities" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded shadow-xl max-w-xs hidden md:block">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-secondary fill-secondary" />
                  <Star className="h-5 w-5 text-secondary fill-secondary" />
                  <Star className="h-5 w-5 text-secondary fill-secondary" />
                  <Star className="h-5 w-5 text-secondary fill-secondary" />
                  <Star className="h-5 w-5 text-secondary fill-secondary" />
                </div>
                <p className="font-serif italic text-lg mb-2">"The best hotel experience I've ever had. Truly magical."</p>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">- Sarah Jenkins</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}