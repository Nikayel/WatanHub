import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from "../ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "../ui/sheet";
import { cn } from "../../lib/utils";
import './Navbar.css';

const Navbar = () => {
    const navItems = [
        { href: "#", label: "Home" },
        { href: "#mentors", label: "Mentors" },
        { href: "#about", label: "About" },
        { href: "#contact", label: "Contact" },
    ];

    // Handle smooth scrolling when clicking on navigation links
    const handleScrollToSection = (e, href) => {
        e.preventDefault();

        // If it's the home link, scroll to top
        if (href === "#") {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            return;
        }

        // For other sections, find the element and scroll to it
        const targetElement = document.querySelector(href);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
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
                                <a
                                    href={item.href}
                                    className="text-sm font-medium transition-colors hover:text-primary"
                                    aria-label={item.label}
                                    onClick={(e) => handleScrollToSection(e, item.href)}
                                >
                                    {item.label}
                                </a>
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
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="text-sm font-medium transition-colors hover:text-primary"
                                        aria-label={item.label}
                                        onClick={(e) => {
                                            handleScrollToSection(e, item.href);
                                            // Close the sheet after clicking a link on mobile
                                            document.body.click();
                                        }}
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Join Now Button */}
                <div className="hidden md:block">
                    <Button className="ml-4" aria-label="Join our mentorship program">
                        Join Now
                    </Button>
                </div>
            </nav>
        </header>
    );
};

export default Navbar; 