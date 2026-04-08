// Navbar — Row 2 of the header. Single clean row, three zones.
// Left:   logo + site title / subtitle
// Center: primary nav (Services / Government / Jobs / City Profile)
// Right:  About BetterGensan · Search · Language selector
// Mobile: collapses to a hamburger drawer.
//
// Secondary links (Join Us, Official Gov.ph, Official City Website) live in
// the footer to keep this row uncluttered.

import React, { useState } from 'react';
import { X, Menu, ChevronDown, Globe, Search } from 'lucide-react';
import { mainNavigation } from '../../data/navigation';
import type { LanguageType } from '../../types/index';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n/languages';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { t, i18n } = useTranslation('common');

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) setActiveMenu(null);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setActiveMenu(null);
  };

  const toggleSubmenu = (label: string) => {
    setActiveMenu(activeMenu === label ? null : label);
  };

  const changeLanguage = (newLanguage: LanguageType) => {
    i18n.changeLanguage(newLanguage);
  };

  const navKey = (label: string) =>
    `navbar.${label.replace(/\s+/g, '').toLowerCase()}`;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-[1100px] px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* ---------- Left: logo + title ---------- */}
          <Link
            to="/"
            aria-label="BetterGensan home"
            className="flex shrink-0 items-center gap-2.5"
          >
            <img
              src="/logo.png"
              alt=""
              className="h-11 w-11 object-contain"
            />
            <div className="hidden leading-tight sm:block">
              <div className="text-base font-bold text-gray-900">
                BetterGensan
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                Citizen Portal
              </div>
            </div>
          </Link>

          {/* ---------- Center: primary nav ---------- */}
          <div className="hidden flex-1 items-center justify-center gap-6 lg:flex">
            {mainNavigation.map(item => (
              <div key={item.label} className="group relative">
                <a
                  href={item.href}
                  className="flex items-center text-sm font-medium text-gray-700 transition-colors hover:text-primary-700"
                >
                  {t(navKey(item.label))}
                  {item.children && (
                    <ChevronDown className="ml-1 h-3.5 w-3.5 text-gray-500 transition-colors group-hover:text-primary-700" />
                  )}
                </a>
                {item.children && (
                  <div className="invisible absolute left-1/2 z-50 mt-2 w-56 -translate-x-1/2 rounded-md bg-white opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      {item.children.map(child => (
                        <Link
                          key={child.label}
                          to={child.href}
                          className="block px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                          role="menuitem"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ---------- Right: about · search · language ---------- */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              to="/about"
              className="text-xs font-medium text-gray-600 transition-colors hover:text-primary-700"
            >
              About
            </Link>
            <button
              type="button"
              aria-label="Search"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-700"
            >
              <Search className="h-4 w-4" />
            </button>
            <select
              value={i18n.language}
              onChange={e => changeLanguage(e.target.value as LanguageType)}
              aria-label="Language"
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-primary-600 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* ---------- Mobile hamburger ---------- */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Mobile drawer ---------- */}
      <div className={`lg:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="space-y-1 border-t border-gray-200 bg-white px-2 pb-4 pt-2">
          {mainNavigation.map(item => (
            <div key={item.label}>
              <button
                onClick={() => toggleSubmenu(item.label)}
                className="flex w-full items-center justify-between px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-700"
              >
                {t(navKey(item.label))}
                {item.children && (
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      activeMenu === item.label ? 'rotate-180 transform' : ''
                    }`}
                  />
                )}
              </button>
              {item.children && activeMenu === item.label && (
                <div className="space-y-1 bg-gray-50 py-2 pl-6">
                  {item.children.map(child => (
                    <Link
                      key={child.label}
                      to={child.href}
                      onClick={closeMenu}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-700"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            to="/about"
            onClick={closeMenu}
            className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-700"
          >
            About BetterGensan
          </Link>
          <Link
            to="/join-us"
            onClick={closeMenu}
            className="block px-4 py-2 text-base font-semibold text-primary-700 hover:bg-primary-50"
          >
            Join Us
          </Link>
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center">
              <Globe className="mr-2 h-5 w-5 text-gray-700" />
              <select
                value={i18n.language}
                onChange={e => changeLanguage(e.target.value as LanguageType)}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:border-primary-600 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
              >
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
