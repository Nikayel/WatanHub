import React, { useState } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { Button } from "../ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "../ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import AuthDialog from '../Auth/AuthDialog';
import { useAuth } from '../../lib/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, signOut } = useAuth();
    const [authMode, setAuthMode] = useState('login');

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

    const handleLogin = () => {
        setAuthMode('login');
    };

    const handleSignUp = () => {
        setAuthMode('signup');
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

                                {/* Auth buttons in mobile menu */}
                                {!user ? (
                                    <>
                                        <AuthDialog
                                            mode="login"
                                            trigger={
                                                <Button
                                                    variant="outline"
                                                    className="w-full mt-2"
                                                    onClick={handleLogin}
                                                >
                                                    Login
                                                </Button>
                                            }
                                        />
                                        <AuthDialog
                                            mode="signup"
                                            trigger={
                                                <Button
                                                    className="w-full mt-2"
                                                    onClick={handleSignUp}
                                                >
                                                    Join Now
                                                </Button>
                                            }
                                        />
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full mt-2"
                                        onClick={handleLogout}
                                    >
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
                                trigger={
                                    <Button
                                        variant="ghost"
                                        onClick={handleLogin}
                                    >
                                        Login
                                    </Button>
                                }
                            />
                            <AuthDialog
                                mode="signup"
                                trigger={
                                    <Button
                                        onClick={handleSignUp}
                                    >
                                        Join Now
                                    </Button>
                                }
                            />
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