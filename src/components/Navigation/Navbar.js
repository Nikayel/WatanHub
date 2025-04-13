// src/components/Navigation/Navbar.js
import React from "react";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import AuthDialog from "../Auth/AuthDialog";
import { useAuth } from "../../lib/AuthContext";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ onHomeClick, onAboutClick, onContactClick }) => {
  const { user, signOut } = useAuth();

  const navItems = [
    { href: "#", label: "Home" },
    { href: "#mentors", label: "Mentors" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  const handleScrollToSection = (e, href) => {
    e.preventDefault();
    if (href === "#") {
      if (typeof onHomeClick === "function") {
        onHomeClick();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (href === "#about") {
      if (typeof onAboutClick === "function") {
        onAboutClick();
      }
      return;
    }
    if (href === "#contact") {
      if (typeof onContactClick === "function") {
        onContactClick();
      }
      return;
    }
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-14 items-center">
        <h1 className="mr-4 text-xl font-bold" aria-label="Watan Logo">
          Watan
        </h1>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1">
          <ul className="flex gap-6">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.label === "About" || item.label === "Contact" ? (
                  <button
                    className="text-sm font-medium transition-colors hover:text-primary"
                    aria-label={item.label}
                    onClick={(e) => handleScrollToSection(e, item.href)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className="text-sm font-medium transition-colors hover:text-primary"
                    aria-label={item.label}
                    onClick={(e) => handleScrollToSection(e, item.href)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden flex-1 justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <div key={item.label}>
                    {item.label === "About" || item.label === "Contact" ? (
                      <button
                        className="text-sm font-medium transition-colors hover:text-primary"
                        aria-label={item.label}
                        onClick={(e) => {
                          handleScrollToSection(e, item.href);
                          document.body.click();
                        }}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <a
                        href={item.href}
                        className="text-sm font-medium transition-colors hover:text-primary"
                        aria-label={item.label}
                        onClick={(e) => {
                          handleScrollToSection(e, item.href);
                          document.body.click();
                        }}
                      >
                        {item.label}
                      </a>
                    )}
                  </div>
                ))}
                {!user ? (
                  <>
                    <AuthDialog
                      mode="login"
                      trigger={
                        <Button variant="outline" className="w-full mt-2">
                          Login
                        </Button>
                      }
                    />
                    <Link to="/signup">
                      <Button className="w-full mt-2">Join Now</Button>
                    </Link>
                  </>
                ) : (
                  <Button variant="outline" className="w-full mt-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {!user ? (
            <>
              <AuthDialog
                mode="login"
                trigger={<Button variant="ghost">Login</Button>}
              />
              <Link to="/signup">
                <Button className="cta-button animate-Glow">Join Now</Button>
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/profile">Profile</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/dashboard">Dashboard</a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
